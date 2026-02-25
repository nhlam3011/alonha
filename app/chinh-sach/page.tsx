export default function PrivacyPolicyPage() {
  return (
    <div className="layout-container page-section">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Chính sách bảo mật</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            AloNha cam kết tôn trọng quyền riêng tư và bảo vệ dữ liệu cá nhân
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">1. Dữ liệu thu thập</h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
                Chúng tôi thu thập các thông tin cần thiết như họ tên, email, số điện thoại, lịch sử
                tìm kiếm và tương tác để cung cấp dịch vụ tốt hơn.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">2. Mục đích sử dụng</h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
                Dữ liệu được dùng để xác thực tài khoản, tối ưu đề xuất tin đăng, hỗ trợ giao dịch và
                cải thiện chất lượng nền tảng.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">3. Bảo mật thông tin</h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
                Chúng tôi áp dụng các biện pháp kỹ thuật phù hợp để bảo vệ dữ liệu khỏi truy cập trái
                phép, thay đổi hoặc lộ lọt ngoài ý muốn.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">4. Quyền của người dùng</h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
                Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xóa dữ liệu cá nhân của mình bất cứ lúc nào
                thông qua cài đặt tài khoản hoặc liên hệ hỗ trợ.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
