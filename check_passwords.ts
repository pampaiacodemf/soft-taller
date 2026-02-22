import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
    datasources: {
        db: { url: "postgresql://neondb_owner:npg_v82NJhIezyYZ@ep-divine-darkness-acaj5nwm-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true" },
    },
});

async function main() {
    console.log("Resetting passwords for all users to: 123456");
    const newHash = await bcrypt.hash("123456", 10);

    const updateResult = await prisma.user.updateMany({
        where: {},
        data: {
            password: newHash,
            isActive: true,
        }
    });

    console.log(`Successfully reset ${updateResult.count} users.`);
}

main().finally(() => prisma.$disconnect());
