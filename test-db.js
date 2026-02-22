const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing connection to Neon...');
        await prisma.$connect();
        console.log('Connected!');

        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Check if tenant exists
        let tenant = await prisma.tenant.findFirst({ where: { slug: 'taller-demo' } });
        if (!tenant) {
            console.log('Creating demo tenant...');
            tenant = await prisma.tenant.create({
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
        }

        // Upsert user using compound unique index
        console.log('Creating demo user...');
        await prisma.user.upsert({
            where: {
                tenantId_email: {
                    tenantId: tenant.id,
                    email: 'admin@taller.com'
                }
            },
            update: { password: hashedPassword },
            create: {
                name: "Admin Demo",
                email: "admin@taller.com",
                password: hashedPassword,
                role: "ADMIN",
                tenantId: tenant.id,
            },
        });

        console.log('Demo user created: admin@taller.com / admin123');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
