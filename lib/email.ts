import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendOtpEmail(email: string, code: string) {
  if (!resend) {
    console.log('[DEV] OTP Email:', { email, code });
    return { success: true };
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@alonha.vn',
      to: email,
      subject: 'Mã OTP đặt lại mật khẩu - Alonha',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Mã OTP đặt lại mật khẩu</h2>
          <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản <strong>${email}</strong>.</p>
          <p>Mã OTP của bạn là:</p>
          <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
            ${code}
          </div>
          <p>Mã này sẽ hết hạn sau 10 phút.</p>
          <p style="color: #64748b; font-size: 14px;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(email: string, name?: string) {
  if (!resend) {
    console.log('[DEV] Welcome Email:', { email, name });
    return { success: true };
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@alonha.vn',
      to: email,
      subject: 'Chào mừng đến với Alonha!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Chào mừng đến với Alonha!</h2>
          <p>Chào ${name || email},</p>
          <p>Cảm ơn bạn đã đăng ký tài khoản tại Alonha - Nền tảng bất động sản AI.</p>
          <p>Những tính năng đang chờ bạn:</p>
          <ul>
            <li>🔍 Tìm kiếm bất động sản với AI</li>
            <li>💬 Chatbot hỗ trợ 24/7</li>
            <li>🏠 Đăng tin và quản lý bất động sản</li>
            <li>🧮 Công cụ tính vay và phong thủy</li>
          </ul>
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Bắt đầu khám phá</a>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}