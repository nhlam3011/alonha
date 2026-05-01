# CHƯƠNG 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

Chương 3 đi sâu vào việc khảo sát các yếu điểm của luồng phân phối bất động sản truyền thống, từ đó đặc tả các yêu cầu phần mềm và mô hình hóa chi tiết hệ sinh thái AloNha thông qua các sơ đồ nghiệp vụ (UML) và Sơ đồ thực thể liên kết (ERD).

## 3.1. Khảo sát hiện trạng

Thị trường công nghệ bất động sản (PropTech) tại Việt Nam đang phát triển mạnh mẽ tuy nhiên vẫn tồn tại những điểm nghẽn cản trở trải nghiệm của cả người mua và người bán (môi giới). Việc phân tích hiện trạng là cơ sở thiết yếu để thiết kế một hệ thống mang lại giá trị thực tiễn.

### 3.1.1. Hiện trạng đối với Người đi tìm nhà (Khách hàng)
* **Luồng tìm kiếm thủ công (Manual Search):** Người dùng phải tương tác với hàng chục ô *Dropdown* tĩnh (chọn Tỉnh/Thành, chọn Huyện, chọn mức giá 2-3 tỷ). Khi có nhu cầu đan xen (Ví dụ: "Nhà gần bệnh viện K, hướng Đông Nam, ngân sách 5 tỷ"), hệ thống cũ không thể đáp ứng.
* **Suy hao thông tin:** Việc tự đọc hàng ngàn tin đăng dài dòng dễ gây mệt mỏi. Thiếu vắng một "trợ lý ảo" có khả năng tóm tắt và đánh giá tính phù hợp của bất động sản.

### 3.1.2. Hiện trạng đối với Người môi giới (Agent)
* **Quy trình đăng tin kém tối ưu:** Môi giới mất quá nhiều thời gian viết các bài quảng cáo (copy-writing) cho từng mảng tài sản. Phải tải ảnh thủ công lên từng trang web khác nhau.
* **Quản trị khách hàng (Leads) phân tán:** Khi có khách quan tâm, họ để lại số điện thoại trên nhiều web khác nhau. Môi giới phải ghi chép ra sổ tay hoặc Excel, rất dễ bỏ sót khách hàng tiềm năng.
* **Luồng nạp tiền phức tạp:** Các thao tác thanh toán mua gói VIP hoặc đẩy tin thường mất thời gian chờ admin sàn xét duyệt thủ công, làm gián đoạn cơ hội tiếp cận khách.

### 3.1.3. Đề xuất giải pháp cải tiến
Từ những điểm nghẽn cốt lõi trên, dự án đề xuất xây dựng nền tảng **AloNha** giải quyết triệt để bài toán thông qua hai mũi nhọn công nghệ cốt lõi, đưa Trí tuệ nhân tạo (AI) vào ứng dụng thực tiễn:
* **Mũi nhọn 1 - Tích hợp AI trong Luồng Tìm Kiếm (NLP & NER):** Thay thế hoàn toàn thanh tìm kiếm tĩnh bằng hộp thoại phân tích Ngôn ngữ tự nhiên (NLP). Hệ thống ứng dụng mô hình Nhận diện Thực thể Đặc danh (NER - Named Entity Recognition) để tự động bóc tách các từ khóa về mức giá, diện tích, vị trí và loại hình bất động sản từ chuỗi văn bản tự do của người dùng.
* **Mũi nhọn 2 - Tự động hóa Luồng Đăng tin và Quản trị:** Tích hợp AI làm "Trợ lý nội dung" cho môi giới. Bằng cách gọi API LLM, hệ thống tự động sinh các đoạn mô tả quảng cáo chuyên nghiệp dựa trên metadata thô. Đồng thời cung cấp giao diện CRM tập trung để quản lý lượng khách hàng (Leads) luân chuyển qua tin bài.
*(Phân hệ Ví điện tử / Wallet trong dự án chỉ đóng vai trò mô phỏng giới hạn quyền lợi tài khoản để phục vụ luồng đẩy tin nội bộ, không phải chức năng thanh toán thương mại cốt lõi ngoài môi trường thực).*

