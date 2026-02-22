"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getReceipts(search?: string) {
    const session = await auth();
    if (!session) throw new Error("No autenticado");

    return prisma.receipt.findMany({
        where: {
            currentAccount: {
                tenantId: session.user.tenantId,
                ...(search ? {
                    customer: {
                        OR: [
                            { name: { contains: search } },
                            { email: { contains: search } },
                        ]
                    }
                } : {}),
            },
        },
        include: {
            currentAccount: {
                include: {
                    customer: true,
                },
            },
        },
        orderBy: { date: "desc" },
    });
}

export async function createReceipt(data: {
    currentAccountId: string;
    amount: number;
    concept: string;
    paymentMethod: string;
}) {
    const session = await auth();
    if (!session) throw new Error("No autenticado");

    const currentShift = await prisma.cashShift.findFirst({
        where: { tenantId: session.user.tenantId, closedAt: null },
    });

    const result = await prisma.$transaction(async (tx) => {
        // 1. Get current account
        const account = await tx.currentAccount.findUnique({
            where: { id: data.currentAccountId },
        });
        if (!account) throw new Error("Cuenta corriente no encontrada");

        // 2. Generate Receipt Number
        const count = await tx.receipt.count({ where: { currentAccountId: account.id } });
        const receiptNumber = count + 1;

        // 3. Create Receipt
        const receipt = await tx.receipt.create({
            data: {
                currentAccountId: account.id,
                receiptNumber,
                amount: data.amount,
                concept: data.concept,
                paymentMethod: data.paymentMethod,
            },
        });

        // 4. Update Current Account Balance
        const newBalance = account.balance - data.amount;
        await tx.currentAccount.update({
            where: { id: account.id },
            data: { balance: newBalance },
        });

        // 5. Create Movement
        await tx.currentAccountMovement.create({
            data: {
                currentAccountId: account.id,
                type: "CREDIT",
                amount: data.amount,
                balanceAfter: newBalance,
                concept: `Cobro s/ Recibo ${receiptNumber}: ${data.concept}`,
            },
        });

        // 6. Log Cash Register Movement if Shift is Open
        if (currentShift) {
            await tx.cashMovement.create({
                data: {
                    shiftId: currentShift.id,
                    type: "IN",
                    amount: data.amount,
                    method: data.paymentMethod,
                    concept: `Cobro Cta. Cte. Recibo ${receiptNumber}`,
                    referenceId: receipt.id,
                },
            });
        }

        return receipt;
    });

    revalidatePath("/dashboard/cuentas");
    revalidatePath("/dashboard/recibos");
    revalidatePath("/dashboard/caja");
    return { success: true, receipt: result };
}
