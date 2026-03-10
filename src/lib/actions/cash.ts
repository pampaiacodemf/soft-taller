"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

/**
 * Gets the currently open cash shift for the tenant
 */
export async function getCurrentShift() {
    try {
        const session = await auth();
        if (!session) return { error: "No autorizado" };

        const shift = await prisma.cashShift.findFirst({
            where: {
                tenantId: session.user.tenantId,
                closedAt: null,
            },
            include: {
                openedBy: true,
                movements: {
                    orderBy: { createdAt: "desc" },
                },
            },
        });
        return { success: true, shift };
    } catch (e: any) {
        return { error: e.message || "Error al obtener turno" };
    }
}

/**
 * Opens a new cash shift
 */
export async function openShift(initialCash: number, notes?: string) {
    try {
        const session = await auth();
        if (!session) return { error: "No autorizado" };

        // Check if there's already an open shift
        const existing = await prisma.cashShift.findFirst({
            where: {
                tenantId: session.user.tenantId,
                closedAt: null,
            },
        });

        if (existing) {
            return { error: "Ya hay una caja abierta" };
        }

        const shift = await prisma.cashShift.create({
            data: {
                tenantId: session.user.tenantId,
                openedById: session.user.id,
                initialCash,
                notes,
            },
        });

        revalidatePath("/dashboard/caja");
        return { success: true, shift };
    } catch (e: any) {
        return { error: e.message || "Error al abrir turno" };
    }
}

/**
 * Closes the current cash shift
 */
export async function closeShift(shiftId: string, finalCash: number, notes?: string) {
    try {
        const session = await auth();
        if (!session) return { error: "No autorizado" };

        const shift = await prisma.cashShift.update({
            where: {
                id: shiftId,
                tenantId: session.user.tenantId,
                closedAt: null,
            },
            data: {
                closedById: session.user.id,
                closedAt: new Date(),
                finalCash,
                notes,
            },
        });

        revalidatePath("/dashboard/caja");
        return { success: true, shift };
    } catch (e: any) {
        return { error: e.message || "Error al cerrar turno" };
    }
}

/**
 * Gets yesterday's or the last closed shift for reporting
 */
export async function getLastClosedShift() {
    const session = await auth();
    if (!session) throw new Error("No autorizado");

    return prisma.cashShift.findFirst({
        where: {
            tenantId: session.user.tenantId,
            closedAt: { not: null },
        },
        orderBy: { closedAt: "desc" },
    });
}

/**
 * Register a generic cash movement (manual entry/withdrawal)
 */
export async function registerManualMovement(data: {
    type: "IN" | "OUT";
    amount: number;
    method: string;
    concept: string;
}) {
    try {
        const session = await auth();
        if (!session) return { error: "No autorizado" };

        const currentShift = await getCurrentShift();
        if (!currentShift || !currentShift.shift) {
            return { error: "No hay caja abierta para registrar este movimiento" };
        }

        const movement = await prisma.cashMovement.create({
            data: {
                shiftId: currentShift.shift.id,
                type: data.type,
                amount: data.amount,
                method: data.method,
                concept: data.concept,
            }
        });

        revalidatePath("/dashboard/caja");
        return { success: true, movement };
    } catch (e: any) {
        return { error: e.message || "Error al registrar movimiento" };
    }
}
