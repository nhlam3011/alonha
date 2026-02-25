import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id: string;
    email: string | null;
    name: string;
    image: string | null;
    role: UserRole;
  }
  interface Session {
    user: User & { id: string; role: UserRole };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
  }
}
