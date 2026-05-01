### 3.7. Thiết kế cơ sở dữ liệu (Bậc Vật lý)

Dưới đây là chi tiết thiết kế các bảng trọng yếu nhất của hệ thống AloNha, bám sát các luồng dữ liệu (Tin đăng, Giao dịch môi giới, Hệ thống RAG AI). 

*(Bạn copy các bảng này dán trực tiếp vào file Word để hoàn thiện đồ án nhé!)*

---

#### 1. Bảng USER (Quản trị Người dùng & Môi giới)
| Tên trường | Kiểu dữ liệu | Mô tả | Điều kiện |
| :--- | :--- | :--- | :--- |
| `id` | String | Khóa định danh người dùng hệ thống | Khóa chính, Mặc định `cuid()` |
| `email` | String | Địa chỉ Email dùng đăng nhập | Unique, Có thể rỗng (Nullable) |
| `phone` | String | Số điện thoại dùng đăng nhập | Unique, Có thể rỗng (Nullable) |
| `passwordHash`| String | Mật khẩu đã băm (Bcrypt) | Có thể rỗng (với tài khoản Oauth)|
| `name` | String | Họ và tên hiển thị | Not Null |
| `avatar` | String | Đường dẫn URI tới Cdn ảnh đại diện | Có thể rỗng (Nullable) |
| `role` | Enum (UserRole)| Vai trò: `USER`, `AGENT`, `ADMIN` | Mặc định `USER` |
| `isVerified` | Boolean | Cờ xác thực danh tính / Email | Mặc định `false` |
| `createdAt` | DateTime | Dấu thời gian tạo tài khoản | Mặc định bằng Now() |
| `updatedAt` | DateTime | Dấu thời gian cập nhật thông tin | Tự động cập nhật (@updatedAt)|

#### 2. Bảng LISTING (Quản lý Tin đăng Bất động sản)
| Tên trường | Kiểu dữ liệu | Mô tả | Điều kiện |
| :--- | :--- | :--- | :--- |
| `id` | String | Khóa định danh tin đăng | Khóa chính, Mặc định `cuid()` |
| `slug` | String | Đường dẫn chuẩn hóa (Dành cho SEO) | Unique, Not Null |
| `title` | String | Tiêu đề thông tin rao bán/cho thuê | Not Null |
| `description` | String | Nội dung văn bản thô do người dùng nhập | Có thể rỗng (Nullable) |
| `aiDescription`| String | Nội dung được LLM định dạng lại đẹp | Có thể rỗng (Nullable) |
| `listingType` | Enum | Loại hình giao dịch (`SALE` hoặc `RENT`) | Not Null |
| `category` | Enum | Chủng loại (Căn hộ chung cư, Đất nền..)| Not Null |
| `status` | Enum | Kiểm duyệt (`PENDING` hoặc `APPROVED`)| Mặc định `PENDING` |
| `price` | Decimal (18,0)| Tổng giá trị giao dịch (Định dạng VNĐ)| Not Null |
| `area` | Float | Số liệu diện tích mặt bằng (m²) | Not Null |
| `isVip` | Boolean | Cơ chế Hiển thị Tin Tốt / Nổi Bật | Mặc định `false` |
| `ownerId` | String | Id thụ hưởng và chịu trách nhiệm bài viết| FK, Tham chiếu User(id) |

#### 3. Bảng WALLET (Ví Tiền Điện Tử Tài Khoản)
| Tên trường | Kiểu dữ liệu | Mô tả | Điều kiện |
| :--- | :--- | :--- | :--- |
| `id` | String | Mã số ví nội bộ chuyên biệt | Khóa chính, Mặc định `cuid()` |
| `userId` | String | Ví này trực thuộc người dùng nào | Unique, FK Tham chiếu User(id)|
| `balance` | Decimal (14,0)| Số dư hiện tại đo bằng điểm nội bộ | Mặc định 0 |
| `currency` | String | Đơn vị tiền tệ (Mặc định VNĐ) | Mặc định "VND" |
| `updatedAt` | DateTime | Thời điểm biến động số dư gần nhất | Tự động cập nhật |

