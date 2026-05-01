# PHÂN CHIA TASK VẼ BIỂU ĐỒ BÁO CÁO (23 SƠ ĐỒ ĐỘC LẬP - FOCUS AI)

Tiến độ các task được quy hoạch nhằm triệt tiêu sự trùng lặp và cực kỳ đề cao **Hệ thống AI (Tìm kiếm NLP/NER & Xử lý tin đăng)** theo định vị cốt lõi của Đồ án KLTN. Nhánh Giao dịch Ví điện tử (Wallet) được thu nhỏ thành một luồng giả lập phụ trợ.

- [x] **Giai đoạn 1: Sơ đồ Use Case (Nền tảng nghiệp vụ tổng quan - 6 sơ đồ)**
  - [x] 1. Use Case Tổng thể (Admin, Agent, User).
  - [x] 2. Use Case - Phân hệ Agent (Quản lý Listing, CRM).
  - [x] 3. Use Case - Phân hệ AI & Trợ lý thông minh.
  - [x] 4. Use Case - Phân hệ Khách hàng (User/Guest).
  - [x] 5. Use Case - Phân hệ Quản trị viên (Admin Portal).
  - [x] 6. Use Case - Phân hệ Giao dịch & Ví điện tử (Wallet).

- [x] **Giai đoạn 2: Phân rã cấu trúc Model (Class Diagrams - 3 sơ đồ)**
  - [x] 7. Sơ đồ Class Tổng thể.
  - [x] 8. Sơ đồ Class Phân rã: Module AI, Context LLM & Tương tác Messaging.
  - [x] 9. Sơ đồ Class Phân rã: Module BĐS, Booking CRM (Gom Wallet làm module phụ).

- [x] **Giai đoạn 3: Sơ đồ Hoạt động UX/UI (Activity - 5 sơ đồ)**
  *(Phục vụ các chức năng thiên về luồng thao tác trên Giao diện và rẽ nhánh Trạng thái)*
  - [x] 10. Activity - Đăng ký nâng hạng & Xét duyệt Môi giới (Agent Application).
  - [x] 11. Activity - Flow Upload Ảnh & Đăng tin Bất động sản AI Support (Kèm validate).
  - [x] 12. Activity - Đặt lịch hẹn xem nhà và quản lý lịch biểu khách hàng.
  - [x] 13. Activity - Luồng điều hướng và thu thập tiềm năng CRM (Leads tracker).
  - [x] 14. Activity - Workflow Tìm kiếm nhà thủ công thông qua Bản đồ và Filter cứng.

- [x] **Giai đoạn 4: Sơ đồ Tuần tự Database/API & Trí tuệ Nhân tạo (Sequence - 5 sơ đồ)**
  *(Sân khấu chính của đồ án: Phục vụ tương tác ngầm phức tạp, gọi API LLM thực thể NER)*
  - [x] 15. Sequence - Tìm kiếm AI (Mũi nhọn 1): Trích xuất NLP NER từ text sang tham số truy vấn CSDL.
  - [x] 16. Sequence - Đăng bài bóc tách AI (Mũi nhọn 2): Tự động sinh nội dung và bóc tách keyword NLP cho tin đăng BĐS.
  - [x] 17. Sequence - Giao tiếp RAG Chatbot tư vấn qua LLM Streaming.
  - [x] 18. Sequence - Xác thực bảo mật người dùng (Auth JWT/OTP).
  - [x] 19. Sequence - Xử lý giao dịch nội bộ (Luồng tài chính nạp quỹ & tự động tiêu thụ đẩy Top VIP).

- [x] **Giai đoạn 5: Sơ đồ Kiến trúc Hệ thống & AI (4 sơ đồ)**
  *(Hạ tầng tổng thể và Kiến trúc Tích hợp mảng AI mũi nhọn)*
  - [x] 20. Sơ đồ kiến trúc tổng thể hệ thống (Architecture / Component Diagram).
  - [x] 21. Sơ đồ triển khai (Deployment Diagram - Vercel, Supabase).
  - [x] 22. Kiến trúc tích hợp AI (AI System Architecture).
  - [x] 23. Sơ đồ luồng xử lý tìm kiếm AI, luồng xử lý Chatbot.

---
**💡 Gợi ý làm việc:**
Với tư cách là sinh viên bảo vệ đồ án, việc đưa Sơ đồ thứ 15, 16 và 22 lên làm Spotlight (Trọng tâm) sẽ thu hút toàn bộ câu hỏi của Hội Đồng vào kiến trúc RAG, NLP và AI Promting. Bạn đã thoát khỏi định kiến của một dự án C-R-U-D! 

Để tạo mã, chat với tôi: *"Sinh code PlantUML cho sơ đồ số 15"*
