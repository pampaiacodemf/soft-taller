"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function saveTechnicalReport({
    workOrderId,
    diagnosis,
    solution,
    partsUsed,
}: {
    workOrderId: string;
    diagnosis: string;
    solution?: string;
    partsUsed?: string;
}) {
    try {
        const session = await auth();
        if (!session) return { error: "No autenticado" };

        const report = await prisma.technicalReport.upsert({
            where: { workOrderId },
            update: {
                diagnosis,
                solution,
                partsUsed,
                technicianId: session.user.id,
            },
            create: {
                workOrderId,
                diagnosis,
                solution,
                partsUsed,
                technicianId: session.user.id,
            },
        });

        revalidatePath(`/dashboard/ordenes/${workOrderId}`);
        return { success: true, report };
    } catch (e: any) {
        return { error: e.message || "Error al guardar el reporte" };
    }
}

export async function createExpense({
    category,
    amount,
    description,
    date = new Date(),
}: {
    category: string;
    amount: number;
    description: string;
    date?: Date;
}) {
    try {
        const session = await auth();
        if (!session) return { error: "No autenticado" };

        // Start a transaction to create the expense and the cash movement if a shift is open
        const currentShift = await prisma.cashShift.findFirst({
            where: { tenantId: session.user.tenantId, closedAt: null },
        });

        const expense = await prisma.$transaction(async (tx) => {
            const newExp = await tx.expense.create({
                data: {
                    tenantId: session.user.tenantId,
                    category,
                    amount,
                    description,
                    date,
                    createdById: session.user.id,
                },
            });

            if (currentShift) {
                await tx.cashMovement.create({
                    data: {
                        shiftId: currentShift.id,
                        type: "OUT",
                        amount,
                        method: "CASH", // Defaulting expenses to Cash, can be extended later
                        concept: `Gasto: ${category} - ${description}`,
                        referenceId: newExp.id,
                    },
                });
            }

            return newExp;
        });

        revalidatePath("/dashboard/gastos");
        revalidatePath("/dashboard/caja");
        return { success: true, expense };
    } catch (e: any) {
        return { error: e.message || "Error al crear gasto" };
    }
}

export async function getExpenses() {
    const session = await auth();
    if (!session) throw new Error("No autenticado");

    return prisma.expense.findMany({
        where: { tenantId: session.user.tenantId },
        orderBy: { date: "desc" },
    });
}

export async function getDashboardMetrics() {
    const session = await auth();
    if (!session) throw new Error("No autenticado");

    const tenantId = session.user.tenantId;

    // Get date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Total Revenue (from Receipts)
    const receipts = await prisma.receipt.aggregate({
        where: { currentAccount: { tenantId } },
        _sum: { amount: true },
    });
    // Additionally, sum cash sales that didn't go to current account
    const directSales = await prisma.invoice.aggregate({
        where: {
            tenantId,
            paymentMethod: { not: "CURRENT_ACCOUNT" },
        },
        _sum: { total: true },
    });

    const totalRevenue = (receipts._sum.amount || 0) + (directSales._sum.total || 0);

    // 2. Total Expenses
    const expenses = await prisma.expense.aggregate({
        where: { tenantId },
        _sum: { amount: true },
    });
    const totalExpenses = expenses._sum.amount || 0;

    // 3. Active Work Orders
    const activeOrders = await prisma.workOrder.count({
        where: {
            tenantId,
            status: { not: "ENTREGADO" },
        },
    });

    // 4. New Customers (last 30 days)
    const newCustomers = await prisma.customer.count({
        where: {
            tenantId,
            createdAt: { gte: thirtyDaysAgo },
        },
    });

    // 5. Monthly Revenue for specific charts (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // SQLite doesn't have great date grouping functions natively in Prisma,
    // so we'll fetch recent invoices/receipts and group them in JS.
    const recentInvoices = await prisma.invoice.findMany({
        where: {
            tenantId,
            paymentMethod: { not: "CURRENT_ACCOUNT" },
            invoiceDate: { gte: sixMonthsAgo }
        },
        select: { invoiceDate: true, total: true }
    });

    const recentReceipts = await prisma.receipt.findMany({
        where: {
            currentAccount: { tenantId },
            date: { gte: sixMonthsAgo }
        },
        select: { date: true, amount: true }
    });

    const monthlyData: Record<string, number> = {};

    // Initialize last 6 months with 0
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = d.toLocaleString('es-AR', { month: 'short' }).toUpperCase();
        monthlyData[key] = 0;
    }

    recentInvoices.forEach(inv => {
        const key = inv.invoiceDate.toLocaleString('es-AR', { month: 'short' }).toUpperCase();
        if (monthlyData[key] !== undefined) monthlyData[key] += inv.total;
    });

    recentReceipts.forEach(rec => {
        const key = rec.date.toLocaleString('es-AR', { month: 'short' }).toUpperCase();
        if (monthlyData[key] !== undefined) monthlyData[key] += rec.amount;
    });

    const chartData = Object.entries(monthlyData).map(([name, total]) => ({
        name,
        total
    }));

    return {
        totalRevenue,
        totalExpenses,
        activeOrders,
        newCustomers,
        chartData
    };
}

export async function getGraphicalMetrics() {
    const session = await auth();
    if (!session) throw new Error("No autenticado");

    const tenantId = session.user.tenantId;

    // 1. Sales by Payment Method
    const paymentMethods = await prisma.cashMovement.groupBy({
        where: { shift: { tenantId }, type: "IN" },
        by: ["method"],
        _sum: { amount: true },
    });

    // 2. Orders by Status
    const ordersByStatus = await prisma.workOrder.groupBy({
        where: { tenantId },
        by: ["status"],
        _count: { id: true },
    });

    // 3. Products by Category (Inventory Distribution)
    const productDistribution = await prisma.product.groupBy({
        where: { tenantId },
        by: ["categoryId"],
        _count: { id: true },
    });

    // Fetch category names
    const categories = await prisma.productCategory.findMany({
        where: { tenantId },
    });

    const categoryDistribution = productDistribution.map(d => {
        const cat = categories.find(c => c.id === d.categoryId);
        return {
            name: cat ? cat.name : "Sin Categoría",
            count: d._count.id
        };
    });

    // 4. Last 7 days revenue (daily)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyMovements = await prisma.cashMovement.findMany({
        where: {
            shift: { tenantId },
            type: "IN",
            createdAt: { gte: sevenDaysAgo }
        },
        select: { createdAt: true, amount: true }
    });

    const dailyData: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString('es-AR', { weekday: 'short' });
        dailyData[key] = 0;
    }

    dailyMovements.forEach(m => {
        const key = m.createdAt.toLocaleDateString('es-AR', { weekday: 'short' });
        if (dailyData[key] !== undefined) dailyData[key] += m.amount;
    });

    return {
        paymentMethods: paymentMethods.map(m => ({ name: m.method, value: m._sum.amount || 0 })),
        ordersByStatus: ordersByStatus.map(s => ({ name: s.status, value: s._count.id })),
        categoryDistribution,
        dailyRevenue: Object.entries(dailyData).map(([name, value]) => ({ name, value }))
    };
}
