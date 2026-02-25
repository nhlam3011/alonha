# Alonha - Nền tảng Bất động sản (AI/NLP)

Website bất động sản với tìm kiếm, lọc, đăng tin, quản lý tin, công cụ tính vay/phong thủy, chatbot và phân quyền Admin/Môi giới/Khách.

## Công nghệ

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Prisma 7** + PostgreSQL (adapter `@prisma/adapter-pg`)
- **NextAuth v5** (Credentials + Google)
- **Tailwind CSS 4**

## Yêu cầu

- Node.js 18+
- PostgreSQL (hoặc Supabase)
- Biến môi trường (xem `.env.example`)

## Cài đặt

```bash
npm install
cp .env.example .env
# Sửa .env: DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
```

## Database

**Prisma 7** dùng `prisma.config.ts` cho migrate; client dùng adapter trong `lib/prisma.ts`.

### Cách 1: Prisma CLI (khi kết nối DB ổn định)

```bash
npx prisma migrate dev --name init
npm run db:seed
```

### Cách 2: Tạo bảng thủ công (Supabase / khi CLI timeout)

1. Mở **Supabase Dashboard** → **SQL Editor**.
2. Copy toàn bộ nội dung file `prisma/init.sql` và **Run** để tạo schema + bảng.
3. Trên máy, chạy seed để tạo dữ liệu mẫu:

```bash
npm run db:seed
```

**Tài khoản sau seed:**

| Email            | Mật khẩu | Vai trò  |
|------------------|----------|----------|
| admin@alonha.vn  | 123456   | Admin    |
| agent@alonha.vn  | 123456   | Môi giới |
| user@alonha.vn   | 123456   | Khách    |

## Chạy dev

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Build & Production

```bash
npm run build
npm start
```

Đảm bảo `.env` có `DATABASE_URL` và `NEXTAUTH_URL` (ví dụ `https://your-domain.com`).

## Cấu trúc chính

- **Phân hệ Khách:** Trang chủ, tìm kiếm/lọc tin, chi tiết BĐS, công cụ (tính vay, so sánh, phong thủy), đặt lịch xem, lưu tin (khi đăng nhập).
- **Phân hệ User:** Đăng ký/đăng nhập (email, Google), quên mật khẩu (OTP), tài khoản, tin đã lưu.
- **Phân hệ Môi giới:** Đăng tin (wizard), quản lý tin đăng tại `/moi-gioi`.
- **Phân hệ Admin:** Dashboard, quản lý user, duyệt tin tại `/admin` (chỉ role ADMIN).
- **API:** `/api/listings`, `/api/favorites`, `/api/auth/*`, `/api/ai/chat`, `/api/ai/recommend`, ...
- **SEO:** `app/sitemap.ts`, `app/robots.ts`.

## Scripts

- `npm run dev` — Chạy dev server
- `npm run build` — Build production
- `npm run db:seed` — Chạy seed (sau khi migrate)
- `npm run db:migrate` — Chạy Prisma migrate dev
# alonha
