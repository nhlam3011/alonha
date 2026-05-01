# Cấu trúc dự án & Danh sách API - Hệ thống AloNha

Tài liệu này mô tả cấu trúc thư mục tổng quan của toàn bộ hệ thống AloNha (kiến trúc Next.js App Router 16) và danh sách tập hợp các RESTful APIs đã được phát triển để xử lý Frontend-Backend.

---

## 1. CẤU TRÚC DỰ ÁN (PROJECT STRUCTURE)

Dự án được tổ chức theo tiêu chuẩn của hệ sinh thái **Next.js App Router** kết hợp với kiến trúc phân tách Component/Logic rõ ràng:

```text
kltn_alonha/
├── app/                      # Thư mục gốc chứa toàn bộ Route của ứng dụng (Next.js App Router)
│   ├── api/                  # Nơi định nghĩa toàn bộ Backend RESTful API
│   ├── (auth)/               # Group các trang Xác thực (Đăng nhập, Đăng ký)
│   ├── (admin)/              # Group các trang Dashboard quản trị cho Admin
│   ├── (agent)/              # Group các trang Quản lý cho Môi giới, Nạp ví, Đăng tin
│   ├── (main)/               # Group các trang Khách (Trang chủ, Tìm kiếm, Chi tiết Listing)
│   ├── globals.css           # File khai báo style CSS cục bộ (Tailwind configuration)
│   └── layout.tsx            # Root layout chung (Providers, Header/Footer wrappers)
├── components/               # Chứa các Reusable UI Components
│   ├── ui/                 # Các component nguyên thủy (Button, Input, Card...)
│   ├── layout/             # Các khối giao diện lớn (Header, Mobile Menu, Footer)
│   ├── listings/           # Các component chuyên biệt cho List Tin, Map BĐS
│   └── chat/               # Khối chat trực tiếp và Chatbot AI
├── lib/                      # Nơi định nghĩa các Helper logic, Instance, Utils
│   ├── prisma.ts           # Khởi tạo kết nối Prisma Client tới DB
│   ├── auth.ts             # Định nghĩa cấu hình NextAuth v5
│   └── gemini.ts           # Instance kết nối tới Google Generative AI API
├── prisma/                   # Quản lý Database & Migrations
│   ├── schema.prisma       # Cấu trúc Data Modeling (Các bảng, Quan hệ khóa)
│   └── seed.ts             # Script chèn data mẫu (Dữ liệu Admin/User ban đầu)
├── public/                   # Thư mục chứa tập tin tĩnh có thể truy cập public
│   ├── images/             # Lưu giữ Logo, Banner mặc định
│   └── fonts/              # Font chữ local
├── types/                    # Nơi chứa các định nghĩa Types/Interfaces nâng cao cho TypeScript
└── tai_lieu_MD/              # Folder chứa các tài liệu, báo cáo được xuất riêng
```

### Chú thích về mô hình:
- Ứng dụng tích hợp **Backend lẫn Frontend** ở cùng một nền tảng codebase (Monorepo thu nhỏ) để tận dụng SSR (Server-Side Rendering) tuyệt đối.
- Server Actions được sử dụng ở một vài Component, kết hợp với các **Route Handler (`app/api/...`)** nếu bên thứ 3 hoặc Client-component có nhu cầu gọi Fetch từ xa.

---

## 2. DANH SÁCH CÁC API HOẠT ĐỘNG (API ENDPOINTS)

Hệ thống có nhiều nhóm API Route Handlers tùy biến, với Path chuẩn: `GET / POST / PUT / DELETE` tới `http://localhost:3000/api/...`

### 2.1. Nhóm API Người dùng & Xác thực (User Auth & Profile)
Quản lý luồng truy cập và chỉnh sửa thông tin người dùng:
- `[GET/POST] /api/user/profile`: Cập nhật/Sinh thông tin hồ sơ User.
- `[POST] /api/user/change-password`: Xử lý đổi mật khẩu.
- `[GET] /api/users` & `[GET] /api/users/[userId]`: Lấy dữ liệu công khai người dùng khác.
- `[POST] /api/agent-application`: Xử lý nộp đơn xét duyệt nâng cấp làm Môi giới.

