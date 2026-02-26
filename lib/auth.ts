import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

const secret =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  (process.env.NODE_ENV === "development" ? "dev-secret-alonha-min-32-characters-long" : undefined);

if (!secret && process.env.NODE_ENV === "production") {
  console.error("Missing NEXTAUTH_SECRET or AUTH_SECRET. Set it in .env for production.");
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret,
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).toLowerCase().trim();
        const user = await prisma.user.findFirst({
          where: { email, passwordHash: { not: null } },
        });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(String(credentials.password), user.passwordHash);
        if (!ok) return null;
        if (user.isLocked) return null;
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
          role: user.role,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
      : []),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const existing = await prisma.user.findFirst({ where: { email: user.email.toLowerCase() } });
        if (!existing) {
          await prisma.user.create({
            data: {
              email: user.email.toLowerCase(),
              name: user.name ?? user.email,
              avatar: user.image ?? undefined,
              role: "USER",
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "credentials" && "id" in user && "role" in user) {
          token.id = user.id;
          token.role = user.role;
        } else if (account?.provider === "google" && user.email) {
          const dbUser = await prisma.user.findFirst({
            where: { email: user.email.toLowerCase() },
          });
          if (dbUser && !dbUser.isLocked) {
            token.id = dbUser.id;
            token.role = dbUser.role;
          }
        }
        token.sub = (token.id ?? (user as { id?: string }).id) as string | undefined;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? token.sub) as string;
        session.user.role = (token.role ?? "GUEST") as UserRole;
        if (token.picture) {
          session.user.image = token.picture;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/dang-nhap",
  },
});
