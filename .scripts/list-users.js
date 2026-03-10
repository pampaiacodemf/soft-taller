const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: { email: true, role: true, name: true },
        take: 10
    });
    console.log("Current Users in DB:");
    users.forEach(u => console.log(`- [${u.role}] ${u.name} (${u.email})`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
