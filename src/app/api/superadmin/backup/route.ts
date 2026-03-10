import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    try {
        // Fetch all data for all tenants as a complete snapshot
        const [tenants, users, customers, products, workOrders, invoices, budgets, expenses, cashShifts, cashMovements, receipts, currentAccounts, appointments] = await Promise.all([
            prisma.tenant.findMany({ include: { subscription: true } }),
            prisma.user.findMany(),
            prisma.customer.findMany(),
            prisma.product.findMany(),
            prisma.workOrder.findMany({ include: { statusHistory: true, photos: true, technicalReport: true } }),
            prisma.invoice.findMany({ include: { items: true } }),
            prisma.budget.findMany({ include: { items: true } }),
            prisma.expense.findMany(),
            prisma.cashShift.findMany(),
            prisma.cashMovement.findMany(),
            prisma.receipt.findMany(),
            prisma.currentAccount.findMany({ include: { movements: true } }),
            prisma.appointment.findMany().catch(() => []), // graceful if table doesn't exist
        ]);

        const backup = {
            version: "1.0",
            exportedAt: new Date().toISOString(),
            data: {
                tenants, users, customers, products, workOrders, invoices,
                budgets, expenses, cashShifts, cashMovements, receipts,
                currentAccounts, appointments,
            },
        };

        return new NextResponse(JSON.stringify(backup, null, 2), {
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="softtaller-backup-${new Date().toISOString().split("T")[0]}.json"`,
            },
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
