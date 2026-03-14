import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Lấy danh sách cuộc hội thoại giữa admin và các agent
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = String(session.user.role || "");
    if (role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminId = session.user.id;

    // Lấy tất cả các cuộc hội thoại có sự tham gia của admin
    const conversations = await prisma.conversation.findMany({
        where: {
            OR: [{ user1Id: adminId }, { user2Id: adminId }],
        },
        orderBy: { updatedAt: "desc" },
        include: {
            user1: {
                select: { id: true, name: true, email: true, avatar: true, role: true },
            },
            user2: {
                select: { id: true, name: true, email: true, avatar: true, role: true },
            },
            messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
            },
        },
    });

    // Lọc chỉ lấy các cuộc hội thoại với AGENT
    const agentConversations = conversations
        .filter((conv) => {
            const otherUser = conv.user1Id === adminId ? conv.user2 : conv.user1;
            return otherUser?.role === "AGENT";
        })
        .map((conv) => {
            const agent = conv.user1Id === adminId ? conv.user2 : conv.user1;
            const lastMessage = conv.messages[0];

            return {
                id: conv.id,
                agentId: agent?.id || "",
                agentName: agent?.name || "Unknown",
                agentEmail: agent?.email || "",
                agentAvatar: agent?.avatar,
                lastMessage: lastMessage?.content || "",
                lastMessageAt: conv.updatedAt.toISOString(),
                unreadCount: 0,
            };
        });

    return NextResponse.json({ data: agentConversations });
}
