"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const supplierSchema = z.object({
    name: z.string().min(1, "Nombre requerido"),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    cuit: z.string().optional(),
    notes: z.string().optional(),
});

export async function createSupplier(formData: FormData) {
    try {
        const session = await auth();
        if (!session) return { error: "No autenticado" };

        const raw = Object.fromEntries(formData.entries());
        const data = supplierSchema.parse(raw);

        const supplier = await prisma.supplier.create({
            data: {
                tenantId: session.user.tenantId,
                ...data,
            },
        });

        revalidatePath("/dashboard/proveedores");
        return { success: true, supplier };
    } catch (e: any) {
        return { error: e.message || "Error al crear proveedor" };
    }
}

export async function updateSupplier(id: string, formData: FormData) {
    try {
        const session = await auth();
        if (!session) return { error: "No autenticado" };

        const raw = Object.fromEntries(formData.entries());
        const data = supplierSchema.parse(raw);

        await prisma.supplier.update({
            where: { id, tenantId: session.user.tenantId },
            data: {
                ...data,
            },
        });

        revalidatePath("/dashboard/proveedores");
        return { success: true };
    } catch (e: any) {
        return { error: e.message || "Error al actualizar proveedor" };
    }
}

export async function getSuppliers(search?: string) {
    const session = await auth();
    if (!session) throw new Error("No autenticado");

    return prisma.supplier.findMany({
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

export async function deleteSupplier(id: string) {
    try {
        const session = await auth();
        if (!session) return { error: "No autenticado" };

        await prisma.supplier.update({
            where: { id, tenantId: session.user.tenantId },
            data: { isActive: false }
        });

        revalidatePath("/dashboard/proveedores");
        return { success: true };
    } catch (e: any) {
        return { error: e.message || "Error al desactivar proveedor" };
    }
}
