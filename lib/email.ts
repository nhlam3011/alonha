import { Resend } from 'resend';

// Define NotificationType locally (will be imported from @prisma/client after regeneration)
export enum NotificationType {
  LISTING_APPROVED = 'LISTING_APPROVED',
  LISTING_REJECTED = 'LISTING_REJECTED',
  LISTING_NEW = 'LISTING_NEW',
  LISTING_EXPIRING = 'LISTING_EXPIRING',
  APPOINTMENT_NEW = 'APPOINTMENT_NEW',
  APPOINTMENT_CONFIRMED = 'APPOINTMENT_CONFIRMED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  LEAD_NEW = 'LEAD_NEW',
  LEAD_REPLY = 'LEAD_REPLY',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SYSTEM = 'SYSTEM',
  SAVED_SEARCH_MATCH = 'SAVED_SEARCH_MATCH',
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Get app URL for links
const getAppUrl = () => process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Check if we're in test mode (no domain configured)
const isTestMode = !process.env.RESEND_FROM_EMAIL?.includes('@') ||
  process.env.RESEND_FROM_EMAIL?.endsWith('@resend.dev') ||
  process.env.NODE_ENV === 'development';

// Get sender email - use resend.dev in test mode
const getSenderEmail = () => {
  if (!process.env.RESEND_FROM_EMAIL) {
    return 'onboarding@resend.dev'; // Resend test mode email
  }
  return process.env.RESEND_FROM_EMAIL;
};

// Format notification type to Vietnamese
const formatNotificationType = (type: NotificationType): string => {
  const typeMap: Record<NotificationType, string> = {
    LISTING_APPROVED: 'Tin đăng được duyệt',
    LISTING_REJECTED: 'Tin đăng bị từ chối',
    LISTING_NEW: 'Tin đăng mới',
    LISTING_EXPIRING: 'Tin đăng sắp hết hạn',
    APPOINTMENT_NEW: 'Lịch xem mới',
    APPOINTMENT_CONFIRMED: 'Lịch xem được xác nhận',
    APPOINTMENT_CANCELLED: 'Lịch xem bị hủy',
    LEAD_NEW: 'Khách hàng tiềm năng mới',
    LEAD_REPLY: 'Phản hồi khách hàng',
    PAYMENT_SUCCESS: 'Thanh toán thành công',
    PAYMENT_FAILED: 'Thanh toán thất bại',
    SYSTEM: 'Thông báo hệ thống',
    SAVED_SEARCH_MATCH: 'Tin phù hợp với tìm kiếm',
  };
  return typeMap[type] || 'Thông báo';
};

export async function sendOtpEmail(email: string, code: string) {
  if (!resend) {
    console.log('[DEV] OTP Email:', { email, code });
    return { success: true };
  }

  try {
    await resend.emails.send({
      from: getSenderEmail(),
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
      from: getSenderEmail(),
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

// ============ NOTIFICATION EMAIL FUNCTIONS ============

interface SendNotificationEmailParams {
  email: string;
  name?: string;
  type: NotificationType;
  title: string;
  content: string;
  link?: string;
}

const formatNotificationTypeTitle = (type: NotificationType): string => {
  const typeMap: Record<NotificationType, string> = {
    LISTING_APPROVED: 'Tin đăng được duyệt',
    LISTING_REJECTED: 'Tin đăng bị từ chối',
    LISTING_NEW: 'Tin đăng mới',
    LISTING_EXPIRING: 'Tin đăng sắp hết hạn',
    APPOINTMENT_NEW: 'Lịch xem mới',
    APPOINTMENT_CONFIRMED: 'Lịch xem được xác nhận',
    APPOINTMENT_CANCELLED: 'Lịch xem bị hủy',
    LEAD_NEW: 'Khách hàng tiềm năng mới',
    LEAD_REPLY: 'Phản hồi khách hàng',
    PAYMENT_SUCCESS: 'Thanh toán thành công',
    PAYMENT_FAILED: 'Thanh toán thất bại',
    SYSTEM: 'Thông báo hệ thống',
    SAVED_SEARCH_MATCH: 'Tin phù hợp với tìm kiếm',
  };
  return typeMap[type] || 'Thông báo';
};

const getNotificationIcon = (type: NotificationType): string => {
  const iconMap: Record<NotificationType, string> = {
    LISTING_APPROVED: '✅',
    LISTING_REJECTED: '❌',
    LISTING_NEW: '🏠',
    LISTING_EXPIRING: '⏰',
    APPOINTMENT_NEW: '📅',
    APPOINTMENT_CONFIRMED: '✅',
    APPOINTMENT_CANCELLED: '❌',
    LEAD_NEW: '👤',
    LEAD_REPLY: '💬',
    PAYMENT_SUCCESS: '💰',
    PAYMENT_FAILED: '⚠️',
    SYSTEM: '📢',
    SAVED_SEARCH_MATCH: '🔍',
  };
  return iconMap[type] || '📌';
};

export async function sendNotificationEmail({
  email,
  name,
  type,
  title,
  content,
  link,
}: SendNotificationEmailParams) {
  const appUrl = getAppUrl();
  const typeTitle = formatNotificationTypeTitle(type);
  const icon = getNotificationIcon(type);

  if (!resend) {
    console.log('[DEV] Notification Email:', { email, name, type, title, content });
    return { success: true };
  }

  try {
    await resend.emails.send({
      from: getSenderEmail(),
      to: email,
      subject: `${icon} ${typeTitle} - Alonha`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 20px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${icon} ${typeTitle}</h1>
          </div>
          
          <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #334155; font-size: 16px;">
              Xin chào <strong>${name || email}</strong>,
            </p>
            
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h3 style="color: #1e293b; margin: 0 0 8px 0; font-size: 18px;">${title}</h3>
              <p style="color: #475569; margin: 0; font-size: 14px;">${content}</p>
            </div>
            
            ${link ? `
              <a href="${link}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px; font-weight: 500;">
                Xem chi tiết
              </a>
            ` : ''}
            
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                Đây là email tự động từ <strong>Alonha</strong>. Vui lòng không trả lời email này.
              </p>
              <p style="color: #64748b; font-size: 12px; margin: 8px 0 0 0;">
                <a href="${appUrl}/tai-khoan/thong-bao" style="color: #2563eb;">Cài đặt thông báo</a> | 
                <a href="${appUrl}" style="color: #2563eb;">Truy cập website</a>
              </p>
            </div>
          </div>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Notification email send error:', error);
    return { success: false, error };
  }
}

// Batch send notification emails (for multiple notifications)
export async function sendBatchNotificationEmails(
  notifications: Array<{
    email: string;
    name?: string;
    type: NotificationType;
    title: string;
    content: string;
    link?: string;
  }>
) {
  const results = await Promise.all(
    notifications.map((notif) =>
      sendNotificationEmail({
        email: notif.email,
        name: notif.name,
        type: notif.type,
        title: notif.title,
        content: notif.content,
        link: notif.link,
      })
    )
  );

  return {
    success: results.every((r) => r.success),
    results,
  };
}