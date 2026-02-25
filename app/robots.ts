import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXTAUTH_URL ?? "https://alonha.vn";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/moi-gioi", "/tai-khoan", "/api/"] },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
