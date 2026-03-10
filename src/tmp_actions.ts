"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

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
