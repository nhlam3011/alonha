# CHƯƠNG 1. TỔNG QUAN VỀ ĐỀ TÀI

## 1.1. Lý do chọn đề tài

### 1.1.1. Bối cảnh thị trường BĐS tại Việt Nam
Trong thập kỷ vừa qua, thị trường bất động sản (BĐS) tại Việt Nam chứng kiến sự bùng nổ mạnh mẽ ở mọi phân khúc từ chung cư, đất nền đến căn hộ dịch vụ. Nhu cầu giao dịch tăng cao kéo theo sự trỗi dậy của đội ngũ môi giới hùng hậu. Giao dịch trực tuyến trở thành kênh kết nối sống còn, đòi hỏi sự luân chuyển và xử lý một khối lượng tin tức cực kỳ khổng lồ mỗi ngày.

### 1.1.2. Thực trạng nền tảng BĐS trực tuyến
Mặc dù các nền tảng thương mại điện tử chuyên BĐS (như Batdongsan.com.vn, Chotot) đã giải quyết được vấn đề kết nối cung - cầu cơ bản, nhưng chúng đang bộc lộ những "nỗi đau" (pain-points) lớn đối với cả 2 nhóm đối tượng sử dụng:
- **Đối với Khách hàng:** Hệ thống tìm kiếm bị lệ thuộc hoàn toàn vào các "bộ lọc" (filters) cứng nhắc (giá, diện tích, số phòng). Khách hàng phải click chuột thử sai rất nhiều lần để tìm ra kết quả đúng ý. Bên cạnh đó, việc thiếu hụt một "trợ lý" có chuyên môn tư vấn phong thủy hay định giá trực tiếp ngay trong quá trình tìm nhà làm giảm trải nghiệm người dùng.
- **Đối với Môi giới:** Môi giới mất nhiều thời gian nghĩ ra văn phong để viết mô tả PR cho từng căn nhà trống. Hơn nữa, họ thiếu một quy trình "khép kín" ngay trên nền tảng đăng tin: Từ nạp tiền chạy quảng cáo (VIP/Top), nhận thông báo quản lý tệp khách hàng tiềm năng (Leads), cho tới việc xếp lịch hẹn đi xem nhà thực tế (Appointments) và trò chuyện tin nhắn (Chat) với khách. Đa số môi giới phải dùng lẫn lộn giữa web BĐS, Zalo và Excel rất phân mảnh.

### 1.1.3. Vai trò của AI trong lĩnh vực BĐS
Trí tuệ nhân tạo (AI), đặc biệt là Xử lý ngôn ngữ tự nhiên (NLP) và các Mô hình ngôn ngữ lớn (LLM như Google Gemini) đang tái định nghĩa lại khái niệm tìm kiếm. Nó biến từ khóa tĩnh thành "hội thoại tự nhiên" (Conversational Search). Khi kết hợp LLM với Cơ sở dữ liệu, máy tính có khả năng phân tích ý định (Intent), trích xuất chuẩn xác các thông số chuyên ngành và trả về danh sách BĐS ngay lập tức, cũng như tự động biên tập bài đăng bán nhà cho môi giới chỉ trong 1 giây.

### 1.1.4. Động lực chọn đề tài
Nhằm giải quyết triệt để rào cản tìm kiếm của Khách hàng và tạo ra một công cụ làm việc trọn gói, chuyên nghiệp, khép kín cho Môi giới, em quyết định thực hiện đề tài: **“Xây dựng website bất động sản thông minh AloNha tích hợp Trí tuệ nhân tạo (AI/NLP)”**. AloNha được định vị không chỉ là một trang web rao vặt, mà là một hệ sinh thái PropTech "trợ lý ảo" đáp ứng trọn vẹn đặc tả nghiệp vụ của thị trường thương mại điện tử BĐS hiện đại.

---

## 1.2. Mục tiêu và nhiệm vụ nghiên cứu

### 1.2.1. Mục tiêu nghiên cứu
Xây dựng thành công một Hệ sinh thái quản lý BĐS thông minh với 3 phân hệ chính (User, Agent, Admin), cung cấp:
- **Trải nghiệm cho Người dùng (User):** Công cụ tìm kiếm AI (Semantic Search) hiểu trọn vẹn câu hỏi tự nhiên; Chatbot AI tư vấn nhà theo phong thủy; Chức năng So sánh BĐS; Lưu yêu thích; Đặt lịch hẹn xem nhà và Trực tiếp chat nội bộ với người bán.
- **Trải nghiệm cho Môi giới (Agent):** Trình biên tập nội dung bài đăng thông minh sinh ra nhờ AI; Dashboard quản lý tương tác Khách hàng/Lịch hẹn (Leads/Appointments CRM); Hệ thống Ví điện tử (Wallet) độc lập hỗ trợ nạp quỹ để nâng cấp các gói hiển thị VIP (Service Packages).
- **Hệ thống Quản trị (Admin):** Quản lý trạng thái phê duyệt tin đăng; Xét duyệt nâng cấp chứng minh nhân dân của Môi giới nội bộ; Hệ thống Crawler (CronJob) tự động thu thập tin tức thời sự.

### 1.2.2. Nhiệm vụ nghiên cứu
- Nghiên cứu mô hình kết xuất máy chủ (SSR) chuyên sâu của framework Next.js 16 (App Router).
- Thiết lập quy trình phân tích Xử lý ngôn ngữ qua Google Gemini API, chuyển đổi Data từ "Câu nói tự do" thành "JSON Object", kết nối trực tiếp vào Prisma ORM Queries (PostgreSQL).
- Mô hình hóa cơ sở dữ liệu để phục vụ bài toán hệ thống ví điện tử và quản lý giao dịch không xảy ra xung đột (Race Condition).

