# CẤU TRÚC BÁO CÁO KHÓA LUẬN - DỰ ÁN ALONHA

> Dưới đây là cấu trúc báo cáo được căn chỉnh chính xác theo Mục lục chuẩn mà bạn cung cấp, kết hợp với các nội dung/luồng chức năng chi tiết của hệ thống AloNha.

## MỤC LỤC
## LỜI CAM ĐOAN
## LỜI CẢM ƠN
## DANH MỤC CÁC TỪ VIẾT TẮT
## DANH MỤC BẢNG
## DANH MỤC HÌNH
## MỞ ĐẦU
---
## CHƯƠNG 1. TỔNG QUAN VỀ ĐỀ TÀI

### 1.1. Lý do chọn đề tài
- Nêu cụ thể những khó khăn trong việc tìm kiếm bất động sản hiện nay (bộ lọc cứng nhắc tốn thời gian, nhiễu thông tin).
- Sự phát triển của AI và nhu cầu ứng dụng NLP (Xử lý ngôn ngữ tự nhiên) vào PropTech để giải quyết triệt để vấn đề tìm kiếm và tư vấn bất động sản.

### 1.2. Mục tiêu và nhiệm vụ nghiên cứu
- **Mục tiêu:** Xây dựng hệ thống AloNha giao tiếp thân thiện (Conversational UI), kết nối người mua và môi giới thông qua AI.
- **Nhiệm vụ:** Tìm hiểu công nghệ mũi nhọn (Next.js, Prisma, Gemini), xây dựng các luồng chức năng khép kín (Ví điện tử, quản lý Lead,...).

### 1.3. Đối tượng và phạm vi nghiên cứu
- **Đối tượng:** Framework Next.js, API Google Gemini, Database PostgreSQL.
- **Phạm vi:** Tập trung vào các quy trình giao dịch Mua/Bán/Cho thuê BĐS cơ bản, phân quyền rõ ràng (User, Agent, Admin).

### 1.4. Phương pháp nghiên cứu
- Phương pháp khảo sát, phân tích thói quen tìm kiếm của người dùng.
- Phương pháp phân tích và mô hình hóa hệ thống thông tin.
- Phương pháp thực nghiệm (Xây dựng phần mềm theo hướng Agile/Scrum).

### 1.5. Dự kiến kết quả
- Hoàn thiện website với các chức năng nổi bật như: Tìm kiếm AI (Semantic Search), Chatbot AI, Quản lý tài chính môi giới nội bộ, Đặt lịch xem nhà chuyên nghiệp,...

### 1.6. Ý nghĩa khoa học và thực tiễn
- Đóng góp mô hình tích hợp LLM vào một ứng dụng Web truyền thống một cách an toàn và tối ưu tài nguyên.
- Mang lại tính ứng dụng thực tế cao: Tối ưu thời gian tìm phòng, dễ dàng đăng bán/cho thuê cho môi giới và giao dịch minh bạch.

---

## CHƯƠNG 2. CƠ SỞ LÝ THUYẾT

### 2.1. Tổng quan về PropTech và thị trường Bất động sản
- Khái niệm về PropTech, ứng dụng công nghệ làm thay đổi hành vi giao dịch tại Việt Nam.

### 2.2. Tổng quan về bài toán và Nhu cầu thực tiễn
- Nêu các bài toán nhức nhối từ phía người đi tìm nhà, phía nhà môi giới và kỳ vọng ở một nền tảng tìm kiếm có "tư duy" và "hiểu" ngôn ngữ con người.

### 2.3. Phương pháp Phân tích và Thiết kế hệ thống
- Kiến trúc mô hình Server-Client, hệ thống 3-Tier.
- Phân tích thiết kế hướng đối tượng.

### 2.4. Nền tảng công nghệ phát triển (Technology Stack)
- Kiến trúc App Router của Next.js 16 và React 19.
- Thao tác DB type-safe với Prisma ORM, PostgreSQL.
- Định danh và bảo mật bằng NextAuth v5.