## 3.2. Phân tích yêu cầu hệ thống

Dựa trên thực trạng trên, hệ thống AloNha được phân tích và bóc tách thành các tác nhân và yêu cầu cụ thể như sau.

### 3.2.1. Yêu cầu chức năng
Hệ thống được thiết kế phân tầng rõ ràng, với bộ tính năng chuyên biệt được bóc tách dựa trên quyền hạn của 3 nhóm tác nhân (Actors) cốt lõi:
- **Khách hàng (User):** Nhân tố tạo ra "Cầu", sử dụng AI tìm nhà, xem thông tin và đặt lịch hẹn.
- **Môi giới (Agent):** Nhân tố "Cung", tham gia cung cấp nội dung, nạp ví điện tử, quản trị khách Leads CRM.
- **Quản trị viên (Admin):** Nắm quyền điều hành tối cao, duyệt tin đăng và sao kê các giao dịch tài chính.

**1. Đối với Người đi tìm nhà (Khách hàng/User Role):**
* **Tìm kiếm thông minh (AI Search):** Tìm BĐS dựa trên hội thoại ngôn ngữ tự nhiên (NLP) hoặc công cụ lọc chuyên sâu bằng bản đồ tọa độ (Map-based Search).
* **Tương tác tài sản:** Xem chi tiết hình ảnh, mức giá. Cho phép Thêm vào danh sách Lưu trữ (Favorites), So sánh các BĐS liền kề.
* **Kết nối & Đặt lịch:** Giao tiếp thời gian thực gửi tin nhắn (Real-time Message) hoặc đặt ngay Lịch hẹn xem nhà trực tiếp (Appointments) tới Môi giới.
* **Trợ lý cá nhân hóa:** Trò chuyện với Chatbot AI để tư vấn tính toán dòng tiền vay thế chấp hoặc xem hướng nhà hợp phong thủy.

**2. Đối với Người Môi giới (Agent Role):**
*(Bên cạnh việc thừa hưởng toàn bộ các quyền hạn của Người dùng phổ thông, Môi giới được quy hoạch một khu vực làm việc riêng (Agent Dashboard) với các chức năng)*

*   **Quản trị Tin đăng Bất động sản (Listings Management):**
    *   Vận hành quy trình sản xuất tin đăng có sự trợ lực của AI: Hệ thống tự động sinh văn phong mô tả quảng cáo (Auto-generate Description) dựa trên các số liệu đầu vào thô sơ.
    *   Triển khai đa dạng trạng thái tài sản: Lên lịch xuất bản (Publish), gỡ bỏ (Hide), hoặc bảo lưu cấu hình (Draft).
    *   Mở rộng tệp đính kèm đa phương tiện (Ảnh, Video) và chốt tọa độ vị trí cực kỳ chính xác.
*   **Hệ sinh thái Ví điện tử Nội bộ (Agent Wallet):**
    *   Thực hiện thao tác nạp tiền tài khoản (Deposit Wallet) và mua sắm không giới hạn các dịch vụ nền tảng.
    *   Sao kê lịch sử giao dịch (Transactions History) minh bạch để kiểm soát luồng thu chi.
*   **Quản trị Tệp Khách hàng (Leads Tracker CRM):**
    *   Bảng điều khiển thu thập thời gian thực (Real-time) toàn bộ lưu lượng Khách hàng để lại thông tin liên hệ ở các bài đăng.
    *   Phân loại và giám sát chặt chẽ trạng thái phản hồi của từng khách hàng.
*   **Quản trị Lịch biểu (Appointments Management):**
    *   Tiếp nhận các yêu cầu hẹn gặp xem nhà (Viewing Appointments) đổ về liên tục từ phía khách.
    *   Thao tác Phê duyệt (Approve) hoặc Từ chối (Reject) lịch hẹn, ngay lập tức gửi hệ thống thông báo ngược lại cho khách hàng.
