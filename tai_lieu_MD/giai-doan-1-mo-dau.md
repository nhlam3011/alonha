# [BẢN NHÁP REPORT] GIAI ĐOẠN 1: TỜ BÌA VÀ MỞ ĐẦU

*(Bạn hãy copy nội dung bên dưới và dán vào file Word. Đừng quên căn chỉnh định dạng chuẩn của nhà trường yêu cầu: Font Times New Roman 13, Line spacing 1.5, Canh lề Trái 3cm, lề Phải/Trên/Dưới 2cm)*

---

**(TRANG BÌA - COVER PAGE)**
------------------------------------------------------
BỘ GIÁO DỤC VÀ ĐÀO TẠO
TRƯỜNG ĐẠI HỌC [TÊN TRƯỜNG CỦA BẠN]
KHOA CÔNG NGHỆ THÔNG TIN

[Chèn ảnh Logo Trường vào đây]

**BÁO CÁO KHÓA LUẬN / ĐỒ ÁN TỐT NGHIỆP**

**ĐỀ TÀI:**
**XÂY DỰNG WEBSITE BẤT ĐỘNG SẢN THÔNG MINH ALONHA**
**TÍCH HỢP TRÍ TUỆ NHÂN TẠO VÀ XỬ LÝ NGÔN NGỮ TỰ NHIÊN (AI/NLP)**

**Sinh viên thực hiện:** [Họ và tên của bạn]
**Mã sinh viên:** [Mã SV]
**Lớp:** [Tên lớp]
**Giảng viên hướng dẫn:** [Ghi rõ học hàm/học vị - Họ và tên Thầy/Cô]

Hà Nội / TP.HCM, Tháng [XX] Năm 2026
------------------------------------------------------

*(Sang trang)*
**(LỜI CAM ĐOAN)**

# LỜI CAM ĐOAN

Tôi xin cam đoan đây là công trình nghiên cứu và phát triển phần mềm của riêng tôi dưới sự hướng dẫn của [Tên Thầy/Cô]. Các số liệu, kết quả và những đoạn mã nguồn, tài liệu được trình bày trong Khóa luận này là hoàn toàn trung thực, tự tôi tìm hiểu xây dựng và chưa từng được công bố tại bất kỳ bản báo cáo hay trong bất kỳ công trình nghiên cứu khoa học nào khác. Mọi sự giúp đỡ trong quá trình thực hiện khóa luận này đã được tôi gửi lời tri ân và các nguồn tài liệu, thư viện mã nguồn mở trích dẫn đã được liệt kê chỉ rõ nguồn gốc tại mục tài liệu tham khảo. Nếu có dấu hiệu sao chép (đạo văn), tôi xin hoàn toàn chịu trách nhiệm trước Hội đồng bảo vệ và nhà trường.

Sinh viên thực hiện
(Ký và ghi rõ họ tên)

*(Sang trang)*
**(LỜI CẢM ƠN)**

# LỜI CẢM ƠN

Trước hết, em xin gửi lời cảm ơn sâu sắc nhất tới Thầy/Cô [Tên Thầy/Cô] – giảng viên hướng dẫn đã tận tình chỉ bảo, động viên, theo dõi và định hướng chuyên môn cho em trong suốt quá trình triển khai dự án AloNha cũng như hoàn thành tài liệu khóa luận này. Những kiến thức và kinh nghiệm thực tiễn quý báu của Thầy/Cô không chỉ giúp em tháo gỡ nhiều vướng mắc khó khăn trong việc áp dụng hệ thống AI/NLP vào dự án thực tế mà còn là hành trang kiến thức vững chãi cho sự nghiệp Kỹ sư phần mềm tương lai của em.

Em cũng xin trân trọng gửi lời tri ân tới toàn thể quý thầy cô giáo trong Khoa Công nghệ Thông tin, những người đã truyền đạt những tri thức nền tảng vô giá, rèn luyện cho em tư duy thiết kế phần mềm linh hoạt, và luôn tạo ra một môi trường học tập tiên tiến nhất cho sinh viên thực hành.

Cuối cùng, con xin chân thành cảm ơn gia đình, những người bạn đồng hành nhóm kín đã luôn là chỗ dựa tinh thần vô giá, luôn cổ vũ và sẵn sàng giúp đỡ chia sẻ áp lực để con có được sự tập trung cao độ nhất hoàn thành tốt chương trình học, cũng như khóa luận tốt nghiệp này. Do khoảng thời gian thực hiện nghiên cứu có giới hạn nên sản phẩm phần mềm AloNha và nội dung học thuật của bản báo cáo chắc chắn vẫn sẽ còn những hạn chế. Em rất mong nhận được những ý kiến đóng góp tận tình của các thầy cô Hội đồng đánh giá để em có thể tiếp tục hoàn thiện hơn nữa nghiệp vụ kĩ thuật thuật của bản thân.

Em xin chân thành cảm ơn!

*(Sang trang)*
**(DANH MỤC CÁC TỪ VIẾT TẮT)**

# DANH MỤC CÁC TỪ VIẾT TẮT