### 2.5. Trí tuệ nhân tạo và ứng dụng
- Vai trò của LLM trong nhận diện ngữ nghĩa hội thoại.
- Khai thác Dịch vụ Google Generative AI (Gemini Flash), cách tạo Prompt cho hệ thống Bất động sản.

### 2.6. Đánh giá các nền tảng và nghiên cứu liên quan
- Phân tích Ưu/Khuyết điểm của các Web truyền thống (Batdongsan.com, Chotot) để làm bật lên lợi thế của AloNha.

### 2.7. Kết luận chương
- Tóm lược tính bền vững khi kết hợp Next.js và Gemini cho nền tảng.

---

## CHƯƠNG 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG
*(Trọng tâm ghi chi tiết các luồng chạy của code và hệ thống nhằm vẽ biểu đồ minh họa)*

### 3.1. Khảo sát hiện trạng
- Đánh giá luồng quy trình thực tế từ việc người dùng tìm kiếm mệt mỏi đến khi chốt xem nhà.
- Đánh giá sự rườm rà khi nạp tiền và đăng tin thủ công của môi giới.

### 3.2. Phân tích yêu cầu hệ thống
- **Tác nhân (Actor):**
  - `Khách hàng (User)`: Tìm BĐS bằng từ ngữ tự nhiên, chat bot, đặt lịch hẹn, lưu nhà yêu thích.
  - `Môi giới (Agent)`: Đăng bài có AI hỗ trợ, nạp ví, thanh toán VIP, theo dõi khách báo (Leads).
  - `Quản trị (Admin)`: Giám sát toàn bộ data, duyệt bài BĐS, duyệt cấp tài khoản Môi giới.
- **Yêu cầu chức năng:** Quản lý tài khoản đa dạng (3 roles), Đăng tin/Duyệt bài BĐS, Tìm kiếm NLP, Nạp/trừ tiền Ví nội bộ, Chatbot tư vấn AI, Nhắn tin trực tiếp giữa khách – môi giới,...
- **Yêu cầu phi chức năng:** Tốc độ tải trang nhanh, thân thiện thiết bị di động (Responsive), an toàn bảo mật data khách hàng.

### 3.3. Mô hình hoá chức năng (Chi tiết Luồng Chức Năng / Code Flow)
*(Dựa vào các luồng này, bạn sử dụng phần mềm vẽ sơ đồ Use-case hoặc Activity/Sequence diagram cho báo cáo)*

1. **Luồng Xác thực & Nâng cấp Môi giới (Auth & Agent Application Flow)**
   - Người dùng đăng nhập qua phương thức tùy chọn (Google/Email).
   - Có nhu cầu trở thành Môi giới -> Điền form định danh (CMND, Học vấn) lưu vào model `AgentApplication` (Trạng thái PENDING).
   - Admin kiểm duyệt (Check lịch sử, phỏng vấn) -> Đổi status thành APPROVED -> Role của người dùng trực tiếp cập nhật thành `AGENT`.

2. **Luồng Tìm kiếm bằng Ngôn ngữ tự nhiên (AI NLP Search Flow)**
   - User gõ tự nhiên: *"Cần tìm nhà 3 ngủ khu vực Cầu Giấy dưới 4 tỷ"*.
   - Client ném Request xuống hệ thống API `/api/ai/search`.
   - Backend gọi lên `Gemini API` kèm Prompt định sẵn: Yêu cầu trích xuất Data ra JSON Format. Result: `{rooms: 3, place: "Cau Giay", priceMax: 4000000000}`.
   - Prisma tiếp nhận JSON -> Render Query vào CSDL hệ thống -> Trả về màn hình danh sách BĐS sát ý người dùng.

3. **Luồng Quy trình Đăng tin Môi giới thông minh (AI Listing Post)**
   - Môi giới khai báo thông số cơ bản (Giá, Diện tích, Danh mục) và Upload Cloudinary.
   - Bấm nút "Sinh mô tả bằng AI" -> Hệ thống gửi Data cơ bản sang Gemini lấy thông điệp bán/cho thuê cực hấp dẫn.
   - Lưu trữ bản ghi `Listing` ở trạng thái rút gọn `PENDING`.
   - Sau khi Admin (hoặc bot quản trị) kiểm duyệt ngôn từ hợp chuẩn -> Update thành `APPROVED` sinh ra ngoài màn hình chính.

