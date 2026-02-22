"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function registerPayment({
    customerId,
    payments,
    description,
    date = new Date(),
}: {
    customerId: string;
    payments: { method: "CASH" | "DEBIT" | "CREDIT" | "TRANSFER"; amount: number }[];
    description: string;
    date?: Date;
}) {
    const session = await auth();
    if (!session) throw new Error("No autenticado");

    const tenantId = session.user.tenantId;

    const totalAmount = payments.reduce((acc, p) => acc + p.amount, 0);

    const result = await prisma.$transaction(async (tx) => {
        // 1. Upsert Current Account
        const account = await tx.currentAccount.upsert({
            where: { tenantId_customerId: { customerId, tenantId } },
            update: { balance: { decrement: totalAmount } },
            create: {
                tenantId,
                customerId,
                balance: -totalAmount,
            },
        });

        // 2. Create Payment Movement
        const movement = await tx.currentAccountMovement.create({
            data: {
                currentAccountId: account.id,
                type: "PAYMENT",
                amount: totalAmount,
                concept: description || "Cobro de cuenta corriente",
                balanceAfter: account.balance,
                date,
            },
        });

        // 3. Create Receipt
        const receipt = await tx.receipt.create({
            data: {
                currentAccountId: account.id,
                amount: totalAmount,
                concept: description,
                receiptNumber: Math.floor(Math.random() * 1000000),
                paymentMethod: payments.length > 1 ? "MULTIPLE" : (payments[0]?.method || "CASH"),
            },
        });

        // 4. Record in Cash Shift if there is one open
        const currentShift = await tx.cashShift.findFirst({
            where: { tenantId, closedAt: null },
        });

        if (currentShift) {
            for (const payment of payments) {
                await tx.cashMovement.create({
                    data: {
                        shiftId: currentShift.id,
                        type: "IN",
                        amount: payment.amount,
                        method: payment.method,
                        concept: `Cobro Cta. Cte. Recibo #${receipt.receiptNumber}`,
                        referenceId: receipt.id,
                    },
                });
            }
        }

        return receipt;
    });

    revalidatePath("/dashboard/cuentas");
    revalidatePath(`/dashboard/cuentas/${customerId}`);
    revalidatePath("/dashboard/caja");
    revalidatePath("/dashboard/recibos");

    return { success: true, receiptId: result.id };
}

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