| Từ viết tắt | Thuật ngữ gốc tiếng Anh | Giải nghĩa thuật ngữ tiếng Việt |
| :--- | :--- | :--- |
| **AI** | Artificial Intelligence | Trí tuệ nhân tạo |
| **NLP** | Natural Language Processing | Thuật toán xử lý ngôn ngữ tự nhiên |
| **LLM** | Large Language Model | Mô hình ngôn ngữ lớn (ví dụ Gemini) |
| **PropTech** | Property Technology | Công nghệ thông minh ứng dụng trong lĩnh vực Bất động sản |
| **SSR** | Server-Side Rendering | Kỹ thuật kết xuất giao diện website hiển thị trực tiếp từ máy chủ web |
| **ORM** | Object-Relational Mapping | Kỹ thuật ánh xạ dữ liệu trực tiếp từ Bảng thành Code quản trị |
| **API** | Application Programming Interface | Giao diện chuẩn lập trình ứng dụng dùng để giao tiếp qua lại |
| **CMS** | Content Management System | Hệ thống giao diện quản trị nội dung dành cho Quản trị viên |
| **UI/UX** | User Interface/User Experience | Giao diện người dùng / Trải nghiệm chuyển đổi người dùng |

*(Sang trang)*
**(MỞ ĐẦU)**

# MỞ ĐẦU

Trong bối cảnh thời đại số hóa hiện nay, thị trường bất động sản (BĐS) tại Việt Nam đang có bước chạy đà chuyển dịch mạnh mẽ lên môi trường trực tuyến. Việc tìm hiểu, giao dịch nhà đất đang trở thành nhu cầu thiết yếu hàng ngày, không chỉ đóng ranh giới ở nhóm cá nhân có nhu cầu lưu trú, mà còn liên quan đến hệ thống khổng lồ các sàn giao dịch trực tuyến, môi giới độc lập và các nhà đầu tư.

Tuy nhiên, song song với sự phát triển khối lượng giao dịch ấy, quá trình trải nghiệm mua bán hoặc cho thuê BĐS online vẫn đang tồn đọng vô vàn "nỗi đau" kìm hãm quy mô ngành. Yếu điểm chí mạng nhất nằm ở "Rào cản quy trình tìm kiếm". Đa số các sàn lưu trữ thông tin lâu đời hiện nay vẫn còn đang phụ thuộc vào bộ máy tìm kiếm Filter cứng nhắc. Khách hàng, đặc biệt là nhóm đối tượng không quá am hiểu công nghệ, vẫn đang tốn hàng giờ đồng hồ mệt mỏi tự chọn đi chọn lại từng hộp thông số rời rạc (cấu trúc phòng ngủ, mức giá trần, hướng nhà, tỉnh lộ phường xã) để rồi nhận lại một chuỗi danh sách bài đăng không khớp với ý nguyện hoặc chứa đầy nội dung bài ảo. Sự bất đối xứng luồng thông tin này khiến tương tác mua-bán kéo dài và kém thân thiện.

Để tháo gỡ điểm mù này, khoa học máy tính thế hệ thứ tư và sự trỗi dậy mạnh mẽ của Trí tuệ nhân tạo (AI) đã đem lại rất nhiều giải pháp đột phá. Trong số đó phải kể tới kỹ thuật học máy về Mô hình Ngôn ngữ lớn (LLM). Sự xuất hiện của LLM đã tái sinh định nghĩa tìm kiếm truyền thống, thay bằng cụm từ "Tìm kiếm qua hội thoại tự nhiên" (Conversational Search). Máy móc bắt đầu hiểu được những ý tưởng giao tiếp phức tạp như cách con người tự nói chuyện trao đổi với nhau trực tiếp.

Từ cơ sở học thuật và những vấn đề còn nhức nhối trong nhu cầu thực tiễn đó, em quyết định chọn đề tài: **“Xây dựng nền tảng bất động sản thông minh AloNha ứng dụng Trí tuệ nhân tạo (AI) và Xử lý ngôn ngữ tự nhiên (NLP)”**. 

Dự án AloNha không chỉ dừng lại ở phạm vi một website thương mại điện tử mua – bán nhà ở được lập trình qua kiến trúc SSR mã nguồn mở mới nhất (Next.js Framework). AloNha còn định hướng kết hợp khối kiến trúc Trí tuệ nhân tạo (thông qua API của Google Gemini) vào trái tim vận hành máy chủ nhằm giải quyết thẳng vấn đề cản trở Tìm kiếm. Qua đó, hệ sinh thái AloNha tham vọng đem tới cho Khách hàng một vị "trợ lý AI ảo" dễ dàng hiểu trọn vẹn những câu từ đời thường nhất. Ở chiều ngược lại, với khối quản trị viên (Môi giới), AloNha sẽ là một công cụ quy trình khép kín đỉnh cao tích hợp từ tự động sinh nội dung bán nhà bằng AI cho tới quản trị ví tiền nạp top VIP điện tử. Việc ứng dụng linh hoạt các thuật toán AI/NLP này chắc chắn sẽ khởi nguồn mở ra cánh cửa số hóa trải nghiệm cho ngành môi giới BĐS Việt Nam trong thời gian tới.