*   **Thương mại hóa và Đẩy tin (Push Top/VIP Services):**
    *   Sử dụng quỹ dư trong Ví để nâng cấp các luồng hiển thị đặc quyền (VIP/Đã xác thực).
    *   Triển khai luồng Đẩy tin tự động (Up Top) để cạnh tranh vị trí hiển thị đắt giá nhất ở Trang chủ và Trang tìm kiếm.

**3. Đối với Ban Quản trị hệ thống (Admin Role):**
* **Bảng điều khiển tập trung (Dashboard):** Thống kê sức khỏe dòng tiền, lưu lượng bài đăng và lượng truy cập của toàn hệ thống.
* **Kiểm soát Chất lượng (Moderation):** Có quyền lực tối cao trong việc Phê duyệt (Approve) hoặc Từ chối (Reject) các Bài đăng BĐS chống thông tin ảo. 
* **Quản trị Nhân sự:** Duyệt các yêu cầu thăng hạng Môi giới của User. Khóa tài khoản (Ban/Lock Account) nếu phát hiện gian lận.
* **Quản trị Dữ liệu Gốc:** Thiết lập cơ sở dữ liệu về các Siêu Dự Án (Projects) và bảng giá các Gói Dịch vụ Môi giới (Service Packages) để Agent tiêu thụ.

### 3.2.2. Yêu cầu phi chức năng
Hệ thống AloNha tuân thủ các quy chuẩn khắt khe về kỹ thuật và kiến trúc hạ tầng phần mềm.

### 3.2.3. Hiệu năng
Tốc độ phản hồi và biên dịch dữ liệu từ AI Gemini về luồng Frontend phải nhỏ hơn 1.5 giây. Hình đa phương tiện (Media/Thumbnails) tải qua băng thông siêu tốc và tự động scale kích thước bằng CDN **Cloudinary** giúp tối ưu chỉ số FCP (First Contentful Paint). Tự động hóa lấy tin tức định kỳ thông qua background Cron Jobs không cản trở băng thông Server chính.

### 3.2.4. Bảo mật
Dữ liệu nhạy cảm như Mật khẩu người dùng được băm một chiều qua giao thức Bcrypt cứng rắn. Payload Request ở mọi API bắt buộc đi qua tầng bảo vệ **Zod Validation** vô hiệu hóa biến phái Payload. Khai thác sức mạnh truyền biến bằng ORM Prisma Client để ngăn chặn SQL Injection và mã độc XSS.

### 3.2.5. Khả năng sử dụng và mở rộng
Ứng dụng trình diễn thiết kế đa nền tảng Responsive Front-End bằng TailwindCSS liền mạch trải nghiệm Khách trên (Mobile/Tablet/Desktop). Kiến trúc thành phần (Component) độc lập của Next.js Server Modules cho phép hệ thống khả năng linh hoạt "plug-and-play" bổ sung module Thanh toán Thật (Payment Gateway Stripe/VNPay) sau này mà không đánh vỡ kết cấu hiện hành.

### 3.2.6. Khả năng bảo trì
Ứng dụng lập trình tuân theo Design Pattern hiện đại, sử dụng ngôn ngữ TypeScript với cơ chế định kiểu tĩnh (Statically Typed) giúp tự động dò và tránh sai sót bộ nhớ. Module Controller AI (Prompt/NLP/NER) được đóng gói tách biệt tránh đụng độ cấu trúc của luồng dữ liệu truyền thống.

## 3.4. Mô hình hoá cấu trúc

### 3.4.1. Cấu trúc thực thể và Tư duy thiết kế (OOD)
Dựa trên kiến trúc của hệ thống AloNha, Sơ đồ Lớp (Class Diagram) được xây dựng theo chuẩn Object-Oriented Design (OOD) kết hợp với mô hình dữ liệu thực tế. Thay vì chỉ trình bày các trường dữ liệu (Fields) như sơ đồ ERD, các Lớp (Class) trong hệ thống được định nghĩa thêm các Phương thức (Methods) đại diện cho tầng logic xử lý nghiệp vụ:

