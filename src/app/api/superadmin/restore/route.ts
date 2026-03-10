import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { data } = body;

        if (!data) {
            return NextResponse.json({ error: "Datos de restauración no encontrados en el archivo" }, { status: 400 });
        }

        // Restore using a transaction to maintain data integrity
        // Note: SQLite doesn't support full DB wipe easily via Prisma without raw SQL
        // We will perform a basic check and sequential updates/upserts for core entities
        
        await prisma.$transaction(async (tx) => {
            // Restore Tenants
            for (const tenant of data.tenants || []) {
                const { subscription, ...tenantData } = tenant;
                await tx.tenant.upsert({
                    where: { id: tenant.id },
                    update: tenantData,
                    create: tenantData,
                });
                if (subscription) {
                    await tx.subscription.upsert({
                        where: { id: subscription.id },
                        update: subscription,
                        create: subscription,
                    });
                }
            }

            // Restore Users
            for (const user of data.users || []) {
                await tx.user.upsert({
                    where: { id: user.id },
                    update: user,
                    create: user,
                });
            }

            // Restore Customers
            for (const customer of data.customers || []) {
                await tx.customer.upsert({
                    where: { id: customer.id },
                    update: customer,
                    create: customer,
                });
            }

            // Restore Products
            for (const product of data.products || []) {
                await tx.product.upsert({
                    where: { id: product.id },
                    update: product,
                    create: product,
                });
            }

            // Restore WorkOrders & related
            for (const order of data.workOrders || []) {
                const { statusHistory, photos, technicalReport, ...orderData } = order;
                await tx.workOrder.upsert({
                    where: { id: order.id },
                    update: orderData,
                    create: orderData,
                });
                
                // Clear and restore relations for simplicity in this demo environment
                if (technicalReport) {
                    await tx.technicalReport.upsert({
                        where: { id: technicalReport.id },
                        update: technicalReport,
                        create: technicalReport,
                    });
                }
            }
            
            // Appointments
            for (const appt of data.appointments || []) {
                await (tx as any).appointment.upsert({
                    where: { id: appt.id },
                    update: appt,
                    create: appt,
                });
            }
        });

        return NextResponse.json({ success: true, message: "Datos restaurados exitosamente" });
    } catch (e: any) {
        console.error("Restore error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
