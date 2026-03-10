import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NewOrderForm } from "./new-order-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nueva Orden de Trabajo" };

export default async function NuevaOrdenPage() {
    const session = await auth();
    if (!session) return null;

    const [customers, technicians, dictItems] = await Promise.all([
        prisma.customer.findMany({
            where: { tenantId: session.user.tenantId },
            orderBy: { name: "asc" },
        }),
        prisma.user.findMany({
            where: { tenantId: session.user.tenantId, role: { in: ["TECHNICIAN", "ADMIN"] }, isActive: true },
            orderBy: { name: "asc" },
        }),
        prisma.deviceDictionary.findMany({
            where: { tenantId: session.user.tenantId },
            orderBy: { value: "asc" }
        })
    ]);

    const dictionaries = {
        types: dictItems.filter((d: { type: string }) => d.type === "TYPE"),
        brands: dictItems.filter((d: { type: string }) => d.type === "BRAND"),
        models: dictItems.filter((d: { type: string }) => d.type === "MODEL"),
    };

    return <NewOrderForm customers={customers} technicians={technicians} dictionaries={dictionaries} />;
}
