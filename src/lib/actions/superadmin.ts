"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function extendSubscription(tenantId: string, days: number) {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") throw new Error("No autorizado");

    const sub = await prisma.subscription.findUnique({ where: { tenantId } });
    if (!sub) throw new Error("Suscripción no encontrada");

    const now = new Date();
    const currentExpiry = sub.expiresAt < now ? now : sub.expiresAt;
    const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);
    const newDays = Math.ceil((newExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    await prisma.subscription.update({
        where: { tenantId },
        data: {
            expiresAt: newExpiry,
            daysRemaining: newDays,
            isActive: true,
        },
    });

    revalidatePath("/dashboard/superadmin/membresia");
    return { success: true, newDays };
}

export async function resetSubscription(tenantId: string) {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") throw new Error("No autorizado");

    await prisma.subscription.update({
        where: { tenantId },
        data: { daysRemaining: 0, isActive: false, expiresAt: new Date() },
    });

    revalidatePath("/dashboard/superadmin/membresia");
    return { success: true };
}
