import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNotification, getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, getUserNotificationSettings, updateUserNotificationSettings } from '@/lib/notifications';

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');
        const unreadOnly = searchParams.get('unreadOnly') === 'true';

        const result = await getUserNotifications(session.user.id, {
            limit,
            offset,
            unreadOnly,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/notifications - Create a notification (for testing or admin)
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { type, title, content, link, sendEmail, metadata } = body;

        if (!type || !title || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await createNotification({
            userId: session.user.id,
            type,
            title,
            content,
            link,
            sendEmail,
            metadata,
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/notifications - Mark notifications as read
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { notificationId, markAll } = body;

        if (markAll) {
            const result = await markAllNotificationsAsRead(session.user.id);
            return NextResponse.json(result);
        }

        if (notificationId) {
            const result = await markNotificationAsRead(notificationId, session.user.id);
            return NextResponse.json(result);
        }

        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    } catch (error) {
        console.error('Error updating notifications:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/notifications - Delete a notification
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const notificationId = searchParams.get('id');

        if (!notificationId) {
            return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
        }

        const result = await deleteNotification(notificationId, session.user.id);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error deleting notification:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