### 2.2. Nhóm API Quản lý Bất động sản (Properties / Listings)
Bao gồm xử lý tin đăng:
- `[GET/POST] /api/listings`: Truy xuất danh sách tin đăng (có tìm kiếm Filter) hoặc Đăng bài mới.
- `[GET/PUT/DELETE] /api/listings/[slug]`: Thao tác vào 1 bài BĐS cụ thể.
- `[GET] /api/projects` & `/api/projects/[slug]`: Danh sách theo Dự án Master (như tòa chung cư/KĐT).
- `[POST] /api/favorites`: Thao tác Lưu tin/Hủy lưu tin vào yêu thích.
- `[POST] /api/compare`: Dịch vụ so sánh nhiều BĐS.

### 2.3. Nhóm API Dữ liệu Thông minh (AI & Gemini Integration)
Đây là "trái tim" cấu thành lên mức độ thông minh của dự án (Xử lý prompt và NLP):
- `[POST] /api/ai/search-intent` & `/api/ai/search-parse`: Nhận câu text từ người dùng, dịch câu văn thành Object Filter JSON để query CSDL.
- `[POST] /api/ai/generate-description`: Nhận thông số Cứng từ Agent -> Sinh ra bài viết PR dài.
- `[POST] /api/ai/chat`: Kênh gọi Stream cho Chatbot tư vấn BĐS ngoài trang chủ.
- `[POST] /api/ai/feng-shui`: Tiện ích AI tư vấn phong thủy nhà ở dưạ theo tuổi/hướng.
- `[POST] /api/ai/recommend`: Gợi ý cá nhân hóa dựa trên hành vi User.
- `[POST] /api/nlp/classify` & `/api/nlp/summarize`: API tiện ích xử lý hiểu sâu ngôn ngữ tiếng Việt.

### 2.4. Nhóm API Quản trị Hệ thống (Admin & Moderation)
Dành cho Role `ADMIN` duyệt bài, kiểm tra data:
- `[GET/POST] /api/admin/listings` & `/api/admin/listings/[id]`: Trả data nội bộ cho CMS duyệt.
- `[POST] /api/admin/listings/[id]/approve`: Nút duyệt Status bài từ PENDING sang APPROVED.
- `[GET/PUT] /api/admin/agent-applications`: Kiểm duyệt đơn xin lên hạng của Môi giới.
- `[GET] /api/admin/projects` & `/api/admin/users`: Quản lý siêu danh mục.
- `[GET] /api/admin/packages`: Quản lý các cấu hình gói nạp tiền.
- `[GET] /api/admin/chat/conversations`: Phân tích thống kê tin nhắn nội bộ hệ thống.

### 2.5. Nhóm API Hệ sinh thái Môi giới & Giao tiếp (Communication & Sales)
Tương tác nội bộ và gói nạp:
- `[GET] /api/service-packages`: Trả về danh sách các gói dịch vụ Đẩy Top / Gắn VIP cho phía FE hiển thị.
- `[GET/POST] /api/notifications` & `/api/notifications/settings`: Xử lý lưu và cấu hình thông báo In-app.
- `[POST] /api/uploads`: Xử lý Gateway tải ảnh/Video lên (Upload Cloudinary trực tiếp hoặc s3).
- `[GET/POST] /api/media` & `/api/media/[id]`: Quản lý tài nguyên media thô, lưu Bytes DB tùy cấu hình.

### 2.6. Nhóm API Thông tin & Thu thập (News Crawler)
- `[GET] /api/news`: Nơi hiển thị thông tin tin tức thị trường BĐS.
- `[GET/POST] /api/news/cron`: Script chạy nền trên Vercel/CronJob tự động thu thập tin tức các báo lớn cập nhật vào DB lúc nửa đêm.

---
> **⚡ Note dành cho Báo Cáo:** 
> Việc xử lý API theo các thư mục `[slug]` hoặc `[id]` tuân theo tiêu chuẩn **Dynamic Routes** của Next.js 16. Khi đưa vào báo cáo, bạn có thể gọi đây là RESTful API Routes được viết trên hạ tầng Edge Network / Serverless Functions.
