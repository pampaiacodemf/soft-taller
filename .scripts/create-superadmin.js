const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) { console.log("No tenant found"); return; }

    const hashed = await bcrypt.hash("SuperAdmin2026!", 12);

    const user = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: "superadmin@softtaller.com" } },
        update: { role: "SUPER_ADMIN", name: "SuperAdmin" },
        create: {
            tenantId: tenant.id,
            name:     "SuperAdmin",
            email:    "superadmin@softtaller.com",
            password: hashed,
            role:     "SUPER_ADMIN",
        },
    });

    console.log("✅ SuperAdmin user ready:", user.email, "| role:", user.role);
    console.log("   Login: superadmin@softtaller.com / SuperAdmin2026!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
