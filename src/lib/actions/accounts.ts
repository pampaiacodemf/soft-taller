"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function registerPayment({
    customerId,
    amount,
    description,
    paymentMethod = "CASH",
    date = new Date(),
}: {
    customerId: string;
    amount: number;
    description: string;
    paymentMethod?: string;
    date?: Date;
}) {
    const session = await auth();
    if (!session) throw new Error("No autenticado");

    const tenantId = session.user.tenantId;

    // 1. Upsert Current Account — balance decrements (client pays off debt)
    const account = await prisma.currentAccount.upsert({
        where: { tenantId_customerId: { customerId, tenantId } },
        update: { balance: { decrement: amount } },
        create: {
            tenantId,
            customerId,
            balance: -amount,
        },
    });
    // After upsert, account.balance is the NEW balance (already decremented)

    // 2. Create PAYMENT Movement
    await prisma.currentAccountMovement.create({
        data: {
            currentAccountId: account.id,
            type: "PAYMENT",
            amount,
            concept: description || `Cobro — ${PAYMENT_METHOD_LABEL[paymentMethod] || paymentMethod}`,
            balanceAfter: account.balance,
            date,
        },
    });

    // 3. Create Receipt with sequential number
    const existingCount = await prisma.receipt.count({
        where: { currentAccountId: account.id },
    });
    const receiptNumber = existingCount + 1;
    const receipt = await prisma.receipt.create({
        data: {
            currentAccountId: account.id,
            amount,
            concept: description,
            paymentMethod,
            receiptNumber,
        },
    });

    // 4. Register in open cash shift (if any)
    const currentShift = await prisma.cashShift.findFirst({
        where: { tenantId, closedAt: null },
    });

    if (currentShift) {
        const methodLabel = PAYMENT_METHOD_LABEL[paymentMethod] || paymentMethod;
        await prisma.cashMovement.create({
            data: {
                shiftId: currentShift.id,
                type: "IN",
                amount,
                method: paymentMethod,
                concept: description
                    ? `Cobro cta. cte. (${methodLabel}) — ${description}`
                    : `Cobro cta. cte. — ${methodLabel}`,
            },
        });
        revalidatePath("/dashboard/caja");
    }

    revalidatePath("/dashboard/cuentas");
    revalidatePath(`/dashboard/cuentas/${customerId}`);
    revalidatePath("/dashboard/recibos");

    return { success: true, receiptId: receipt.id, receiptNumber };
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
    CASH: "Efectivo",
    TRANSFER: "Transferencia",
    DEBIT: "Débito",
    CREDIT: "Crédito",
};

export async function getCurrentAccounts() {
    const session = await auth();
    if (!session) throw new Error("No autenticado");

    return prisma.currentAccount.findMany({
        where: { tenantId: session.user.tenantId },
        include: {
            customer: true,
        },
        orderBy: { balance: "desc" },
    });
}

export async function getAccountMovements(customerId: string) {
    const session = await auth();
    if (!session) throw new Error("No autenticado");

    return prisma.currentAccount.findUnique({
        where: {
            tenantId_customerId: { customerId, tenantId: session.user.tenantId },
        },
        include: {
            customer: true,
            movements: {
                orderBy: { date: "desc" },
            },
        },
    });
}
