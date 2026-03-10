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
    paymentMethod,
    total,
    paymentSplit,
}: {
    customerId: string;
    items: { productId?: string; qty: number; price: number; iva: number; description?: string }[];
    type: "A" | "B" | "C";
    paymentMethod: "CASH" | "DEBIT" | "CREDIT" | "TRANSFER" | "CURRENT_ACCOUNT";
    total: number;
    paymentSplit?: { method: string; amount: number }[];
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
                paymentMethod,
                invoiceNumber: 0, // Will be updated after AFIP or by a sequential generator
                items: {
                    create: items.map((i) => ({
                        ...(i.productId ? { productId: i.productId } : {}),
                        description: i.description || (i.productId ? "Venta de producto" : "Servicio técnico"),
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

        // 4. Update Product Stocks (only for real products, not services)
        for (const item of items) {
            if (!item.productId) continue;
            await prisma.product.update({
                where: { id: item.productId },
                data: {
                    stock: { decrement: item.qty },
                },
            });
        }

        // 5. Register any CURRENT_ACCOUNT portion (primary or in split)
        //    Collect all CA amounts (primary-only OR from split lines)
        const caAmounts: number[] = [];
        if (paymentSplit && paymentSplit.length > 0) {
            paymentSplit.forEach((p) => {
                if (p.method === "CURRENT_ACCOUNT" && p.amount > 0) caAmounts.push(p.amount);
            });
        } else if (paymentMethod === "CURRENT_ACCOUNT") {
            caAmounts.push(total);
        }

        if (caAmounts.length > 0) {
            const caTotal = caAmounts.reduce((s, a) => s + a, 0);
            const account = await prisma.currentAccount.upsert({
                where: { tenantId_customerId: { customerId, tenantId } },
                update: { balance: { increment: caTotal } },
                create: {
                    tenantId,
                    customerId,
                    balance: caTotal,
                },
            });
            // account.balance now reflects the NEW balance after the upsert
            await prisma.currentAccountMovement.create({
                data: {
                    currentAccountId: account.id,
                    type: "DEBT",  // matches UI check: move.type === "DEBT"
                    amount: caTotal,
                    balanceAfter: account.balance, // already updated by upsert
                    concept: `Venta Factura ${type} #${afip.cbteNro}`,
                },
            });
            revalidatePath("/dashboard/cuentas");
        }

        // 6. Register cash movements for any open shift
        const currentShiftResult = await prisma.cashShift.findFirst({
            where: { tenantId, closedAt: null },
        });

        if (currentShiftResult) {
            const invoiceLabel = `Factura ${type} #${afip.cbteNro}`;
            // If payment split provided, create one movement per method
            const paymentsToRegister = paymentSplit && paymentSplit.length > 0
                ? paymentSplit
                : [{ method: paymentMethod, amount: total }];

            for (const payment of paymentsToRegister) {
                if (payment.amount <= 0) continue;
                // Skip current account — it's a debt, not cash received
                if (payment.method === "CURRENT_ACCOUNT") continue;

                await prisma.cashMovement.create({
                    data: {
                        shiftId: currentShiftResult.id,
                        type: "IN",
                        amount: payment.amount,
                        method: payment.method,
                        concept: invoiceLabel,
                    },
                });
            }
            revalidatePath("/dashboard/caja");
        }

        revalidatePath("/dashboard/ventas");
        revalidatePath("/dashboard/inventario");
        revalidatePath("/dashboard/cuentas");

        return { success: true, invoiceId: invoice.id };
    } catch (e: any) {
        return { error: e.message || "Error al procesar la venta" };
    }
}
