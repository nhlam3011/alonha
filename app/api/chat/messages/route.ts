import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const otherUserId = searchParams.get("userId")?.trim() || null;
  const conversationId = searchParams.get("conversationId")?.trim() || null;
  const isList = searchParams.get("list") === "true";

  const currentUserId = session.user.id;

  if (isList) {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        user1: { select: { id: true, name: true, avatar: true, role: true } },
        user2: { select: { id: true, name: true, avatar: true, role: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, createdAt: true },
        },
      },
    });

    const data = conversations.map((conv) => {
      const otherUser = conv.user1Id === currentUserId ? conv.user2 : conv.user1;
      const lastMsg = conv.messages[0];
      return {
        id: otherUser.id,
        name: otherUser.name || "Người dùng",
        avatar: otherUser.avatar,
        role: otherUser.role,
        lastMessage: lastMsg?.content || null,
        lastMessageAt: lastMsg?.createdAt.toISOString() || conv.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({ data });
  }

  if (!otherUserId && !conversationId) {
    return NextResponse.json(
      { error: "Thiếu userId hoặc conversationId." },
      { status: 400 },
    );
  }

  let conversation = null as
    | {
      id: string;
      user1Id: string;
      user2Id: string;
    }
    | null;

  if (conversationId) {
    conversation = await prisma.conversation
      .findFirst({
        where: {
          id: conversationId,
          OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
        },
        select: { id: true, user1Id: true, user2Id: true },
      })
      .catch(() => null);
  } else if (otherUserId) {
    const pair = [currentUserId, otherUserId].sort();
    conversation = await prisma.conversation
      .findFirst({
        where: { user1Id: pair[0], user2Id: pair[1] },
        select: { id: true, user1Id: true, user2Id: true },
      })
      .catch(() => null);
  }

  if (!conversation) {
    return NextResponse.json({ data: [], conversationId: null });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      senderId: true,
      content: true,
      imageUrl: true,
      createdAt: true,
    },
  });

  const data = messages.map((m) => ({
    id: m.id,
    content: m.content,
    imageUrl: m.imageUrl,
    createdAt: m.createdAt.toISOString(),
    isMe: m.senderId === currentUserId,
  }));

  return NextResponse.json({
    data,
    conversationId: conversation.id,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    userId?: string;
    conversationId?: string;
    content?: string;
    imageUrl?: string;
  };

  const currentUserId = session.user.id;
  const otherUserId = body.userId?.trim() || null;
  const conversationId = body.conversationId?.trim() || null;
  const content = (body.content ?? "").toString().trim();
  const imageUrl = body.imageUrl?.trim() || null;

  if (!content && !imageUrl) {
    return NextResponse.json(
      { error: "Nội dung tin nhắn hoặc hình ảnh không được để trống." },
      { status: 400 },
    );
  }

  if (!otherUserId && !conversationId) {
    return NextResponse.json(
      { error: "Thiếu userId hoặc conversationId." },
      { status: 400 },
    );
  }

  let conversation = null as
    | {
      id: string;
      user1Id: string;
      user2Id: string;
    }
    | null;

  if (conversationId) {
    conversation = await prisma.conversation
      .findFirst({
        where: {
          id: conversationId,
          OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
        },
        select: { id: true, user1Id: true, user2Id: true },
      })
      .catch(() => null);
  } else if (otherUserId) {
    if (otherUserId === currentUserId) {
      return NextResponse.json(
        { error: "Không thể nhắn tin cho chính mình." },
        { status: 400 },
      );
    }

    const pair = [currentUserId, otherUserId].sort();
    conversation = await prisma.conversation
      .findFirst({
        where: { user1Id: pair[0], user2Id: pair[1] },
        select: { id: true, user1Id: true, user2Id: true },
      })
      .catch(() => null);

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id: pair[0],
          user2Id: pair[1],
        },
        select: { id: true, user1Id: true, user2Id: true },
      });
    }
  }

  if (!conversation) {
    return NextResponse.json(
      { error: "Không tìm thấy hội thoại phù hợp." },
      { status: 404 },
    );
  }

  const message = await prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      senderId: currentUserId,
      content: content ? content.slice(0, 2000) : "",
      imageUrl: imageUrl,
    },
    select: {
      id: true,
      senderId: true,
      content: true,
      imageUrl: true,
      createdAt: true,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({
    data: {
      id: message.id,
      content: message.content,
      imageUrl: message.imageUrl,
      createdAt: message.createdAt.toISOString(),
      isMe: true,
    },
    conversationId: conversation.id,
  });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get("messageId")?.trim() || null;
  const conversationId = searchParams.get("conversationId")?.trim() || null;
  const clearAll = searchParams.get("clearAll") === "true";

  const currentUserId = session.user.id;

  if (messageId) {
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json({ error: "Không tìm thấy tin nhắn." }, { status: 404 });
    }

    if (message.senderId !== currentUserId) {
      return NextResponse.json({ error: "Bạn không thể xóa tin nhắn này." }, { status: 403 });
    }

    await prisma.chatMessage.delete({
      where: { id: messageId },
    });

    return NextResponse.json({ message: "Đã xóa tin nhắn." });
  }

  if (clearAll && conversationId) {
    const userRole = String((session.user as any).role || "USER");
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Không tìm thấy hội thoại." }, { status: 404 });
    }

    const isParticipant = conversation.user1Id === currentUserId || conversation.user2Id === currentUserId;

    if (userRole !== "ADMIN" && !isParticipant) {
      return NextResponse.json({ error: "Bạn không có quyền xóa cuộc trò chuyện này." }, { status: 403 });
    }

    await prisma.chatMessage.deleteMany({
      where: { conversationId },
    });

    return NextResponse.json({ message: "Đã xóa toàn bộ lịch sử trò chuyện." });
  }

  return NextResponse.json(
    { error: "Thiếu thông số hợp lệ." },
    { status: 400 },
  );
}