4. **Luồng Tài chính (Ví) & Các Gói VIP (Wallet & Promotion Flow)**
   - **Nạp ví:** Môi giới mua điểm -> Sinh `Transaction` -> Update cộng vào `Wallet`.
   - **Tiêu ví:** Chọn tính năng "Đẩy Top" / "Gán VIP" (Bảng `ServicePackage`). Backend check số dư -> Nếu >= Giá trị gói: Điểm bị trừ. 
   - Hệ thống phát sinh chi tiết record `ListingService` quy định thời gian hiệu lực cài đặt. Ở trang chủ, các BĐS được Sort theo độ ưu tiên của gói VIP đang active này.

5. **Luồng Tư vấn AI Bot cá nhân hóa (Chatbot Logic)**
   - Khách trên Web mở cửa sổ chat tư vấn (vd: hỏi Phong thủy, Luật).
   - Hành vi tạo lập Data `ChatbotConversation` và update `ChatbotMessage`.
   - Gemini xử lý Memory chat liên tiếp trong CSDL sinh ra câu phản hồi đúng context và nghiệp vụ BĐS.

6. **Luồng Quản trị khách và Lịch hẹn (Leads & Appointment)**
   - Một khi khách bấm thao tác xem số điện thoại của môi giới, hoặc xin tư vấn -> Ngầm hệ thống tạo bản ghi bảng `Lead` (Đo lường sự quan tâm).
   - Khách yêu cầu xem nhà ngày mai -> Sinh record `ViewingAppointment` nối trực tiếp Guest và Agent. Môi giới duyệt confirm thông qua Dashboard.

### 3.4. Mô hình hoá cấu trúc
*(Sơ đồ Thực thể liên kết chéo - ERD, bám sát các thực thể chính như trong schema)*
- Cấu trúc các bảng dữ liệu tương tác trong hệ thống:
  - **Nhóm Hồ sơ:** `User`, `Account`, `AgentApplication`.
  - **Nhóm BĐS:** `Listing`, `ListingImage`, `Project`, `ListingService`.
  - **Nhóm Tương tác Xã hội:** `Conversation`, `ChatMessage`, `ViewingAppointment`, `Lead`.
  - **Nhóm Kinh doanh:** `Wallet`, `Transaction`, `ServicePackage`.
  - **Khác:** `ChatbotConversation`, `Notification`, ...

---

## CHƯƠNG 4. TRIỂN KHAI, ĐÁNH GIÁ VÀ HƯỚNG PHÁT TRIỂN

### 4.1. Môi trường triển khai
- Platform Server: Vercel/Node environment.
- Nền tảng Database: Supabase/PostgreSQL.

### 4.2. Giao diện chương trình
- Trình bày trực quan các Form Đăng tin AI, Màn hình Wallet Agent, Dialog Chatbot tư vấn, Màn Dashboard Admin,...

### 4.3. Đánh giá kết quả đạt được
- Hệ thống hoạt động phản hồi chuẩn, giải quyết tốt cản trở tìm kiếm bằng filter cứng rập khuôn.
- Hoàn thiện luồng ví điện tử tiện cho Môi giới quản lý tài chính kinh doanh.

### 4.4. Hạn chế và Hướng phát triển
- Hạn chế: Dữ liệu crawl và mapping của bản đồ thi thoảng vẫn lệch do API open-source.
- Định hướng tới: Triển khai tính năng dự báo giá BĐS cá nhân thông qua Deep Learning Big Data trong 6–12 tháng tiếp theo. Cập nhật chữ ký số trong ký hợp đồng đặt cọc.

---
**TÀI LIỆU THAM KHẢO**
**(Liệt kê các nguồn tham khảo, document của Next, Prisma, Gemini...)**
