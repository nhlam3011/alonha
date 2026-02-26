import { prisma } from '@/lib/prisma';
import { sendNotificationEmail } from '@/lib/email';
import { NotificationType } from '@/lib/email';

interface CreateNotificationParams {
    userId: string;
    type: NotificationType;
    title: string;
    content: string;
    link?: string;
    sendEmail?: boolean;
    metadata?: Record<string, any>;
}

interface NotificationResult {
    success: boolean;
    notification?: any;
    emailSent?: boolean;
    error?: any;
}

/**
 * Create a notification and optionally send an email
 */
export async function createNotification({
    userId,
    type,
    title,
    content,
    link,
    sendEmail = true,
    metadata,
}: CreateNotificationParams): Promise<NotificationResult> {
    try {
        // Get user information for email
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true },
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        // Create notification in database
        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                content,
                link,
                metadata,
            },
        });

        let emailSent = false;

        // Send email if enabled and user has email
        if (sendEmail && user.email) {
            const emailResult = await sendNotificationEmail({
                email: user.email,
                name: user.name || undefined,
                type,
                title,
                content,
                link,
            });

            emailSent = emailResult.success;

            // Update notification to mark email as sent
            if (emailSent) {
                await prisma.notification.update({
                    where: { id: notification.id },
                    data: { emailSent: true },
                });
            }
        }

        return {
            success: true,
            notification,
            emailSent,
        };
    } catch (error) {
        console.error('Error creating notification:', error);
        return { success: false, error };
    }
}

/**
 * Create multiple notifications and send emails
 */
export async function createBatchNotifications(
    notifications: Array<{
        userId: string;
        type: NotificationType;
        title: string;
        content: string;
        link?: string;
        sendEmail?: boolean;
        metadata?: Record<string, any>;
    }>
): Promise<{ success: boolean; results: NotificationResult[] }> {
    const results = await Promise.all(
        notifications.map((notif) =>
            createNotification({
                userId: notif.userId,
                type: notif.type,
                title: notif.title,
                content: notif.content,
                link: notif.link,
                sendEmail: notif.sendEmail,
                metadata: notif.metadata,
            })
        )
    );

    return {
        success: results.every((r) => r.success),
        results,
    };
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
    userId: string,
    options?: {
        limit?: number;
        offset?: number;
        unreadOnly?: boolean;
    }
) {
    const { limit = 20, offset = 0, unreadOnly = false } = options || {};

    const where = {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
        notifications,
        total,
        unreadCount,
        hasMore: offset + notifications.length < total,
    };
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
    try {
        const notification = await prisma.notification.update({
            where: { id: notificationId, userId },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
        return { success: true, notification };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
    try {
        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string, userId: string) {
    try {
        await prisma.notification.delete({
            where: { id: notificationId, userId },
        });
        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Get or create user notification settings
 */
export async function getUserNotificationSettings(userId: string) {
    let settings = await prisma.userNotificationSettings.findUnique({
        where: { userId },
    });

    if (!settings) {
        settings = await prisma.userNotificationSettings.create({
            data: {
                userId,
                emailEnabled: true,
                listingApproved: true,
                listingRejected: true,
                listingNew: true,
                listingExpiring: true,
                appointmentNew: true,
                leadNew: true,
                payment: true,
                savedSearch: true,
            },
        });
    }

    return settings;
}

/**
 * Update user notification settings
 */
export async function updateUserNotificationSettings(
    userId: string,
    data: {
        emailEnabled?: boolean;
        listingApproved?: boolean;
        listingRejected?: boolean;
        listingNew?: boolean;
        listingExpiring?: boolean;
        appointmentNew?: boolean;
        leadNew?: boolean;
        payment?: boolean;
        savedSearch?: boolean;
    }
) {
    try {
        const settings = await prisma.userNotificationSettings.upsert({
            where: { userId },
            update: data,
            create: { userId, ...data },
        });
        return { success: true, settings };
    } catch (error) {
        return { success: false, error };
    }
}

// ============ HELPER FUNCTIONS FOR SPECIFIC NOTIFICATION TYPES ============

/**
 * Send notification when a listing is approved
 */
export async function notifyListingApproved(listingId: string, listingTitle: string) {
    const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { ownerId: true },
    });

    if (!listing) return { success: false, error: 'Listing not found' };

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    return createNotification({
        userId: listing.ownerId,
        type: NotificationType.LISTING_APPROVED,
        title: 'Tin đăng của bạn đã được duyệt!',
        content: `Tin đăng "${listingTitle}" đã được duyệt và hiển thị công khai trên website.`,
        link: `${appUrl}/bat-dong-san/${listingId}`,
    });
}

/**
 * Send notification when a listing is rejected
 */
export async function notifyListingRejected(
    listingId: string,
    listingTitle: string,
    reason?: string
) {
    const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { ownerId: true },
    });

    if (!listing) return { success: false, error: 'Listing not found' };

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    return createNotification({
        userId: listing.ownerId,
        type: NotificationType.LISTING_REJECTED,
        title: 'Tin đăng của bạn bị từ chối',
        content: reason
            ? `Tin đăng "${listingTitle}" đã bị từ chối. Lý do: ${reason}`
            : `Tin đăng "${listingTitle}" đã bị từ chối. Vui lòng liên hệ admin để biết thêm chi tiết.`,
        link: `${appUrl}/bat-dong-san/${listingId}`,
    });
}

/**
 * Send notification when there's a new lead
 */
export async function notifyNewLead(
    leadId: string,
    leadName: string,
    listingId: string,
    agentId: string
) {
    const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { title: true },
    });

    if (!listing) return { success: false, error: 'Listing not found' };

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    return createNotification({
        userId: agentId,
        type: NotificationType.LEAD_NEW,
        title: 'Bạn có khách hàng tiềm năng mới!',
        content: `${leadName} quan tâm đến tin đăng "${listing.title}". Hãy liên hệ ngay!`,
        link: `${appUrl}/moi-gioi/leads/${leadId}`,
    });
}

/**
 * Send notification when there's a new appointment
 */
export async function notifyNewAppointment(appointmentId: string) {
    const appointment = await prisma.viewingAppointment.findUnique({
        where: { id: appointmentId },
        include: {
            listing: { select: { title: true } },
        },
    });

    if (!appointment || !appointment.agentId) return { success: false, error: 'Appointment not found' };

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const scheduleDate = new Date(appointment.schedule).toLocaleDateString('vi-VN');
    const scheduleTime = new Date(appointment.schedule).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return createNotification({
        userId: appointment.agentId,
        type: NotificationType.APPOINTMENT_NEW,
        title: 'Bạn có lịch xem nhà mới!',
        content: `${appointment.fullName} muốn xem ${appointment.listing.title} vào ngày ${scheduleDate} lúc ${scheduleTime}.`,
        link: `${appUrl}/moi-gioi/appointments/${appointmentId}`,
    });
}

/**
 * Send notification when a listing is about to expire
 */
export async function notifyListingExpiring(listingId: string, daysLeft: number) {
    const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { ownerId: true, title: true },
    });

    if (!listing) return { success: false, error: 'Listing not found' };

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    return createNotification({
        userId: listing.ownerId,
        type: NotificationType.LISTING_EXPIRING,
        title: 'Tin đăng sắp hết hạn',
        content: `Tin đăng "${listing.title}" sẽ hết hạn trong ${daysLeft} ngày. Hãy gia hạn để tiếp tục hiển thị!`,
        link: `${appUrl}/bat-dong-san/${listingId}`,
    });
}
