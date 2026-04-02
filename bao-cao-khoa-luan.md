# MỤC LỤC

1. [LỜI CAM ĐOAN](#lời-cam-đoan)
2. [LỜI CẢM ƠN](#lời-cảm-ơn)
3. [DANH MỤC CÁC TỪ VIẾT TẮT](#danh-mục-các-từ-viết-tắt)
4. [DANH MỤC BẢNG](#danh-mục-bảng)
5. [DANH MỤC HÌNH](#danh-mục-hình)
6. [MỞ ĐẦU](#mở-đầu)
7. [CHƯƠNG 1. TỔNG QUAN VỀ ĐỀ TÀI](#chương-1-tổng-quan-về-đề-tài)
    - [1.1. Lý do chọn đề tài](#11-lý-do-chọn-đề-tài)
    - [1.2. Mục tiêu và nhiệm vụ nghiên cứu](#12-mục-tiêu-và-nhiệm-vụ-nghiên-cứu)
    - [1.3. Đối tượng và phạm vi nghiên cứu](#13-đối-tượng-và-phạm-vi-nghiên-cứu)
    - [1.4. Phương pháp nghiên cứu](#14-phương-pháp-nghiên-cứu)
    - [1.5. Dự kiến kết quả](#15-dự-kiến-kết-quả)
    - [1.6. Ý nghĩa khoa học và thực tiễn](#16-ý-nghĩa-khoa-học-và-thực-tiễn)
8. [CHƯƠNG 2. CƠ SỞ LÝ THUYẾT](#chương-2-cơ-sở-lý-thuyết)
    - [2.1. Tổng quan về PropTech và thị trường Bất động sản](#21-tổng-quan-về-proptech-và-thị-trường-bất-động-sản)
    - [2.2. Tổng quan về bài toán và Nhu cầu thực tiễn](#22-tổng-quan-về-bài-toán-và-nhu-cầu-thực-tiễn)
    - [2.3. Phương pháp Phân tích và Thiết kế hệ thống](#23-phương-pháp-phân-tích-và-thiết-kế-hệ-thống)
    - [2.4. Nền tảng công nghệ phát triển (Technology Stack)](#24-nền-tảng-công-nghệ-phát-triển-technology-stack)
    - [2.5. Trí tuệ nhân tạo và ứng dụng trong xử lý ngôn ngữ tự nhiên](#25-trí-tuệ-nhân-tạo-và-ứng-dụng-trong-xử-lý-ngôn ngữ-tự-nhiên)
    - [2.6. Đánh giá các nền tảng và nghiên cứu liên quan](#26-đánh-giá-các-nền-tảng-và-nghiên-cứu-liên-quan)
    - [2.7. Kết luận chương](#27-kết-luận-chương)

---

# LỜI CAM ĐOAN

Tôi xin cam đoan đây là công trình nghiên cứu của riêng tôi. Các số liệu, kết quả và những nội dung được trình bày trong Khóa luận này là trung thực và chưa từng được công bố tại bất kỳ đâu hay trong bất kỳ công trình nghiên cứu nào khác. Mọi sự giúp đỡ trong quá trình thực hiện khóa luận này đã được cảm ơn và các nguồn tài liệu trích dẫn đã được chỉ rõ.

---

# LỜI CẢM ƠN

Trước hết, em xin gửi lời cảm ơn sâu sắc nhất tới thầy/cô... – giảng viên hướng dẫn đã tận tình chỉ bảo, hỗ trợ và định hướng cho em trong suốt quá trình triển khai đề tài này. Những kiến thức và kinh nghiệm quý báu của thầy/cô không chỉ giúp em hoàn thành khóa luận mà còn là hành trang quan trọng cho sự nghiệp tương lai.

Em cũng xin gửi lời cảm ơn tới toàn thể các thầy cô giáo trong Khoa Công nghệ Thông tin đã truyền đạt tri thức và tạo điều kiện thuận lợi nhất để em học tập tại trường. Cuối cùng, con xin cảm ơn gia đình, bạn bè đã luôn đồng hành, động viên và hỗ trợ kịp thời để con có thể hoàn thành tốt chương trình học và khóa luận tốt nghiệp của mình.

---

# DANH MỤC CÁC TỪ VIẾT TẮT

| Từ viết tắt | Nghĩa tiếng Việt / Tiếng Anh |
| :--- | :--- |
| **AI** | Trí tuệ nhân tạo (Artificial Intelligence) |
| **NLP** | Xử lý ngôn ngữ tự nhiên (Natural Language Processing) |
| **LLM** | Mô hình ngôn ngữ lớn (Large Language Model) |
| **SSR** | Server-Side Rendering (Kết xuất phía máy chủ) |
| **API** | Application Programming Interface (Giao diện lập trình ứng dụng) |
| **ORM** | Object-Relational Mapping (Ánh xạ thực thể quan hệ) |
| **CMS** | Content Management System (Hệ thống quản lý nội dung) |
| **PropTech** | Công nghệ Bất động sản (Property Technology) |

---

# CHƯƠNG 1. TỔNG QUAN VỀ ĐỀ TÀI

## 1.1. Lý do chọn đề tài

Trong một thập kỷ qua, thị trường bất động sản Việt Nam đã chứng kiến sự tăng trưởng vượt bậc với hàng vạn giao dịch diễn ra mỗi tháng. Tuy nhiên, một vấn đề nhức nhối vẫn tồn tại: **Sự bất đối xứng thông tin và hiệu quả tìm kiếm thấp**. Người dùng khi có nhu cầu mua hoặc thuê nhà thường phải đối mặt với vô vàn rào cản từ việc lọc tin rao vặt thủ công đến việc đối phó với thông tin ảo, rời rạc.

Phần lớn các nền tảng bất động sản truyền thống hiện nay đang phụ thuộc vào các bộ lọc (filter) cứng nhắc. Điều này vô hình trung tạo ra một rào cản tâm lý đối với những người không chuyên. Người dùng phải dành hàng giờ để chọn từng tiêu chí từ quận huyện, mức giá, diện tích đến hướng nhà, nhưng kết quả đôi khi không đúng với "ý muốn" ẩn sau câu lệnh. 

Bên cạnh đó, sự bùng nổ của **Trí tuệ nhân tạo (AI)**, đặc biệt là các mô hình ngôn ngữ lớn (LLM) như Google Gemini, đã mở ra một kỷ nguyên mới. Khả năng hiểu ngữ cảnh và hội thoại linh hoạt của AI cho phép chúng ta thay đổi cách thức tương tác với dữ liệu. Thay vì điền vào một form khô khan, người dùng có thể trò chuyện với hệ thống như đang làm việc với một môi giới chuyên nghiệp. Đây chính là lý do em quyết định thực hiện đề tài **"Xây dựng website bất động sản thông minh AloNha"** tích hợp AI và NLP, nhằm mang lại một giải pháp tìm kiếm tự nhiên, trực quan và hiệu quả hơn cho thị trường PropTech tại Việt Nam.

## 1.2. Mục tiêu và nhiệm vụ nghiên cứu

### 1.2.1. Mục tiêu tổng quát
Xây dựng một nền tảng website hỗ trợ tìm kiếm và quản lý bất động sản thông minh, ứng dụng các công nghệ hiện đại nhất (Next.js 16, AI Gemini) để tối ưu hóa trải nghiệm người dùng và môi giới.

### 1.2.2. Nhiệm vụ cụ thể
- Nghiên cứu cơ sở lý thuyết về phát triển ứng dụng web hiện đại (Next.js 16, React 19).
- Nghiên cứu và tích hợp các mô hình ngôn ngữ lớn (LLM) để xử lý tìm kiếm theo ngôn ngữ tự nhiên.
- Xây dựng hệ thống quản lý bất động sản hoàn thiện: Đăng tin, duyệt tin, phân quyền Admin/Môi giới/User.
- Triển khai các công cụ hỗ trợ: So sánh BĐS, tính toán khoản vay, xem bản đồ trực quan.
- Xây dựng chatbot tư vấn phong thủy và gợi ý bất động sản dựa trên nhu cầu thực của khách hàng.

## 1.3. Đối tượng và phạm vi nghiên cứu

### 1.3.1. Đối tượng nghiên cứu
- Các công nghệ lập trình web: Framework Next.js, kiến trúc App Router.
- Công nghệ xử lý ngôn ngữ tự nhiên (NLP) thông qua API của Google Gemini.
- Quy trình nghiệp vụ trong giao dịch và quản lý bất động sản.

### 1.3.2. Phạm vi nghiên cứu
- **Về chức năng:** Tập trung vào 3 phân hệ chính: Khách hàng (Tìm kiếm, xem tin), Môi giới (Đăng tin, quản lý Lead), và Admin (Quản trị hệ thống, duyệt bài).
- **Về công nghệ:** Sử dụng Next.js phiên bản 16 (mới nhất), Prisma ORM kết hợp PostgreSQL, Google Gemini AI.
- **Về địa lý:** Ưu tiên dữ liệu bất động sản tại các thành phố lớn của Việt Nam (Hà Nội, TP.HCM).

## 1.4. Phương pháp nghiên cứu

Để thực hiện đề tài, nhóm nghiên cứu áp dụng kết hợp các phương pháp sau:
1. **Phương pháp nghiên cứu lý thuyết:** Thu thập và phân tích tài liệu về các framework phát triển web, các bài báo khoa học về NLP và ứng dụng AI trong doanh nghiệp.
2. **Phương pháp khảo sát:** Phân tích nhu cầu của người dùng trên các trang web BĐS hiện có để tìm ra những điểm yếu cần khắc phục.
3. **Phương pháp thực nghiệm (Phát triển phần mềm):** Áp dụng mô hình **Agile/Scrum**, chia nhỏ quá trình phát triển thành các sprint để nhanh chóng có sản phẩm thử nghiệm và cải tiến.
4. **Phương pháp đánh giá:** Kiểm thử chức năng (Unit Test), kiểm thử trải nghiệm người dùng (UX Testing) để đảm bảo tính ổn định và thân thiện của hệ thống.

## 1.5. Dự kiến kết quả

Sản phẩm đầu ra là website **AloNha** đạt được các tiêu chuẩn sau:
- **Tính thông minh:** Người dùng có thể tìm kiếm bằng câu lệnh như "Tìm nhà ở Quận 7 tầm 5 tỷ có 3 phòng ngủ" và nhận lời giải chi tiết.
- **Tính toàn diện:** Đầy đủ các tính năng cho môi giới quản lý ví tiền, thanh toán tin VIP và theo dõi lịch hẹn xem nhà.
- **Tính hiện đại:** Giao diện tối ưu (Tailwind 4), tốc độ tải trang cực nhanh nhờ Server Components, bảo mật cao với NextAuth v5.
- **Tính tương tác:** Chatbot trả lời thông minh, tư vấn cả về yếu tố phong thủy và vị trí.

## 1.6. Ý nghĩa khoa học và thực tiễn

### 1.6.1. Ý nghĩa khoa học
Đề tài góp phần nghiên cứu cách thức tích hợp một cách hiệu quả các mô hình ngôn ngữ lớn (LLM) vào một hệ thống quản lý dữ liệu quan hệ (PostgreSQL) truyền thống. Đây là một minh chứng thực tiễn cho việc kết hợp giữa công nghệ Web 2.0 và Trí tuệ nhân tạo hiện đại.

### 1.6.2. Ý nghĩa thực tiễn
- Đối với người dùng: Giảm thiêu thời gian tìm kiếm, nhận được sự tư vấn hỗ trợ 24/7.
- Đối với môi giới: Tăng hiệu suất làm việc, quản lý tin đăng và khách hàng một cách chuyên nghiệp, tập trung.
- Đối với thị trường: Góp phần số hóa ngành bất động sản Việt Nam, tạo ra một môi trường giao dịch minh bạch và thông minh hơn.

---

# CHƯƠNG 2. CƠ SỞ LÝ THUYẾT

## 2.1. Tổng quan về PropTech và thị trường Bất động sản

**PropTech (Property Technology)** là thuật ngữ dùng để chỉ việc sử dụng công nghệ thông tin nhằm giúp các cá nhân, doanh nghiệp nghiên cứu, mua bán và quản lý bất động sản hiệu quả hơn. Tại Việt Nam, PropTech đang ở giai đoạn "bùng nổ" với sự xuất hiện của nhiều sàn giao dịch trực tuyến. Tuy nhiên, đa số các nền tảng vẫn dừng lại ở mức "rao vặt" và chưa tận dụng hết sức mạnh của dữ liệu và AI. 

Thị trường bất động sản là một lĩnh vực đặc thù với giá trị tài sản lớn, quy trình pháp lý phức tạp và yếu tố cảm xúc (như phong thủy, gu thẩm mỹ). Do đó, việc xây dựng một nền tảng không chỉ cung cấp thông tin mà còn phải cung cấp "sự tư vấn" là vô cùng cấp thiết.

## 2.2. Tổng quan về bài toán và Nhu cầu thực tiễn

Bài toán đặt ra là: Làm sao để một người dùng bình thường, không quá am hiểu về công nghệ hay thuật ngữ chuyên môn, có thể tìm được "ngôi nhà mơ ước" nhanh nhất? Nhu cầu thực tiễn hiện nay tập trung vào 3 điểm:
1. **Sự tiện lợi:** Tìm kiếm bằng tiếng nói hoặc ngôn ngữ chat tự nhiên.
2. **Sự tin cậy:** Tin được kiểm duyệt, thông tin minh bạch về giá và vị trí.
3. **Tính cá nhân hóa:** Hệ thống phải hiểu được sở thích của người dùng để gợi ý những sản phẩm phù hợp thay vì hiển thị tràn lan.

## 2.3. Phương pháp Phân tích và Thiết kế hệ thống

Dự án AloNha áp dụng phương pháp thiết kế hướng dịch vụ và kiến trúc 3 lớp (3-tier architecture):
- **Presentation Layer (Tầng trình diễn):** Xây dựng bằng Next.js 16 và React 19, chịu trách nhiệm tương tác người dùng.
- **Logic Layer (Tầng nghiệp vụ):** Sử dụng Server Actions và API Routes của Next.js để xử lý logic, tính toán và gọi các dịch vụ AI.
- **Data Layer (Tầng dữ liệu):** Lưu trữ trong PostgreSQL, quản lý bởi Prisma. Đảm bảo tính toàn vẹn dữ liệu cho các giao dịch ví tiền và tin đăng.

Về quy trình phát triển, mô hình **Agile** được ưu tiên với các ưu điểm về sự linh hoạt, cho phép thay đổi yêu cầu và tích hợp liên tục (CI/CD) để đảm bảo chất lượng code cao nhất.

## 2.4. Nền tảng công nghệ phát triển (Technology Stack)

Hệ thống được xây dựng trên một ngăn xếp công nghệ tiên tiến nhất hiện nay:

### 2.4.1. Next.js 16 và React 19
Đây là phiên bản mới nhất mang lại nhiều cải tiến đột phá:
- **Server Components:** Giúp giảm thiểu đáng kể dung lượng JavaScript tải về trình duyệt, tăng tốc độ First Contentful Paint (FCP).
- **React 19 Concurrent Features:** Xử lý render đồng thời, giúp giao diện không bao giờ bị "đơ" khi xử lý dữ liệu lớn.
- **App Router:** Hệ thống routing dựa trên file file-system, hỗ trợ layout lồng nhau và caching mạnh mẽ.

### 2.4.2. Tailwind CSS 4
Phiên bản 4 của Tailwind được tinh chỉnh cho tốc độ build nhanh hơn và hệ thống token cấu hình linh hoạt. Với phương châm Utility-First, nó giúp nhóm phát triển xây dựng giao diện responsive và đẹp mắt một cách nhanh chóng mà không cần viết quá nhiều file CSS riêng lẻ.

### 2.4.3. Prisma 7 và PostgreSQL
Prisma là một ORM hiện đại cung cấp trải nghiệm lập trình type-safe hoàn hảo với TypeScript. Kết hợp với PostgreSQL – một hệ quản trị cơ sở dữ liệu quan hệ mã nguồn mở mạnh mẽ nhất hiện nay – hệ thống đảm bảo khả năng mở rộng (scalability) và độ tin cậy tuyệt đối cho dữ liệu giao dịch tài chính của môi giới.

### 2.4.4. NextAuth v5 (Auth.js)
Hệ thống xác thực được triển khai với NextAuth v5, hỗ trợ đăng nhập đa phương thức (Email, Google OAuth). Đây là giải pháp an toàn nhất cho các ứng dụng Next.js hiện nay, hỗ trợ tốt nhất cho Middleware và Edge Runtime.

## 2.5. Trí tuệ nhân tạo và ứng dụng trong xử lý ngôn ngữ tự nhiên

Trái tim của AloNha chính là việc tích hợp **Google Gemini SDK**. Gemini là mô hình AI thế hệ mới với khả năng đa phương thức (multimodal) và hiểu ngôn ngữ tiếng Việt vô cùng xuất sắc.

Dự án áp dụng AI vào các khía cạnh:
1. **Search Intent Classification (Phân loại ý định tìm kiếm):** Khi người dùng nhập một câu lệnh, AI sẽ phân tích xem đây là yêu cầu tìm mua, tìm thuê hay chỉ là hỏi tư vấn chung.
2. **Entity Extraction (Trích xuất thực thể):** Tự động bóc tách các thông tin từ câu chat như: Quận (Location), Mức giá (Price Range), Số phòng ngủ (Bedroom count),... để tạo ra một query database chính xác.
3. **Sentiment Analysis & Recommendation:** Phân tích nhu cầu sâu của khách hàng để đưa ra các gợi ý bất động sản "liên quan" thay vì chỉ dựa trên các tham số lọc thô.

## 2.6. Đánh giá các nền tảng và nghiên cứu liên quan

Nghiên cứu tiến hành đánh giá 2 nền tảng lớn nhất tại Việt Nam là **Batdongsan.com.vn** và **Chotot**.
- **Ưu điểm:** Lượng dữ liệu khổng lồ, uy tín lâu năm.
- **Nhược điểm:** Trải nghiệm tìm kiếm vẫn phụ thuộc hoàn toàn vào bộ lọc cứng. Người dùng dễ bị lạc trong "biển" thông tin ảo và giao diện chứa quá nhiều quảng cáo gây nhiễu.

AloNha ra đời không nhằm mục đích thay thế về mặt dữ liệu mà nhằm thay đổi **Cách thức tiếp cận dữ liệu**. Bằng việc áp dụng "Conversational UI" và "Semantic Search", AloNha tạo ra sự khác biệt lớn về mặt trải nghiệm người dùng cuối.

## 2.7. Kết luận chương

Tóm lại, Chương 2 đã trình bày chi tiết các nền tảng lý thuyết và công cụ kỹ thuật cần thiết để xây dựng AloNha. Việc lựa chọn stack công nghệ gồm **Next.js 16, Prisma 7 và AI Gemini** không chỉ đảm bảo hiệu năng hiện tại mà còn giúp hệ thống dễ dàng nâng cấp và tích hợp các tính năng thông minh hơn nữa trong tương lai. Đây là bước chuẩn bị quan trọng nhất trước khi tiến tới giai đoạn Phân tích và Thiết kế chi tiết ở Chương 3.
