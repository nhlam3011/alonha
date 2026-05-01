# CHƯƠNG 4. TRIỂN KHAI, ĐÁNH GIÁ VÀ HƯỚNG PHÁT TRIỂN

## 4.1. Hiện thực hóa Giao diện người dùng (User Interface)

Giao diện của AloNha được phát triển theo triết lý hiện đại (Modern UI) và ưu tiên sự tối giản (Minimalism) kết hợp với các hiệu ứng linh hoạt (Micro-interactions) từ thư viện TailwindCSS. Điểm nhấn của hệ thống là khả năng đáp ứng trên mọi thiết bị (Responsive Design) và trải nghiệm nguyên khối (SPA - Single Page Application) mượt mà cung cấp bởi Next.js.

Dưới đây là mô tả chi tiết các màn hình cốt lõi đã được xây dựng và đưa vào vận hành thực tế:

### 4.1.1. Khối Xác thực và Định danh (Authentication)
*(Chèn Ảnh màn hình Đăng nhập tại đây)*

Màn hình Đăng nhập và Đăng ký của nền tảng AloNha áp dụng thiết kế Split-Screen (Chia đôi màn hình) tối ưu hóa trải nghiệm người dùng:
- **Khu vực hình ảnh (Bên trái):** Hiển thị Banner chất lượng cao (Landmark 81) kèm thông điệp truyền cảm hứng *"Chìa khóa mở cửa tổ ấm tương lai của bạn"*, tạo sự chuyên nghiệp ngay từ lần truy cập đầu tiên.
- **Biểu mẫu xác thực (Bên phải):** Form nhập liệu tối giản (Email, Mật khẩu có tích hợp icon chuyển đổi ẩn/hiện). Hệ thống hỗ trợ đăng nhập 1 chạm thông qua **Tài khoản Google (OAuth 2.0)** hiện đại.
- **Tiện ích đi kèm:** Giao diện tích hợp đầy đủ công cụ khôi phục "Quên mật khẩu", tính năng "Ghi nhớ đăng nhập", cùng thanh Topbar Banner quảng bá linh hoạt các chiến dịch ưu đãi nạp tiền cho nhà Môi giới.

### 4.1.2. Màn hình Trang chủ - Semantic AI Search
*(Ảnh tham khảo: Màn hình Home)*

Trang chủ (Home Page) đóng vai trò là "giao diện trò chuyện" chính của hệ thống, nơi thể hiện thông điệp "Kiến tạo không gian sống" và sức mạnh kĩ thuật cao nhất của đồ án.
- **Thanh tìm kiếm AI trung tâm:** Thoát khỏi lối mòn của các ô Dropdown khô khan, trung tâm màn hình là thanh tìm kiếm sử dụng Xử lý ngôn ngữ tự nhiên (NLP/Gemini). Ô input cho phép khách nhập trực tiếp ngữ cảnh như *"Căn hộ 2 phòng ngủ gần quận 7, giá dưới 3 tỷ..."*.
- **Hỗ trợ tương tác:** Hệ thống có sẵn nút **Tìm kiếm bằng Giọng nói (Voice Search)** có biểu tượng Micro, cùng danh sách các gợi ý từ khóa (Suggestion Chips) thao tác nhanh.
- **Thanh điều hướng:** Bao gồm các danh mục "Bất động sản", "Bản đồ", "Dự án", "Tin tức", cùng nút chuyển đổi linh hoạt giao diện Sáng/Tối (Dark/Light mode). Góc dưới màn hình tích hợp sẵn bong bóng chat (Chatbot AI Assistant).

### 4.1.3. Màn hình Tìm kiếm Bản đồ (Map-based Search & Listing)
*(Chèn Ảnh màn hình Bản đồ tại đây)*

Tính năng Tìm kiếm Nâng cao cung cấp trải nghiệm chia đôi màn hình (Split-view) kết hợp trơn tru giữa Danh mục thẻ xếp lớp và Bản đồ địa lý:
- **Cột Danh sách BĐS (Trái):** Các tài sản được biểu diễn bởi chuẩn thẻ Card cao cấp. Tích hợp nổi bật các góc nhãn dán (VIP, Đã xác thực), nút thao tác nhanh (Yêu thích/So sánh) cùng hàng Icon chỉ số minh họa rõ ràng (Giá, Diện tích, Số lượng phòng).
- **Bản đồ Tương tác (Phải):** Sử dụng hệ thống Point Marker động. Điểm đột phá là Marker không phải là "cây ghim" vô tri mà **hiển thị trực tiếp mức tiền** (Ví dụ: 12.5 tỷ, 8.5 tỷ) ngay trên bản đồ địa lý, giúp khách hàng phán đoán chênh lệch giá sàn khu vực ngay lập tức.
- **Thanh Công cụ Điều hướng:** Dàn Filter lọc ngang màn hình. Góc phải bổ sung cụm nút Toggle thông minh để dễ dàng chuyển nhanh giữa 3 chế độ xem: *Chia màn*, *Danh sách Grid* hoặc *Bản đồ toàn màn hình*.

