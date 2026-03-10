"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const customerSchema = z.object({
    name: z.string().min(1, "Nombre requerido"),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    cuit: z.string().optional(),
    dni: z.string().optional(),
    ivaCondition: z.enum(["CONSUMIDOR_FINAL", "RESPONSABLE_INSCRIPTO", "MONOTRIBUTO", "EXENTO"]).default("CONSUMIDOR_FINAL"),
});

export async function createCustomer(formData: FormData) {
    try {
        const session = await auth();
        if (!session) return { error: "No autenticado" };

        const raw = Object.fromEntries(formData.entries());
        const data = customerSchema.parse(raw);

        const customer = await prisma.customer.create({
            data: {
                tenantId: session.user.tenantId,
                ...data,
                cuit: data.cuit || null,
            },
        });

        revalidatePath("/dashboard/clientes");
        return { success: true, customer };
    } catch (e: any) {
        return { error: e.message || "Error al crear cliente" };
    }
}

export async function updateCustomer(id: string, formData: FormData) {
    try {
        const session = await auth();
        if (!session) return { error: "No autenticado" };

        const raw = Object.fromEntries(formData.entries());
        const data = customerSchema.parse(raw);

        await prisma.customer.update({
            where: { id, tenantId: session.user.tenantId },
            data: {
                ...data,
                cuit: data.cuit || null,
            },
        });

        revalidatePath("/dashboard/clientes");
        return { success: true };
    } catch (e: any) {
        return { error: e.message || "Error al actualizar cliente" };
    }
}

export async function getCustomers(search?: string) {
    const session = await auth();
    if (!session) throw new Error("No autenticado");

    return prisma.customer.findMany({
        where: {
            tenantId: session.user.tenantId,
            ...(search ? {
                OR: [
                    { name: { contains: search } },
                    { cuit: { contains: search } },
                    { email: { contains: search } },
                ],
            } : {}),
        },
        orderBy: { name: "asc" },
    });
}

export async function deleteCustomer(id: string) {
    try {
        const session = await auth();
        if (!session) return { error: "No autenticado" };
        if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
            return { error: "No tienes permisos para eliminar clientes" };
        }

        await prisma.customer.delete({
            where: { id, tenantId: session.user.tenantId },
        });

        revalidatePath("/dashboard/clientes");
        return { success: true };
    } catch (e: any) {
        return { error: e.message || "Error al eliminar cliente" };
    }
}