#### 4. Bảng TRANSACTION (Lưu vết Giao dịch Tài chính)
| Tên trường | Kiểu dữ liệu | Mô tả | Điều kiện |
| :--- | :--- | :--- | :--- |
| `id` | String | Khóa định danh mã giao dịch | Khóa chính, Mặc định `cuid()` |
| `walletId` | String | Mã ví thụ hưởng dòng tiền | FK, Tham chiếu Wallet(id) |
| `type` | Enum | Phân loại (`DEPOSIT`, `VIP_PACKAGE`...) | Not Null |
| `amount` | Decimal (14,0)| Đơn vị tiền tệ thay đổi (+/-) | Not Null |
| `balanceAfter`| Decimal (14,0)| Đối chiếu số dư lũy kế lưu vết | Có thể rỗng (Nullable) |
| `status` | Enum | Tình trạng (`PENDING`, `COMPLETED`)| Mặc định `PENDING` |
| `createdAt` | DateTime | Thời gian ghi nhận biên lai hệ thống | Mặc định bằng Now() |

#### 5. Bảng LEAD (Bóng khách hàng tiềm năng CRM)
| Tên trường | Kiểu dữ liệu | Mô tả | Điều kiện |
| :--- | :--- | :--- | :--- |
| `id` | String | Mã quản lý lượt tiếp cận | Khóa chính, Mặc định `cuid()` |
| `listingId` | String | Mã bài đăng mà khách hàng chú ý | FK, Tham chiếu Listing(id) |
| `agentId` | String | Id môi giới nắm quyền săn phễu khách | FK, Tham chiếu User(id) |
| `name` | String | Họ tên khách hàng gửi về qua Form | Not Null |
| `phone` | String | Điện thoại trích đoạn từ Landing Page | Not Null |
| `isRead` | Boolean | Trạng thái Môi giới đã mở form ra gọi | Mặc định `false` |
| `createdAt` | DateTime | Giây phút Landing Page Submit | Mặc định bằng Now() |

#### 6. Bảng VIEWING_APPOINTMENT (Lịch Hẹn Xem Bất Động Sản)
| Tên trường | Kiểu dữ liệu | Mô tả | Điều kiện |
| :--- | :--- | :--- | :--- |
| `id` | String | Book Reference ID (Mã lịch hẹn) | Khóa chính, Mặc định `cuid()` |
| `listingId` | String | Hẹn đi coi căn hộ / đất nào | FK Tham chiếu Listing(id) |
| `userId` | String | Nguồn tài khoản chốt gửi thông tin | FK Tham chiếu User(id) |
| `schedule` | DateTime | Khung giờ thời gian rảnh báo trước | Not Null |
| `status` | Enum | Tình trạng (`CONFIRMED`, `CANCELLED`) | Mặc định `PENDING` |
| `createdAt` | DateTime | Dấu vết log Booking thời gian hệ thống | Mặc định bằng Now() |

#### 7. Bảng CHATBOT_CONVERSATION (Phiên Dữ Liệu AI RAG Master)
| Tên trường | Kiểu dữ liệu | Mô tả | Điều kiện |
| :--- | :--- | :--- | :--- |
| `id` | String | Định danh Khung trò chuyện độc lập | Khóa chính, Mặc định `cuid()` |
| `sessionId` | String | Dùng Hash Token gán cho khách Anonymous | Not Null |
| `userId` | String | Có thể Null nếu không chịu đăng nhập | Có thể rỗng (Nullable) |
| `context` | Json | Cấu trúc Object BĐS Context (RAG Filter) | Có thể rỗng (Nullable) |
| `updatedAt` | DateTime | Cập nhật thời điểm chat dòng cuối cùng | Tự động cập nhật |

#### 8. Bảng CHATBOT_MESSAGE (Lưu Trữ Log Đào Tạo Token AI)
| Tên trường | Kiểu dữ liệu | Mô tả | Điều kiện |
| :--- | :--- | :--- | :--- |
| `id` | String | ID đơn dòng text stream trả về | Khóa chính, Mặc định `cuid()` |
| `conversationId`| String | Trỏ đến hội thoại đang hoạt động | FK Tham chiếu ChatbotCon(id)|
| `role` | String | Nguồn bắn luồng text (`system`, `user`..)| Not Null |
| `content` | String | Cục String Data thô (Text hoặc MarkDown)| Not Null |
| `createdAt` | DateTime | Chặn Timeline Log Text Streaming AI | Mặc định bằng Now() |
