/**
 * Run this script ONCE to create the SUPER_ADMIN user in the database.
 * Usage: npx ts-node -e "require('./.scripts/create-superadmin')"
 * Or simply run: node -r ts-node/register .scripts/create-superadmin.ts
 * 
 * The SuperAdmin user is linked to the FIRST tenant found (or you can hardcode the tenantId).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const SUPERADMIN_EMAIL    = "superadmin@softtaller.com";
    const SUPERADMIN_PASSWORD = "SuperAdmin2026!";
    const SUPERADMIN_NAME     = "SúperAdmin";

    // Get first tenant to attach the superadmin user (required by DB schema)
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        console.error("❌ No tenant found. Create a tenant first.");
        process.exit(1);
    }

    const existing = await prisma.user.findFirst({ where: { email: SUPERADMIN_EMAIL } });
    if (existing) {
        console.log("⚠️  SuperAdmin already exists:", existing.email);
        return;
    }

    const hashed = await bcrypt.hash(SUPERADMIN_PASSWORD, 12);
    const user = await prisma.user.create({
        data: {
            tenantId: tenant.id,
            name:     SUPERADMIN_NAME,
            email:    SUPERADMIN_EMAIL,
            password: hashed,
            role:     "SUPER_ADMIN",
        },
    });

    console.log("✅ SuperAdmin created:", user.email);
    console.log("   Password:", SUPERADMIN_PASSWORD);
    console.log("   Role:    ", user.role);
    console.log("\n⚠️  IMPORTANT: Change the password after first login!");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
