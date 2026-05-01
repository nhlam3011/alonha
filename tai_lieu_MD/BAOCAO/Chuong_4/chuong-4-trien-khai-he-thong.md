## 4.2. Triển khai hệ thống

Quá trình triển khai dự án AloNha được thực hiện trên môi trường điện toán đám mây (Cloud Computing) với các giải pháp Backend as a Service (BaaS) và Serverless hiện đại nhất, nhằm đảm bảo hệ thống duy trì được tính sẵn sàng cao (High Availability), tốc độ phản hồi nhanh và tối ưu hóa chi phí vận hành.

### 4.2.1. Mô hình kiến trúc triển khai tổng thể
Hệ thống được cấu trúc dựa trên mô hình phân tán, tách biệt vai trò xử lý giữa các cụm máy chủ:
- **Tầng Hosting Frontend & API (Vercel Node.js Edge):** Mã nguồn Next.js được Vercel tự động hóa biên dịch (Build) thành các cụm tĩnh (Static HTML) và các khối hàm Serverless Functions (dành cho API Routes). Cơ chế Vercel Edge Network giúp phân phối nội dung tới người dùng qua hệ thống CDN toàn cầu, giảm thiểu triệt để độ trễ (Latency).
- **Tầng Cơ sở dữ liệu vật lý (Supabase BaaS):** Cơ sở dữ liệu PostgreSQL thay vì phải cài đặt thủ công trên VPS (Virtual Private Server), dự án sử dụng máy chủ đám mây Supabase Platform (AWS) đóng vai trò trung tâm lưu trữ toàn bộ Metadata từ Users, Listings đến Logs giao dịch.
- **Tầng Trí tuệ nhân tạo (Google AI Studio):** Chịu trách nhiệm cho mũi nhọn kĩ thuật lớn nhất. Thay vì rèn luyện mạng Neural mạng trên Server vật lý tốn kém GPU, ứng dụng gọi RESTful API qua cổng kết nối của nền tảng Gemini nhằm thao túng mô hình ngôn ngữ lớn, cho phép bóc tách NER và khởi tạo Chatbot nội dung chuẩn xác.

### 4.2.2. Cấu hình biến môi trường (Environment Variables)
Để duy trì tính toàn vẹn và đảm bảo an ninh bảo mật cấp độ dự án, toàn bộ tham số nhạy cảm (Keys, Passwords, URLs) tuyệt đối không được gõ cứng (Hardcode) vào Source gốc. Chúng được khai báo độc lập vào file định dạng `.env.local` theo bảng sau:

| Tên Biến Môi Trường | Chức năng hoạt động | Điều kiện |
| :--- | :--- | :--- |
| `DATABASE_URL` | Chuỗi kết nối tới cơ sở dữ liệu Supabase Database | Siêu bảo mật |
| `DIRECT_URL` | Chuỗi phụ (Session) mở lối truy xuất Schema Prisma | Siêu bảo mật |
| `NEXT_PUBLIC_APP_URL`| Domain hiện hành (Locahost hoặc Domain TLD vĩnh viễn) | Cấp quyền Public |
| `GOOGLE_GEMINI_API_KEY`| Khóa Token chứng thực hóa đơn cung cấp bởi Google AI Studio | Siêu bảo mật |
| `NEXTAUTH_SECRET` | Mã băm Token định danh Session Cookie cho Client Side | Tự sinh random |
| `CLOUDINARY_URL` | Endpoint tích hợp kho lưu trữ đa phương tiện CDN Ảnh/Video | Siêu bảo mật |

### 4.2.3. Quy trình CI/CD tích hợp liên tục cùng nền tảng Vercel
CI/CD (Continuous Integration / Continuous Deployment) là trái tim để duy trì vòng đời phần mềm (Agile) diễn ra trơn tru. Tại AloNha:
1. **Push Code:** Nhà phát triển đẩy bất kỳ cập nhật mã nguồn nào (Commit) lên kho lưu trữ Repository (GitHub).
2. **Webhook Triggering:** Github ngay lập tức kích hoạt chuông báo Webhook tới máy chủ phân tích độc lập của nền tảng Vercel.
3. **Building & Type Checking:** Vercel trỏ chuột dòng lệnh chạy tiến trình `npm run build`, đồng thời máy chủ sẽ quét kiểm tra 100% cú pháp TypeScript (`tsc Check`) và Linting. Nếu có lỗi, vòng lặp ngắt hệ thống để bảo vệ môi trường Production.
4. **Deploying (Deploying):** Nếu biên dịch thành công, bản dựng mới sẽ đè lên bản cũ trong tích tắc mà không gây sập nền tảng (Zero Downtime).

### 4.2.4. Quản lý vòng đời Cơ sở dữ liệu tự động với Supabase
Đồ án không dừng lại ở việc tạo hệ quản trị CSDL, mà nâng tầm kiến trúc kết hợp với Prisma ORM nhằm kiểm soát và gỡ lỗi cấu trúc DB trên Supabase một cách ưu việt:
- **Migration Code-First:** Bất kỳ sự thay đổi (Thêm Bảng, Xóa Thuộc tính) đều được chỉnh sửa quy củ trong tệp tin `schema.prisma`. 
- **Đồng bộ hóa:** Bằng cơ chế lệnh Terminal chuyên hóa `npx prisma db push`, cấu trúc Database vật lý trên đám mây Supabase lập tức tự xoay chuyển Table cấu trúc giống y hệt khung định nghĩa, giảm hoàn toàn tỷ lệ sai số do tương tác thủ công SQL.
- **Giám sát Console:** Supabase cung cấp hệ thống giao diện Dashboard cho phép theo dõi số lượng kết nối tới CSDL trực tiếp, giám sát lượng bộ nhớ chiếm dụng (Data Size) theo thời gian thực (Realtime), cũng như thực thi Backup (Bảo lưu dữ liệu) nhanh chóng trước các cuộc tấn công rò rỉ hoặc trục trặc phiên bản.
