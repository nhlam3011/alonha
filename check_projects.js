const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();
    try {
        const projects = await prisma.project.findMany({
            include: { listings: true }
        });
        console.log(JSON.stringify(projects, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
