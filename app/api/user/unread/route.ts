import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ notifications: 0, messages: 0 });
  }

  const userId = session.user.id;

  try {
    const [unreadNotifications, unreadMessages] = await Promise.all([
      prisma.notification.count({
        where: { userId, isRead: false }
      }),
      prisma.chatMessage.count({
        where: {
          conversation: {
            OR: [{ user1Id: userId }, { user2Id: userId }]
          },
          senderId: { not: userId },
          readAt: null
        }
      })
    ]);

    return NextResponse.json({
      notifications: unreadNotifications,
      messages: unreadMessages
    });
  } catch (error) {
    console.error("Error fetching unread counts:", error);
    return NextResponse.json({ notifications: 0, messages: 0 });
  }
}
