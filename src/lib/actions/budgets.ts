"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getBudgets(search?: string) {
    const session = await auth();
    if (!session) throw new Error("No autenticado");

    return prisma.budget.findMany({
        where: {
            tenantId: session.user.tenantId,
            ...(search ? {
                OR: [
                    { customer: { name: { contains: search } } },
                    { customer: { email: { contains: search } } },
                    { notes: { contains: search } },
                ]
            } : {}),
        },
        include: {
            customer: true,
            workOrder: true,
            items: true,
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function getBudgetById(id: string) {
    const session = await auth();
    if (!session) throw new Error("No autenticado");

    return prisma.budget.findUnique({
        where: { id, tenantId: session.user.tenantId },
        include: {
            customer: true,
            workOrder: true,
            items: {
                include: { product: true }
            }
        }
    });
}

export async function createBudget(data: {
    customerId?: string;
    workOrderId?: string;
    validUntil?: Date;
    items: {
        productId?: string;
        description: string;
        quantity: number;
        unitPrice: number;
        ivaRate: number;
    }[];
    notes?: string;
}) {
    const session = await auth();
    if (!session) throw new Error("No autenticado");

    const tenantId = session.user.tenantId;

    // Calc totals
    let subtotal = 0;
    let ivaAmount = 0;

    const itemsData = data.items.map(item => {
        const itemSubt = item.quantity * item.unitPrice;
        const itemIva = itemSubt * (item.ivaRate / 100);

        subtotal += itemSubt;
        ivaAmount += itemIva;

        return {
            ...item,
            subtotal: itemSubt + itemIva
        };
    });

    const total = subtotal + ivaAmount;

    // Generate Budget Number
    const count = await prisma.budget.count({ where: { tenantId } });
    const budgetNumber = count + 1;

    const budget = await prisma.budget.create({
        data: {
            tenantId,
            customerId: data.customerId,
            workOrderId: data.workOrderId,
            budgetNumber,
            validUntil: data.validUntil,
            subtotal,
            ivaAmount,
            total,
            notes: data.notes,
            items: {
                create: itemsData,
            }
        },
    });

    if (data.workOrderId) {
        await prisma.workOrder.update({
            where: { id: data.workOrderId },
            data: {
                budgetAmount: total,
                status: "PRESUPUESTADO"
            }
        });
        revalidatePath(`/dashboard/ordenes/${data.workOrderId}`);
    }

    revalidatePath("/dashboard/presupuestos");
    return { success: true, budget };
}

export async function approveBudget(budgetId: string) {
    const session = await auth();
    if (!session) throw new Error("No autenticado");

    const budget = await prisma.budget.update({
        where: { id: budgetId, tenantId: session.user.tenantId },
        data: { approvedAt: new Date(), rejectedAt: null }
    });

    if (budget.workOrderId) {
        await prisma.workOrder.update({
            where: { id: budget.workOrderId },
            data: {
                budgetApprovedAt: new Date(),
                status: "REPARACION" // Assuming approval moves it to repair
            }
        });
        revalidatePath(`/dashboard/ordenes/${budget.workOrderId}`);
    }

    revalidatePath("/dashboard/presupuestos");
    revalidatePath(`/dashboard/presupuestos/${budgetId}`);
    return { success: true, budget };
}

export async function rejectBudget(budgetId: string) {
    const session = await auth();
    if (!session) throw new Error("No autenticado");

    const budget = await prisma.budget.update({
        where: { id: budgetId, tenantId: session.user.tenantId },
        data: { rejectedAt: new Date(), approvedAt: null }
    });

    if (budget.workOrderId) {
        await prisma.workOrder.update({
            where: { id: budget.workOrderId },
            data: {
                status: "RECHAZADO" // Assuming rejection moves it to rejected
            }
        });
        revalidatePath(`/dashboard/ordenes/${budget.workOrderId}`);
    }

    revalidatePath("/dashboard/presupuestos");
    revalidatePath(`/dashboard/presupuestos/${budgetId}`);
    return { success: true, budget };
}