### 4.1.4. Màn hình Khám phá Dự án Bất Động Sản (Projects)
*(Ảnh tham khảo: Màn hình Dự án BĐS)*

Đối với phân khúc sơ cấp, hệ thống bố trí một trang Danh mục Dự án độc lập có cùng bộ guideline thiết kế với trang Listing nhưng khác biệt về thông tin nội tại.
- Lưới hiển thị các thẻ siêu dự án với hình thu nhỏ phối cảnh (Cover Image).
- Các thẻ cung cấp nhanh tên dự án (VD: Ha Long Xanh, Vinhomes Green City), Trạng thái thi công (Đang bán), Vị trí cốt lõi và Tên Tập đoàn Chủ Đầu Tư. 
- Chỉ số nhanh về Quy mô (diện tích hecta) và Số lượng Tin đăng môi giới hiện có tại dự án đó, cho phép khách hàng nhấn vào để xem toàn thể các bất động sản thuộc phân khu đó.

### 4.1.5. Chuyên trang Tin tức Ngành (Blog / News)
*(Ảnh tham khảo: Màn hình Tin tức)*

Trang Tin tức (Articles) đóng vai trò giữ chân người dùng (Retention) và được tối ưu hóa dữ liệu chạy ngầm (CRON Jobs).
- Giao diện hiện đại với phong cách Card-based. Bài đăng nổi bật (Hero Article) chiếm trọn màn rộng với ảnh nền tối và chữ trắng, cung cấp tít báo mạnh (Ví dụ: Các chính sách hỗ trợ lãi suất).
- Tag danh mục (Doanh nghiệp, Thị trường) và các thông số bổ trợ (Ngày xuất bản, Nguồn báo, Thời gian đọc ước tính) hiển thị chuẩn mực và tăng độ uy tín (Author authority). Bộ công cụ tìm kiếm và lọc nguồn tin (Search & Filter) được tích hợp ở phía trên nhằm dễ dàng tra cứu.

### 4.1.6. Giao diện và Chức năng Trợ lý thông minh (Chatbot AI)
*(Chèn Ảnh màn hình Chatbot AI tại đây)*

Nền tảng AloNha tích hợp Phân hệ Chatbot theo dạng tiện ích nổi (Floating Widget UI), tạo trải nghiệm hỗ trợ liền mạch dưới hình thức Popup đè lớp:
- **Cấu trúc Header định danh:** Gây ấn tượng bằng thiết kế chuẩn mực với danh xưng "Trợ lý AloNha", đi kèm dấu chấm xanh báo hiệu trạng thái Online thức trực liên tục.
- **Luồng Hội thoại Chào mừng:** Điểm UX đáng giá nhất là cung cấp sẵn chùm **4 Nút Gợi ý chạm nhanh (Suggestion Chips)** (VD: *Căn hộ 2PN dưới 4 tỷ*, *Pháp lý đặt cọc...*). Nhờ đó, người dùng lập tức biết được giới hạn tri thức của AI để bắt đầu hội thoại mà không cần học cách gõ Prompt.
- **Thanh Công cụ Input:** Thanh gõ lệnh thiên hướng tối giản, sử dụng đường viền nổi bật bọc chức năng Gửi (Send Message) dạng máy bay giấy.

**Cơ chế hoạt động và Chức năng ẩn:**
Vượt xa giới hạn một khung chat tĩnh, cửa sổ này liên kết trực tiếp với **Google Gemini API**. Mọi tin nhắn gửi đi (Prompt) đều được tiêm trước ngữ cảnh thông qua kiến trúc RAG (Retrieval-Augmented Generation). Điều này giúp Chatbot có "trí nhớ" cục bộ: AI tự định vị được trang BĐS Khách hàng đang đứng xem, từ đó đưa ra lời khuyên phong thủy, đánh giá tỷ suất sinh lời, hoặc tính toán dòng tiền vay thế chấp hoàn toàn dựa trên ngân sách thực của khách hàng.
