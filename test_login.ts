import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
    datasources: {
        db: { url: "postgresql://neondb_owner:npg_v82NJhIezyYZ@ep-divine-darkness-acaj5nwm-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true" },
    },
});

async function simulateLogin(email: string, pass: string) {
    console.log(`\n--- Simulating login for ${email} ---`);
    const user = await prisma.user.findFirst({
        where: { email, isActive: true },
        include: { tenant: { include: { subscription: true } } },
    });

    if (!user) {
        console.log("User not found!");
        return;
    }

    const passwordMatch = await bcrypt.compare(pass, user.password);
    if (!passwordMatch) {
        console.log("Password does NOT match!");
        return;
    }

    console.log("Login SUCCESS! Returned User object would be:");
    console.log({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
    });
}

async function main() {
    await simulateLogin("admin@taller.com", "admin123");
    await simulateLogin("fpaoli89@gmail.com", "123456"); // Try common passwords or just check if it finds the user
    await simulateLogin("lasol@gmail.com", "123456");
}

main().finally(() => prisma.$disconnect());
