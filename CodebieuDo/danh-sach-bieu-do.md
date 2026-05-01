# DANH SÁCH CÁC BIỂU ĐỒ (UML & KIẾN TRÚC) DỰ ÁN ALONHA (FOCUS AI)

Dựa trên cấu trúc database thực tế và yêu cầu biến AI làm mũi nhọn, dưới đây là danh sách **23 sơ đồ cốt lõi**, lấy AI (Tìm kiếm NER và Auto-Generation) cùng Môi giới (Đăng tin) làm trọng tâm:

## 1. Sơ đồ Use Case (6 sơ đồ)
* **Tổng thể hệ thống:** Mối quan hệ giữa 3 Actor (User, Agent, Admin).
* **Use Case - Phân hệ Môi giới (Đăng tin cốt lõi):** Quản lý Listing, Chăm sóc CRM (Leads), Quản lý Lịch hẹn (Bỏ qua nhánh Ví điện tử phức tạp thành nhánh phụ).
* **Use Case - Phân hệ AI:** Trợ lý sinh mô tả (Auto Description) cho Môi giới, Chatbot AI cho User, Tìm kiếm thông minh bằng tự nhiên ngữ (NLP).
* **Use Case - Phân hệ Khách hàng:** Hành vi mua bán User (Tìm nhà, Đặt lịch, Xem báo cáo giá).
* **Use Case - Phân hệ Admin:** Thao tác hệ thống của người quản trị trung tâm.
* **Use Case - Phân hệ Giao dịch:** Nạp ví và chi tiêu dịch vụ nâng cấp VIP.

## 2. Sơ đồ Class (3 sơ đồ)
* **Class Diagram Tổng Thể:** Bao quát toàn bộ Prisma Schema.
* **Class Diagram Phân rã (Module AI & Xử lý Context):** Tập trung sâu vào `ChatbotConversation`, `ChatbotMessage`.
* **Class Diagram Phân rã (Module BĐS & Leads):** Focus vào Quản lý `Listing`, `Lead`, `ViewingAppointment`, và gom gọn nhánh `Wallet` ở rìa.

## 3. Sơ đồ Hoạt động - Activity Diagrams (5 sơ đồ)
*(Tập trung rẽ nhánh UX/UI)*
1. **Flow Đăng ký & Được duyệt Môi giới:** Điền Form -> Admin verify.
2. **Flow Đăng tin Bất động sản AI:** Nhập liệu căn bản -> Submit -> AI đề xuất mô tả tự động -> Duyệt trước khi đăng tải.
3. **Workflow Quản lý Lịch hẹn xem nhà:** Khách đặt -> Thông báo Agent -> Confirm.
4. **CRM Quản trị khách quan tâm (Leads):** Track trạng thái từ lúc User để lại form liên hệ.
5. **Flow Tìm kiếm thông thường by Map:** Filter tĩnh kết hợp kéo kéo bản đồ.

## 4. Sơ đồ Tuần tự - Sequence Diagrams (5 sơ đồ)
*(Tập trung phân tích API và gọi Model LLM)*
1. **Tìm kiếm AI nhận diện NER (Mũi nhọn 1):** Client -> API Search -> Model LLM trích xuất NER (Giá 2 tỷ, vị trí Cầu Giấy) -> Truy vấn Parameter hóa -> Hiển thị kết quả.
2. **Đăng tin bóc tách NLP (Mũi nhọn 2):** Client -> LLM xử lý đoạn miêu tả tự do -> Render raw text ra Field của Form. Hoặc Gen Text từ thông số cơ bản.
3. **Trò chuyện RAG Chatbot:** Client -> Context History -> LLM Streaming Generate.
4. **Luồng Cập nhật Giao dịch mô phỏng:** Quản lý nạp/trừ tiền mua VIP nội bộ giới hạn.
5. **Xác thực bảo mật hệ thống (Auth):** Xác minh JWT (NextAuth).

## 5. Cấu trúc Kiến trúc & Tích hợp AI (4 sơ đồ)
* **Sơ đồ kiến trúc tổng thể hệ thống:** Mô hình Component của Next.js (Client, Server, DB, LLM).
* **Sơ đồ triển khai:** Luồng thông mạng Node.js trên Vercel, Supabase Postgres và Gemini Cloud.
* **Kiến trúc tích hợp AI:** Tách biệt rõ bề mặt xử lý Prompt LLM và cơ chế Fallback Regex.
* **Sơ đồ luồng xử lý tìm kiếm AI, luồng xử lý Chatbot:** Trực quan chi tiết Flow rẽ hướng 2 mũi nhọn AI.

---
**TỔNG CỘNG: 20 sơ đồ AI-Oriented.**
