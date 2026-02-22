"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const productSchema = z.object({
    name: z.string().min(1, "Nombre requerido"),
    brand: z.string().optional(),
    model: z.string().optional(),
    barcode: z.string().optional(),
    description: z.string().optional(),
    costPrice: z.coerce.number().min(0),
    salePrice: z.coerce.number().min(0),
    ivaRate: z.coerce.number(),
    stock: z.coerce.number().int().min(0),
    minStock: z.coerce.number().int().min(0),
    unit: z.string().optional(),
    categoryId: z.string().optional(),
});

export async function createProduct(data: z.infer<typeof productSchema>) {
    try {
        const session = await auth();
        if (!session) return { error: "No autenticado" };

        await prisma.product.create({
            data: {
                tenantId: session.user.tenantId,
                ...data,
                categoryId: data.categoryId || null,
            },
        });

        revalidatePath("/dashboard/inventario");
        return { success: true };
    } catch (e: any) {
        return { error: e.message || "Error al crear producto" };
    }
}

export async function updateProduct(id: string, data: z.infer<typeof productSchema>) {
    try {
        const session = await auth();
        if (!session) return { error: "No autenticado" };

        const product = await prisma.product.findFirst({
            where: { id, tenantId: session.user.tenantId }
        });
        if (!product) return { error: "Producto no encontrado o no autorizado" };

        await prisma.product.update({
            where: { id },
            data: {
                ...data,
                categoryId: data.categoryId || null,
            },
        });

        revalidatePath("/dashboard/inventario");
        return { success: true };
    } catch (e: any) {
        return { error: e.message || "Error al actualizar producto" };
    }
}

export async function deleteProduct(id: string) {
    try {
        const session = await auth();
        if (!session) return { error: "No autenticado" };

        const product = await prisma.product.findFirst({
            where: { id, tenantId: session.user.tenantId }
        });
        if (!product) return { error: "Producto no encontrado o no autorizado" };

        await prisma.product.update({
            where: { id },
            data: { isActive: false },
        });

        revalidatePath("/dashboard/inventario");
        return { success: true };
    } catch (e: any) {
        return { error: e.message || "Error al eliminar" };
    }
}

export async function adjustStock(id: string, adjustment: number) {
    try {
        const session = await auth();
        if (!session) return { error: "No autenticado" };

        const product = await prisma.product.findUnique({
            where: { id, tenantId: session.user.tenantId },
        });

        if (!product) return { error: "Producto no encontrado" };

        const newStock = Math.max(0, product.stock + adjustment);

        await prisma.product.update({
            where: { id },
            data: { stock: newStock },
        });

        revalidatePath("/dashboard/inventario");
        return { success: true, newStock };
    } catch (e: any) {
        return { error: e.message || "Error al ajustar stock" };
    }
}

export async function getProducts(search?: string) {
    const session = await auth();
    if (!session) throw new Error("No autenticado");

    return prisma.product.findMany({
        where: {
            tenantId: session.user.tenantId,
            isActive: true,
            ...(search ? {
                OR: [
                    { name: { contains: search } },
                    { brand: { contains: search } },
                    { barcode: { contains: search } },
                ],
            } : {}),
        },
        include: { category: true },
        orderBy: { name: "asc" },
    });
}

export async function getCategories() {
    const session = await auth();
    if (!session) throw new Error("No autenticado");

    return prisma.productCategory.findMany({
        where: { tenantId: session.user.tenantId },
        orderBy: { name: "asc" },
    });
}
