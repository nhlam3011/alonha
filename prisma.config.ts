import "dotenv/config";
import { defineConfig, env } from "prisma/config";

function withPgbouncerSafe(url: string): string {
  try {
    const u = new URL(url);
    // Nếu dùng pooler (pgbouncer), tắt statement cache để tránh lỗi prepared statement
    if (!u.searchParams.has("pgbouncer")) u.searchParams.set("pgbouncer", "true");
    if (!u.searchParams.has("statement_cache_size")) u.searchParams.set("statement_cache_size", "0");
    return u.toString();
  } catch {
    return url;
  }
}

const directUrl = process.env.DATABASE_URL_DIRECT?.trim();
const baseUrl = directUrl || process.env.DATABASE_URL?.trim() || env("DATABASE_URL");
const datasourceUrl = directUrl ? baseUrl : withPgbouncerSafe(baseUrl);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Seed command used by `npx prisma db seed`
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: datasourceUrl,
  },
});
