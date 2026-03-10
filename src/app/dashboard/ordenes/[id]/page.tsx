import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { WorkOrderDetail } from "@/components/orders/order-detail";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Detalle de Orden" };

export default async function OrderDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const session = await auth();
    if (!session) return redirect("/login");

    const [order, technicians] = await Promise.all([
        prisma.workOrder.findUnique({
            where: { id: params.id, tenantId: session.user.tenantId },
            include: {
                customer: true,
                technician: true,
                photos: true,
                technicalReport: true,
                statusHistory: {
                    orderBy: { changedAt: "desc" },
                },
            },
        }),
        prisma.user.findMany({
            where: {
                tenantId: session.user.tenantId,
                role: { in: ["TECHNICIAN", "ADMIN"] },
                isActive: true,
            },
            orderBy: { name: "asc" },
        }),
    ]);

    if (!order) return notFound();

    return <WorkOrderDetail order={order} technicians={technicians} userRole={session.user.role} />;
}
