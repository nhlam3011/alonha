import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserNotificationSettings, updateUserNotificationSettings } from '@/lib/notifications';

// GET /api/notifications/settings - Get user's notification settings
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settings = await getUserNotificationSettings(session.user.id);
        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching notification settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/notifications/settings - Update user's notification settings
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { emailEnabled, listingApproved, listingRejected, listingNew, listingExpiring, appointmentNew, leadNew, payment, savedSearch } = body;

        const result = await updateUserNotificationSettings(session.user.id, {
            emailEnabled,
            listingApproved,
            listingRejected,
            listingNew,
            listingExpiring,
            appointmentNew,
            leadNew,
            payment,
            savedSearch,
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error updating notification settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
