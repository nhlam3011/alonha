Báo cáo tổng quan dự án Alo Nhà
1. Tổng quan dự án
Alo Nhà là một nền tảng bất động sản thông minh (Smart Real Estate Platform) được thiết kế nhằm giải quyết các khó khăn trong việc tìm kiếm, quản lý và giao dịch bất động sản tại Việt Nam.

Mục tiêu: Xây dựng một "trợ lý ảo" bất động sản toàn diện, giúp người dùng tìm kiếm bằng ngôn ngữ tự nhiên và nhận tư vấn thông minh.
Đối tượng người dùng:
Người tìm kiếm: Tìm mua/thuê nhà, căn hộ.
Môi giới: Đăng tin, quản lý khách hàng (Lead), lịch hẹn.
Quản trị viên: Điều phối hệ thống, duyệt tin, quản lý giao dịch.
Tính năng nổi bật: Tìm kiếm AI, Chatbot tư vấn 24/7, Phân tích phong thủy AI, So sánh bất động sản, Tính toán vay vốn ngân hàng.
2. Phương pháp phân tích thiết kế hệ thống
Dự án được phát triển dựa trên các tiêu chuẩn kỹ thuật phần mềm hiện đại:

Quy trình phát triển: Áp dụng mô hình Agile/Scrum, chia nhỏ quá trình phát triển thành các Sprint (2 tuần/lần) để đảm bảo tính linh hoạt và cải tiến liên tục.
Kiến trúc hệ thống: Sử dụng kiến trúc 3 lớp (Three-Tier Architecture):
Presentation Layer: Giao diện người dùng (Next.js/React) linh hoạt, hỗ trợ SEO và tương tác cao.
Business Logic Layer: Các API Routes xử lý nghiệp vụ, tích hợp các dịch vụ AI (Gemini).
Data Access Layer: Tương tác cơ sở dữ liệu thông qua Prisma ORM, đảm bảo an toàn dữ liệu và tối ưu hiệu năng.
Công cụ thiết kế: Sử dụng các sơ đồ UML (Use Case, Class, Sequence, Deployment) để đặc tả chi tiết luồng hoạt động và cấu trúc dữ liệu.
3. Tech stack sử dụng
Dự án sử dụng các công nghệ tiên tiến nhất để đảm bảo hiệu năng và khả năng mở rộng:

Frontend: Next.js 16.1.6 (App Router), React 19.2.3, TypeScript.
Styling: TailwindCSS 4 (Utility-first CSS framework thế hệ mới).
Backend: Server-side logic tích hợp trong Next.js API Routes.
Database: PostgreSQL (Cơ sở dữ liệu quan hệ mạnh mẽ).
ORM: Prisma (Type-safe database client giúp giảm thiểu lỗi runtime).
AI Integration: Google Gemini Core (@google/generative-ai) xử lý ngôn ngữ tự nhiên.
Authentication: NextAuth.js v5 (Xác thực an toàn với nhiều provider).
Maps & Location: Leaflet/React-Leaflet (Bản đồ tương tác).
Utilities: Zod (Validation), Resend (Email service), bcryptjs (Encryption).
4. Các thuật toán quan trọng (Focus chức năng chính)
Hệ thống tập trung vào việc áp dụng AI để nâng cao trải nghiệm người dùng:

4.1. Thuật toán Phân tích tìm kiếm tự nhiên (Search Intent Parsing)
Cơ chế: Sử dụng mô hình LLM (Gemini) để phân tích câu truy vấn không cấu trúc (Vd: "Tìm chung cư 2 ngủ ở Cầu Giấy dưới 3 tỷ").
Đầu ra: Trích xuất ra các tham số có cấu trúc: category, provinceName, bedrooms, priceMax, areaRange.
Kết quả: Chuyển đổi yêu cầu của người dùng thành câu truy vấn Prisma chính xác trong Database.
4.2. Chatbot Advisory & Recommendation
Cơ chế: Prompt Engineering để "huấn luyện" AI đóng vai trò chuyên gia bất động sản.
Logic: AI phân tích lịch sử xem tin và sở thích của người dùng để đưa ra các gợi ý bất động sản "Matching" nhất với nhu cầu thực tế.
4.3. Thuật toán Phân tích phong thủy AI
Cơ chế: Kết hợp thông tin về năm sinh (mệnh) và hướng nhà của bất động sản.
Logic: AI sử dụng kiến thức về phong thủy (Đông tứ mệnh/Tây tứ mệnh) để đánh giá mức độ hòa hợp và đưa ra lời khuyên về màu sắc, cách bố trí cho gia chủ.
4.4. Thuật toán Quản lý Lead & Matching
Cơ chế: Tự động so khớp nhu cầu tìm kiếm của khách hàng (Lead) với các tin đăng mới cập nhật của môi giới để gửi thông báo kịp thời.
