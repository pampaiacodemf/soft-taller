import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // 1. Create Tenant
    const tenant = await prisma.tenant.create({
        data: {
            name: "Taller Demo",
            slug: "taller-demo",
            subscription: {
                create: {
                    daysRemaining: 30,
                    plan: "ENTERPRISE",
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
            },
        },
    });

    // 2. Create Admin User
    await prisma.user.create({
        data: {
            name: "Admin Demo",
            email: "admin@taller.com",
            password: hashedPassword,
            role: "ADMIN",
            tenantId: tenant.id,
        },
    });

    console.log("Seed finished:");
    console.log("Email: admin@demo.com");
    console.log("Password: admin123");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
