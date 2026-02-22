import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
    datasources: {
        db: { url: "postgresql://neondb_owner:npg_v82NJhIezyYZ@ep-divine-darkness-acaj5nwm-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true" },
    },
});

async function main() {
    const users = await prisma.user.findMany({
        select: { email: true, name: true, role: true }
    });
    console.log("Users in DB:");
    console.log(users);
}

main().finally(() => prisma.$disconnect());
