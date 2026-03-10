import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TurnosClient } from "./turnos-client";
import { getCustomers } from "@/lib/actions/customers";

export const metadata: Metadata = { title: "Turnos" };

export default async function TurnosPage() {
    const session = await auth();
    if (!session) return redirect("/login");

    const [appointments, customersResult, technicians] = await Promise.all([
        prisma.appointment.findMany({
            where: { tenantId: session.user.tenantId },
            include: { customer: true, technician: true },
            orderBy: { startAt: "asc" },
        }),
        getCustomers(""),
        prisma.user.findMany({
            where: {
                tenantId: session.user.tenantId,
                role: { in: ["TECHNICIAN", "ADMIN", "SUPER_ADMIN"] },
                // Hide SuperAdmins from everyone except other SuperAdmins
                ...(session.user.role !== "SUPER_ADMIN" ? { role: { not: "SUPER_ADMIN" } } : {}),
            },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
    ]);

    return (
        <TurnosClient
            appointments={appointments}
            customers={customersResult}
            technicians={technicians}
            tenantId={session.user.tenantId}
        />
    );
}
