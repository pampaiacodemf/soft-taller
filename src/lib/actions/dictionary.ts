"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export type DictionaryType = "TYPE" | "BRAND" | "MODEL";

export async function getDictionaryItems(type: DictionaryType) {
    const session = await auth();
    if (!session) return [];

    const items = await prisma.deviceDictionary.findMany({
        where: { tenantId: session.user.tenantId, type },
        orderBy: { value: "asc" },
        select: { id: true, value: true }
    });

    return items;
}

export async function addDictionaryItem(type: DictionaryType, value: string) {
    try {
        const session = await auth();
        if (!session) return { error: "No autorizado" };

        const trimmed = value.trim();
        if (!trimmed) return { error: "Valor inválido" };

        // Check if exists
        const existing = await prisma.deviceDictionary.findFirst({
            where: {
                tenantId: session.user.tenantId,
                type,
                value: {
                    equals: trimmed
                }
            }
        });

        if (existing) {
            return { success: true, item: existing };
        }

        const newItem = await prisma.deviceDictionary.create({
            data: {
                tenantId: session.user.tenantId,
                type,
                value: trimmed
            }
        });

        revalidatePath("/dashboard/ordenes");
        revalidatePath("/dashboard/inventario");

        return { success: true, item: newItem };
    } catch (error: any) {
        return { error: error.message || "No se pudo guardar la nueva opción." };
    }
}

export async function deleteDictionaryItem(id: string) {
    try {
        const session = await auth();
        if (!session) return { error: "No autorizado" };

        await prisma.deviceDictionary.delete({
            where: {
                id,
                tenantId: session.user.tenantId
            }
        });

        revalidatePath("/dashboard/admin/diccionarios");
        revalidatePath("/dashboard/ordenes");
        revalidatePath("/dashboard/inventario");

        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Error al eliminar la opción." };
    }
}

export async function editDictionaryItem(id: string, newValue: string) {
    try {
        const session = await auth();
        if (!session) return { error: "No autorizado" };

        const trimmed = newValue.trim();
        if (!trimmed) return { error: "Valor vacío inválido" };

        const updated = await prisma.deviceDictionary.update({
            where: {
                id,
                tenantId: session.user.tenantId
            },
            data: { value: trimmed }
        });

        revalidatePath("/dashboard/admin/diccionarios");
        revalidatePath("/dashboard/ordenes");
        revalidatePath("/dashboard/inventario");

        return { success: true, item: updated };
    } catch (error: any) {
        if (error.code === 'P2002') return { error: "Ya existe un registro exacto." };
        return { error: error.message || "Error al modificar la opción." };
    }
}
