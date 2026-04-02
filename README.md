# 🏠 AloNha - Nền Tảng Bất Động Sản Thông Minh (AI/NLP)


**AloNha** là một nền tảng môi giới và tìm kiếm bất động sản hiện đại, ứng dụng Trí tuệ nhân tạo (AI) và Xử lý ngôn ngữ tự nhiên (NLP) để tối ưu hóa trải nghiệm người dùng. Dự án được phát triển như một hệ sinh thái toàn diện cho người mua, môi giới và quản trị viên.

---

## ✨ Tính năng nổi bật

### 🤖 Trí tuệ nhân tạo (AI-Powered)
- **Tìm kiếm Ngôn ngữ tự nhiên:** Tìm kiếm BĐS bằng câu lệnh tự nhiên (Ví dụ: *"Tìm căn hộ 2 phòng ngủ ở Cầu Giấy giá dưới 4 tỷ"*).
- **Trợ lý ảo thông minh (Chatbot):** Tư vấn, giải đáp thắc mắc và gợi ý bất động sản phù hợp 24/7.
- **Phân tích Phong thủy:** Đánh giá độ phù hợp của BĐS dựa trên hướng nhà và tuổi của gia chủ thông qua AI.
- **Gợi ý Cá nhân hóa:** Hệ thống đề xuất các tin đăng dựa trên lịch sử tìm kiếm và hành vi người dùng.

### 🏢 Phân hệ Người dùng
- **Khách hàng:** Tìm kiếm, lọc tin, xem bản đồ (Leaflet), so sánh BĐS, tính toán khoản vay ngân hàng, đặt lịch xem nhà.
- **Môi giới:** Đăng tin chuyên nghiệp (Wizard flow), quản lý tin đăng, quản lý khách hàng tiềm năng (Leads), hệ thống ví điện tử và thanh toán gói tin VIP.
- **Quản trị viên (Admin):** Dashboard thống kê, duyệt tin đăng, quản lý người dùng, cấu hình gói dịch vụ và nội dung CMS.

---

## 🛠 Công nghệ sử dụng

### Frontend & UI/UX
- **Framework:** Next.js 16 (App Router)
- **Library:** React 19, TypeScript
- **Styling:** Tailwind CSS 4 (Experimental/Modern)
- **Interactive Maps:** Leaflet & React-Leaflet
- **Validation:** Zod

### Backend & Database
- **Database:** PostgreSQL (Supabase/AWS)
- **ORM:** Prisma 7 + `@prisma/adapter-pg`
- **Authentication:** NextAuth.js v5 (Credentials & Google OAuth)
- **Email Service:** Resend API
- **Image Storage:** Cloudinary

### AI Engine
- **Google Generative AI:** Gemini 1.5/2.0 Flash

---

## 🚀 Cài đặt và Chạy thử

### 1. Sao chép dự án
```bash
git clone https://github.com/your-repo/alonha.git
cd alonha
```

### 2. Cài đặt thư viện
```bash
npm install
```

### 3. Cấu hình biến môi trường
Tạo file `.env` từ mẫu sau và điền các thông tin cần thiết:
```env
# Database
DATABASE_URL="your_pooling_url"
DIRECT_URL="your_direct_url"

# Authentication
NEXTAUTH_SECRET="your_secret"
NEXTAUTH_URL="http://localhost:3000"

# AI & Maps
GEMINI_API_KEY="your_api_key"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_api_key"

# Services
RESEND_API_KEY="your_resend_key"
CLOUDINARY_URL="your_cloudinary_url"
```

### 4. Database Setup
Kết nối database và đồng bộ schema:
```bash
npx prisma db push
npm run db:seed
```

### 5. Khởi chạy
```bash
npm run dev
```
Truy cập: [http://localhost:3000](http://localhost:3000)

---

## 👥 Tài khoản thử nghiệm (Sau khi Seed)

| Vai trò | Email | Mật khẩu |
| :--- | :--- | :--- |
| **Admin** | `admin@alonha.vn` | `123456` |
| **Môi giới** | `agent@alonha.vn` | `123456` |
| **Người dùng** | `user@alonha.vn` | `123456` |

---

## 📂 Cấu trúc dự án
- `/app`: Chứa các route, API và layout (Next.js App Router).
- `/components`: Các thành phần UI dùng chung và các module chuyên biệt (maps, search, ai).
- `/lib`: Cấu hình Prisma, Auth, AI utils.
- `/prisma`: Schema database và file seeding.
- `/public`: Tài nguyên tĩnh (images, icons).

---

## 📜 Giấy phép
Dự án được phát triển cho KLTN.

---

&copy; 2026 AloNha . Kết nối giải pháp - An tâm lạc nghiệp.