---

## 1.3. Đối tượng và phạm vi nghiên cứu

### 1.3.1. Đối tượng nghiên cứu
- Ứng dụng mô hình ngôn ngữ lớn Google Gemini (LLM) vào bài toán trích xuất thực thể BĐS.
- Kiến trúc API Route Handlers trên môi trường Edge Network của Next.js và tương tác dữ liệu loại Type-Safe qua Prisma ORM.
- Quy trình nghiệp vụ tiêu chuẩn giữa Người tìm thuê/mua và Môi giới kinh doanh.

### 1.3.2. Phạm vi nghiên cứu
Hệ thống AloNha tập trung phục vụ đối tác và cá nhân chuyên giao dịch các loại hình Mua/Bán và Thuê/Cho thuê BĐS tĩnh tại thị trường Việt Nam.

### 1.3.3. Giới hạn đề tài
- Hệ thống Ví điện tử mới thực hiện quy trình ghi chép dòng tiền số dư (Transaction/Balance) nội bộ trên nền tảng, chưa liên kết trực tiếp đường truyền vật lý chuẩn của Cổng thanh toán Quốc tế Gateway (Visa/Mastercard) trong giai đoạn bảo vệ khóa luận.
- Mảng thu thập Tin tức thị trường (News) vận hành thông qua các Bot Crawler tự động dựa trên giao thức HTML Parsing. 

---

## 1.4. Phương pháp nghiên cứu

### 1.4.1. Nghiên cứu tài liệu
Tổng hợp phương pháp thiết kế CSDL (ERD Diagram) cho lĩnh vực thương mại tài chính số; Đọc báo cáo của các kỹ sư Google về Prompt Engineering trong phân loại ý định hội thoại.

### 1.4.2. Khảo sát thực tế
Sử dụng công cụ thực tiễn trên Batdongsan.com.vn (Về luồng đăng tin bị động) và Zalo (Luồng quản lý nhóm người hẹn xem nhà phân mảnh) để tìm ra giao điểm rút gọn tích hợp chúng vào làm 1 cổng Dashboard chung cho Agent trong hệ thống AloNha.

### 1.4.3. Phân tích thiết kế hệ thống
Sử dụng bộ quy chuẩn UML (Đặc biệt là Sơ đồ hoạt động và Sơ đồ tuần tự) để làm rõ luồng gọi API đến các dịch vụ bảo mật (Auth.js) và các API gọi đến Engine AI của dự án (Xử lý Context Log Chatbot).

### 1.4.4. Phát triển phần mềm (Agile)
Đan xen phát triển từng mô đun: Thiết kế giao diện Frontend, Xây dựng APIs nghiệp vụ (Quản lý bài đăng, Ví điện tử), Tích hợp Endpoint thông minh (AI, NLP) và Quản lý State phân quyền bảo mật. Cập nhật mã nguồn liên tục qua kiểm soát phiên bản Git.

### 1.4.5. Kiểm thử và đánh giá
Kiểm thử Unit Test các trường hợp giao dịch Ví (Thiếu tiền không kích hoạt VIP, Trừ lỗi khôi phục số dư); Đánh giá biên độ tự do của AI: AI có sinh ra từ ngữ không liên quan hay không để tìm cách bọc context prompt chặt chẽ hơn.

---

## 1.5. Dự kiến kết quả

### 1.5.1. Sản phẩm phần mềm
Hoàn thiện website **AloNha** tích hợp hơn 30 luồng API thực tế, đảm bảo vận hành trơn tru ở cả môi trường SSR thời gian thực. Hệ thống xử lý xuất sắc các luồng Tương tác thông minh bằng AI, và Luồng Vận hành Môi giới (Ví số, Đặt lịch, Leads, Cronjobs). Mạng lưới dữ liệu được bảo mật xác thực nhiều lớp qua NextAuth.

### 1.5.2. Các kết quả nghiên cứu
Gói tài liệu phân tích kỹ thuật chứng minh sự tương thích và đột phá về mặt trải nghiệm khi kết hợp các module học máy (NLP LLM) với kiến trúc cơ sở dữ liệu quan hệ nguyên thống (SQL-based platform). 

---

## 1.6. Ý nghĩa khoa học và thực tiễn

### 1.6.1. Ý nghĩa khoa học
Khóa luận này mở ra một mô hình chuẩn về mặt kiến trúc nhằm làm "cầu nối" (Translator) biến đổi giao thức truy vấn Database thuần túy (SQL find/where) sang giao thức truy vấn mở bằng ngọn ngữ con người (Semantic Parsing) ứng dụng Prompt Engineering; đánh dấu bước đệm nâng cấp từ Web 2.0 sang luồng ứng dụng có tư duy phân tích nhận thức dữ liệu độc lập.

### 1.6.2. Ý nghĩa thực tiễn
- **Với người dùng đầu cuối:** Cắt giảm 70-80% thời gian tìm kiếm thủ công, trao quyền tự do đàm phán ý tưởng (so sánh, phong thủy, ngân sách thực tế).
- **Với thị trường Môi giới và Doanh nghiệp:** Nhanh chóng phát triển mô hình kinh doanh cá nhân mạnh mẽ thông qua công cụ viết mô tả tự động bằng AI, tự tổ chức quản trị vòng đời khách hàng qua Dashboard tiện dụng (Quản lý trạng thái Lead, Quản lý lịch Appointment, Chi tiêu Marketing đẩy Top) mà không cần lệ thuộc vào phần mềm bên thứ 3 nào.