- **Lớp Người dùng & Định danh (`User`, `Wallet`):** `User` đóng vai trò gốc khởi tạo vạn vật (`Listing`, `ChatbotConversation`, `Lead`), sở hữu phương thức thao túng tài khoản (`login()`, `upgradeToAgent()`). Mỗi `User` liên kết sinh thái (1-1) với một Ví nội bộ (`Wallet`) có khả năng trừ tiền `deductFund()` hoặc kiểm tra `checkBalance()`.
- **Lớp Bất động sản (`Listing`, `Project`):** Lớp `Listing` là trung tâm luân chuyển của quy trình Đăng tin, nó kế thừa một phân khu dự án (Lớp `Project`) đối với BĐS sơ cấp. `Listing` tự tích hợp các phương thức gọi AI như `generateAutoDescription()` nhằm tự động hóa bóc tách khối dữ liệu trước khi đăng tải.
- **Lớp Vận hành CRM (`Lead`, `ViewingAppointment`):** Đóng vai trò theo dõi tiến trình bán hàng, Lớp `Lead` (Khách hàng tiềm năng) trỏ về `Listing` mà họ quan tâm và có thể sinh ra lượng lớn Lịch hẹn `ViewingAppointment` bằng lời gọi phương thức `confirmAppointment()`.
- **Lớp Trí tuệ Nhân tạo (`ChatbotConversation`, `ChatMessage`):** Được thiết kế dưới dạng luồng dữ liệu RAG. Lớp Hội thoại `ChatbotConversation` giao tiếp 1-N với Tin nhắn và giữ phương thức độc quyền `loadVectorHistory()` để nạp ngữ cảnh tìm kiếm nhà trước khi đưa luồng Streaming cho Khách.

### 3.4.2. Ràng buộc dữ liệu và Phạm vi truy cập
Để đảm bảo tính bảo mật và kỹ thuật đóng gói (Encapsulation), mô hình Lớp của AloNha áp dụng hai mức độ kiểm soát chặt chẽ:
- **Phạm vi Truy cập (Access Modifiers):** Được mô tả bằng ký hiệu (`+`) đại diện cho Public Read/Write. Toàn bộ định danh `id` được hiển thị công khai ở Client. Các trường dữ liệu nhạy cảm (Như số dư ví hoặc transaction) sẽ được cô lập ẩn, Client chỉ có thể thao túng qua Method công khai thông qua Controller.
- **Ràng buộc Mối quan hệ Bản số (Multiplicity):** Ràng buộc khóa ngoại cứng rắn giữ DB không lỏng lẻo. Ví dụ điển hình, Một `Wallet` có thể lưu hàng ngàn lịch sử `Transaction` (Ký hiệu `1 - N`), nhưng một `Transaction` phiếm định không thể rơi tự do trên hệ thống mà không cắm vào bất cứ Ví nào, bảo vệ toàn vẹn Referential Integrity.

### 3.4.3. Sự tương thích với công nghệ triển khai
Mô hình cấu trúc thực thể OOP này được dịch ngược siêu tốc thành mã nguồn vận hành 100% qua Framework của dự án:
- **Tầng Database Migration:** Các Class được trừu tượng hóa trực tiếp bằng ORM Prisma. Prisma biên dịch và sinh ra `schema.prisma` đồng bộ cực khớp vào hệ cơ sở dữ liệu vật lý PostgreSQL (Lưu trữ bởi Supabase). Các dây nối 1-N trong UML tự động sinh ra Foreign-keys cấp độ Database.
- **Tầng Mã nguồn TypeScript:** Thay vì phải khởi tạo thủ công DTO Types (Data Transfer Object) mất thời gian, Prisma Client tận dụng Prisma Schema để tự động sinh ra (Auto-gen) các Interface Type-safe chuẩn Typescript. Nhờ vậy, quá trình gọi hàm `+ login(): AuthToken` hoặc trỏ thuộc tính Data ở các API Route Next.js sẽ tuyệt đối tránh được sai sót biên dịch và rò rỉ bộ nhớ.

