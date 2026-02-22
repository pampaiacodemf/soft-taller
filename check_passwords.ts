import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
    datasources: {
        db: { url: "postgresql://neondb_owner:npg_v82NJhIezyYZ@ep-divine-darkness-acaj5nwm-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true" },
    },
});

async function main() {
    console.log("Checking passwords for all users...");
    const users = await prisma.user.findMany({
        select: { email: true, name: true, role: true, password: true }
    });

    for (const user of users) {
        console.log(`\nEmail: ${user.email}, Name: ${user.name}`);
        console.log(`Hash: ${user.password.substring(0, 20)}...`);
        // Test common passwords
        const pass1Match = await bcrypt.compare("123456", user.password);
        const pass2Match = await bcrypt.compare("admin123", user.password);
        if (pass1Match) console.log("=> Password is: 123456");
        if (pass2Match) console.log("=> Password is: admin123");
    }
}

main().finally(() => prisma.$disconnect());
