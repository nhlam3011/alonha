export default function TermsPage() {
  return (
    <div className="layout-container page-section">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Điều khoản sử dụng</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            Khi sử dụng AloNha, bạn đồng ý tuân thủ các nguyên tắc dưới đây
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">1. Tài khoản người dùng</h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
                Người dùng chịu trách nhiệm về thông tin tài khoản, bảo mật mật khẩu và mọi hoạt động
                phát sinh trên tài khoản của mình.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">2. Nội dung tin đăng</h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
                Nội dung đăng tải cần trung thực, rõ ràng, không vi phạm pháp luật, không chứa thông
                tin giả mạo hoặc gây hiểu nhầm.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">3. Quyền hạn nền tảng</h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
                AloNha có quyền từ chối hoặc gỡ bỏ nội dung vi phạm tiêu chuẩn cộng đồng và điều khoản
                sử dụng nhằm đảm bảo chất lượng hệ sinh thái.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">4. Bảo mật thông tin</h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
                Chúng tôi cam kết bảo vệ thông tin cá nhân của người dùng theo chính sách bảo mật và
                quy định pháp luật hiện hành.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
