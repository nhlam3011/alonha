import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Lấy danh sách tin nhắn trong một cuộc hội thoại giữa hai người dùng
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const otherUserId = searchParams.get("userId")?.trim() || null;
  const conversationId = searchParams.get("conversationId")?.trim() || null;

  if (!otherUserId && !conversationId) {
    return NextResponse.json(
      { error: "Thiếu userId hoặc conversationId." },
      { status: 400 },
    );
  }

  const currentUserId = session.user.id;

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
      createdAt: true,
    },
  });

  const data = messages.map((m) => ({
    id: m.id,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    isMe: m.senderId === currentUserId,
  }));

  return NextResponse.json({
    data,
    conversationId: conversation.id,
  });
}

// Gửi một tin nhắn giữa hai người dùng
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    userId?: string;
    conversationId?: string;
    content?: string;
  };

  const currentUserId = session.user.id;
  const otherUserId = body.userId?.trim() || null;
  const conversationId = body.conversationId?.trim() || null;
  const content = (body.content ?? "").toString().trim();

  if (!content) {
    return NextResponse.json(
      { error: "Nội dung tin nhắn không được để trống." },
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
    // Không cho phép tự nhắn cho chính mình
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
      content: content.slice(0, 2000),
    },
    select: {
      id: true,
      senderId: true,
      content: true,
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
      createdAt: message.createdAt.toISOString(),
      isMe: true,
    },
    conversationId: conversation.id,
  });
}

