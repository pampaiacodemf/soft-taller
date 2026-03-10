"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createAppointment(data: {
    tenantId: string;
    title: string;
    description?: string;
    customerId?: string;
    technicianId?: string;
    startAt: Date;
    endAt?: Date;
}) {
    const session = await auth();
    if (!session) throw new Error("No autorizado");

    await prisma.appointment.create({
        data: {
            tenantId: data.tenantId,
            title: data.title,
            description: data.description,
            customerId: data.customerId || null,
            technicianId: data.technicianId || null,
            startAt: data.startAt,
            endAt: data.endAt || null,
        },
    });

    revalidatePath("/dashboard/turnos");
    return { success: true };
}

export async function deleteAppointment(id: string) {
    const session = await auth();
    if (!session) throw new Error("No autorizado");

    await prisma.appointment.delete({ where: { id } });
    revalidatePath("/dashboard/turnos");
    return { success: true };
}

export async function updateAppointmentStatus(id: string, status: string) {
    const session = await auth();
    if (!session) throw new Error("No autorizado");

    await prisma.appointment.update({ where: { id }, data: { status } });
    revalidatePath("/dashboard/turnos");
    return { success: true };
}
