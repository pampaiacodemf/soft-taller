"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// AFIP / ARCA Stub Service
// In a real implementation, you would use 'node-afip-ws' or similar to call ARCA.
async function authorizeWithAFIP(invoice: any) {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 1500));

    // Simulate AFIP CAE generation
    const cae = Math.floor(Math.random() * 10000000000000).toString();
    const vto = new Date();
    vto.setDate(vto.getDate() + 10);

    return {
        cae,
        caeVto: vto,
        cbteNro: Math.floor(Math.random() * 10000) + 1,
    };
}

export async function createSale({
    customerId,
    items,
    type, // A, B, or C
    payments,
    total,
}: {
    customerId: string;
    items: { productId: string; qty: number; price: number; iva: number }[];
    type: "A" | "B" | "C";
    payments: { method: "CASH" | "DEBIT" | "CREDIT" | "TRANSFER" | "CURRENT_ACCOUNT"; amount: number }[];
    total: number;
}) {
    try {
        const session = await auth();
        if (!session) return { error: "No autenticado" };

        const tenantId = session.user.tenantId;

        // Calculate subtotal and iva total for the invoice
        const subtotal = items.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const ivaAmount = items.reduce((acc, item) => acc + (item.price * item.qty * item.iva / 100), 0);

        // 1. Create Invoice in DB
        const invoice = await prisma.invoice.create({
            data: {
                tenantId,
                customerId,
                invoiceType: type,
                total,
                subtotal,
                ivaAmount,
                paymentMethod: payments.length > 1 ? "MULTIPLE" : (payments[0]?.method || "CASH"),
                invoiceNumber: 0,
                items: {
                    create: items.map((i) => ({
                        productId: i.productId,
                        description: "Venta de producto",
                        quantity: i.qty,
                        unitPrice: i.price,
                        ivaRate: i.iva,
                        subtotal: i.price * i.qty,
                    })),
                },
            },
        });

        // 2. Call AFIP Stub (except for internal notes)
        const afip = await authorizeWithAFIP(invoice);

        // 3. Update Invoice with CAE and Number
        await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
                afipCae: afip.cae,
                afipCaeExpiry: afip.caeVto,
                invoiceNumber: afip.cbteNro,
            },
        });

        // 4. Update Product Stocks
        for (const item of items) {
            await prisma.product.update({
                where: { id: item.productId },
                data: {
                    stock: { decrement: item.qty },
                },
            });
        }

        // 5. Process Payments
        const currentShift = await prisma.cashShift.findFirst({
            where: { tenantId, closedAt: null },
        });

        for (const payment of payments) {
            if (payment.method === "CURRENT_ACCOUNT") {
                const account = await prisma.currentAccount.upsert({
                    where: { tenantId_customerId: { customerId, tenantId } },
                    update: { balance: { increment: payment.amount } },
                    create: {
                        tenantId,
                        customerId,
                        balance: payment.amount,
                    },
                });

                await prisma.currentAccountMovement.create({
                    data: {
                        currentAccountId: account.id,
                        type: "DEBIT",
                        amount: payment.amount,
                        balanceAfter: account.balance + payment.amount,
                        concept: `Venta Factura ${type} #${afip.cbteNro}`,
                        invoiceId: invoice.id,
                    },
                });
            } else if (currentShift) {
                // Record in Cash Shift
                await prisma.cashMovement.create({
                    data: {
                        shiftId: currentShift.id,
                        type: "IN",
                        amount: payment.amount,
                        method: payment.method,
                        concept: `Venta Factura ${type} #${afip.cbteNro}`,
                        referenceId: invoice.id,
                    }
                });
            }
        }

        revalidatePath("/dashboard/ventas");
        revalidatePath("/dashboard/inventario");
        revalidatePath("/dashboard/cuentas");
        revalidatePath("/dashboard/caja");

        return { success: true, invoiceId: invoice.id };
    } catch (e: any) {
        return { error: e.message || "Error al procesar la venta" };
    }
}
