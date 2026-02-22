"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getCategories() {
    const session = await auth();
    if (!session) return [];

    return await prisma.productCategory.findMany({
        where: { tenantId: session.user.tenantId },
        orderBy: { name: "asc" },
    });
}

export async function addCategory(name: string) {
    try {
        const session = await auth();
        if (!session) return { error: "No autorizado" };

        const trimmed = name.trim();
        if (!trimmed) return { error: "Nombre inválido" };

        const existing = await prisma.productCategory.findFirst({
            where: {
                tenantId: session.user.tenantId,
                name: { equals: trimmed }
            }
        });

        if (existing) return { error: "Ya existe una categoría con ese nombre" };

        const category = await prisma.productCategory.create({
            data: {
                tenantId: session.user.tenantId,
                name: trimmed
            }
        });

        revalidatePath("/dashboard/admin/categorias");
        revalidatePath("/dashboard/inventario");

        return { success: true, category };
    } catch (error: any) {
        return { error: error.message || "Error al crear la categoría" };
    }
}

export async function updateCategory(id: string, name: string) {
    try {
        const session = await auth();
        if (!session) return { error: "No autorizado" };

        const trimmed = name.trim();
        if (!trimmed) return { error: "Nombre inválido" };

        const updated = await prisma.productCategory.update({
            where: {
                id,
                tenantId: session.user.tenantId
            },
            data: { name: trimmed }
        });

        revalidatePath("/dashboard/admin/categorias");
        revalidatePath("/dashboard/inventario");

        return { success: true, category: updated };
    } catch (error: any) {
        return { error: error.message || "Error al actualizar la categoría" };
    }
}

export async function deleteCategory(id: string) {
    try {
        const session = await auth();
        if (!session) return { error: "No autorizado" };

        // Check if has products
        const productsCount = await prisma.product.count({
            where: { categoryId: id }
        });

        if (productsCount > 0) {
            return { error: "No se puede eliminar una categoría que contiene productos" };
        }

        await prisma.productCategory.delete({
            where: {
                id,
                tenantId: session.user.tenantId
            }
        });

        revalidatePath("/dashboard/admin/categorias");
        revalidatePath("/dashboard/inventario");

        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Error al eliminar la categoría" };
    }
}
