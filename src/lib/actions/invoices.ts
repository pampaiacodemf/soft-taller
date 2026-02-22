"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getInvoices(search?: string, type?: "A" | "B" | "C") {
    const session = await auth();
    if (!session) throw new Error("No autenticado");

    return prisma.invoice.findMany({
        where: {
            tenantId: session.user.tenantId,
            ...(type ? { invoiceType: type } : {}),
            ...(search ? {
                OR: [
                    { customer: { name: { contains: search } } },
                    { customer: { cuit: { contains: search } } },
                    { afipCae: { contains: search } },
                    { notes: { contains: search } },
                ],
            } : {}),
        },
        include: {
            customer: true,
            items: {
                include: {
                    product: true,
                },
            },
        },
        orderBy: { invoiceDate: "desc" },
    });
}
