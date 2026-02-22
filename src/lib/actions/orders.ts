"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { uploadFiles } from "@/lib/upload";


export async function createWorkOrder(data: {
    customerId: string;
    deviceType: string;
    brand?: string;
    model?: string;
    serial?: string;
    problemDescription: string;
    accessoryList?: string;
    technicianId?: string;
    photos: { base64Data: string; mimeType: string }[];
}) {
    try {
        const session = await auth();
        if (!session) return { error: "No autenticado" };

        const tenantId = session.user.tenantId;

        // Get next order number for this tenant
        const lastOrder = await prisma.workOrder.findFirst({
            where: { tenantId },
            orderBy: { orderNumber: "desc" },
            select: { orderNumber: true },
        });
        const orderNumber = (lastOrder?.orderNumber ?? 0) + 1;

        // Upload photos
        const uploadedPhotos = data.photos.length > 0
            ? await uploadFiles(data.photos, "work-orders")
            : [];

        const workOrder = await prisma.workOrder.create({
            data: {
                tenantId,
                customerId: data.customerId,
                orderNumber,
                deviceType: data.deviceType,
                brand: data.brand,
                model: data.model,
                serial: data.serial,
                problemDescription: data.problemDescription,
                accessoryList: data.accessoryList,
                technicianId: data.technicianId || null,
                status: "INGRESADO",
                photos: {
                    create: uploadedPhotos.map((p) => ({
                        url: p.url,
                        type: "RECEPTION" as const,
                    })),
                },
                statusHistory: {
                    create: {
                        toStatus: "INGRESADO",
                        note: "Orden ingresada al sistema",
                    },
                },
            },
            include: { customer: true },
        });

        revalidatePath("/dashboard/ordenes");
        return { success: true, workOrder };
    } catch (e: any) {
        return { error: e.message || "Error al crear la orden" };
    }
}

export async function advanceWorkOrderStatus(
    workOrderId: string,
    note?: string
) {
    try {
        const session = await auth();
        if (!session) return { error: "No autenticado" };

        const order = await prisma.workOrder.findUnique({
            where: { id: workOrderId, tenantId: session.user.tenantId },
        });
        if (!order) return { error: "Orden no encontrada" };

        const transitions: Record<string, string | null> = {
            INGRESADO: "EN_DIAGNOSTICO",
            EN_DIAGNOSTICO: "PRESUPUESTADO",
            PRESUPUESTADO: "APROBADO",
            APROBADO: "EN_REPARACION",
            EN_REPARACION: "LISTO",
            LISTO: "ENTREGADO",
            ENTREGADO: null,
        };

        const nextStatus = transitions[order.status];
        if (!nextStatus) return { error: "No se puede avanzar más" };

        await prisma.workOrder.update({
            where: { id: workOrderId },
            data: {
                status: nextStatus,
                ...(nextStatus === "ENTREGADO" ? { deliveredAt: new Date() } : {}),
                statusHistory: {
                    create: {
                        fromStatus: order.status,
                        toStatus: nextStatus,
                        note,
                    },
                },
            },
        });

        revalidatePath("/dashboard/ordenes");
        revalidatePath(`/dashboard/ordenes/${workOrderId}`);
        return { success: true, newStatus: nextStatus };
    } catch (e: any) {
        return { error: e.message || "Error al avanzar estado" };
    }
}

export async function assignTechnician(workOrderId: string, technicianId: string) {
    try {
        const session = await auth();
        if (!session) return { error: "No autenticado" };

        await prisma.workOrder.update({
            where: { id: workOrderId, tenantId: session.user.tenantId },
            data: { technicianId },
        });

        revalidatePath(`/dashboard/ordenes/${workOrderId}`);
        return { success: true };
    } catch (e: any) {
        return { error: e.message || "Error al asignar técnico" };
    }
}

export async function getWorkOrders(filters?: {
    status?: string;
    technicianId?: string;
    search?: string;
}) {
    const session = await auth();
    if (!session) throw new Error("No autenticado");

    return prisma.workOrder.findMany({
        where: {
            tenantId: session.user.tenantId,
            ...(filters?.status ? { status: filters.status } : {}),
            ...(filters?.technicianId ? { technicianId: filters.technicianId } : {}),
            ...(filters?.search ? {
                OR: [
                    { customer: { name: { contains: filters.search } } },
                    { brand: { contains: filters.search } },
                    { model: { contains: filters.search } },
                    { serial: { contains: filters.search } },
                ],
            } : {}),
        },
        include: { customer: true, technician: true, photos: true },
        orderBy: { createdAt: "desc" },
    });
}

export async function addPhotosToOrder(
    workOrderId: string,
    photos: { base64Data: string; mimeType: string }[]
) {
    try {
        const session = await auth();
        if (!session) return { error: "No autenticado" };

        if (photos.length === 0) return { success: true };

        // Upload new photos
        const uploadedPhotos = await uploadFiles(photos, "work-orders");

        await prisma.workOrder.update({
            where: { id: workOrderId, tenantId: session.user.tenantId },
            data: {
                photos: {
                    create: uploadedPhotos.map((p) => ({
                        url: p.url,
                        type: "PROGRESS" as const, // Or any other type
                    })),
                },
            },
        });

        revalidatePath(`/dashboard/ordenes/${workOrderId}`);
        return { success: true };
    } catch (e: any) {
        return { error: e.message || "Error al subir fotos" };
    }
}