## 3.5. Mô hình hoá hành vi

Danh sách biểu đồ được phân chia rành mạch chức năng, tuyệt đối không trùng lặp tác vụ giữa **Activity Diagram (Tập trung UX/UI flow rẽ nhánh)** và **Sequence Diagram (Tập trung phân lớp API flow)**. Dưới đây là 11 sơ đồ thuộc phân nhóm này:

**1. Nhóm Sơ đồ Hoạt động (Activity Diagram) - 5 bản vẽ:**
   - **Hoạt động 1:** Quy trình Đăng ký & Xét duyệt Môi giới (Agent Application Flow).
   - **Hoạt động 2:** Luồng Môi giới Đăng tin Bất động sản mới (Nhập liệu -> Validate -> Upload -> Status).
   - **Hoạt động 3:** Khách hàng Đặt lịch hẹn xem nhà & Môi giới xử lý lịch (Appointments Workflow).
   - **Hoạt động 4:** Quản trị luồng Leads CRM (Tiếp nhận SĐT khách -> Đổi trạng thái chăm sóc).
   - **Hoạt động 5:** Khách hàng Tìm kiếm nhà thủ công bằng bộ lọc tĩnh và tương tác Bản đồ (Map Filter).

**2. Nhóm Sơ đồ Tuần tự (Sequence Diagram) - 5 bản vẽ:**
   - **Tuần tự 1:** Tương tác hệ thống Tìm kiếm AI (Dịch mã và bóc tách thực thể NER: Giá, Diện tích, Vị trí).
   - **Tuần tự 2:** Luồng Môi giới gọi API Đăng tin (Kết hợp AI sinh Auto-Description làm nhiệm vụ phân tích thô).
   - **Tuần tự 3:** Giao tiếp Trò chuyện liên tục với Chatbot AI Tư vấn (Next.js -> Context DB -> LLM Streaming).
   - **Tuần tự 4:** Quản lý giao dịch ảo nội bộ (Luồng nạp quỹ và tiêu thụ dịch vụ đẩy Top).
   - **Tuần tự 5:** Quy trình Xác thực bảo mật (Authentication JWT / NextAuth Sign-In).

## 3.6. Mô hình hoá kiến trúc

### 3.6.1. Sơ đồ kiến trúc tổng thể hệ thống
Vẽ sơ đồ **Component Diagram**, qua đó mô tả:
- Tầng giao diện người dùng (Frontend - Next.js)
- Tầng xử lý logic (Backend / API Routes)
- Tầng AI Service & Core Search Engine
- Tầng lưu trữ (PostgreSQL database)

### 3.6.2. Sơ đồ triển khai
Vẽ sơ đồ **Deployment Diagram** miêu tả môi trường server vật lý/cloud:
- Hosting (Vercel)
- Database Hosting (Supabase/Neon)
- Image Storage (Cloudinary)
- External APIs (Google Gemini API).

### 3.6.3. Kiến trúc tích hợp AI
Vẽ sơ đồ đặc tả việc Next.js truy xuất service AI như thế nào, luồng giao tiếp với RAG, Embedding, Vector Database (nếu có).

### 3.6.4. Sơ đồ luồng xử lý tìm kiếm AI, luồng xử lý Chatbot
Vẽ Flowchart cho các tiến trình:
- **Luồng xử lý tìm kiếm AI:** User -> Phân tích NLP/Trích xuất thực thể (NER) -> Mapping Dữ liệu -> Query Database -> Trả kết quả JSON.
- **Luồng xử lý Chatbot:** Truy vấn -> Trích Context (RAG) -> LLM generate -> Return Text.
