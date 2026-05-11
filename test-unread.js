const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.chatMessage.count({ where: { readAt: null } });
  console.log('Unread total:', count);
  const unread = await prisma.chatMessage.findMany({ 
    where: { readAt: null }, 
    select: { id: true, senderId: true, conversationId: true } 
  });
  console.log(unread);
}

main().finally(() => prisma.$disconnect());
