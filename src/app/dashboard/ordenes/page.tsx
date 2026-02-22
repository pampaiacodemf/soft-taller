import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import { Plus, Wrench, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, WORK_ORDER_STATUS_COLORS, WORK_ORDER_STATUS_LABELS } from "@/lib/utils";
import type { Metadata } from "next";

import { OrdersFilters } from "@/components/orders/orders-filters";

export const metadata: Metadata = { title: "Órdenes de Trabajo" };

interface OrdenesPageProps {
    searchParams: {
        query?: string;
        status?: string;
    };
}

export default async function OrdenesPage({ searchParams }: OrdenesPageProps) {
    const session = await auth();
    if (!session) return null;

    const query = searchParams.query || "";
    const status = searchParams.status === "all" ? undefined : searchParams.status;

    // Check if query is a number for searching by order number
    const orderNumber = parseInt(query);
    const isNumericSearch = !isNaN(orderNumber) && /^\d+$/.test(query);

    const orders = await prisma.workOrder.findMany({
        where: {
            tenantId: session.user.tenantId,
            AND: [
                status ? { status: status as any } : {},
                query ? {
                    OR: [
                        { customer: { name: { contains: query } } },
                        { deviceType: { contains: query } },
                        { brand: { contains: query } },
                        { model: { contains: query } },
                        isNumericSearch ? { orderNumber: orderNumber } : {},
                    ]
                } : {}
            ]
        },
        include: { customer: true, technician: true },
        orderBy: { createdAt: "desc" },
        take: 100,
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Órdenes de Trabajo</h1>
                    <p className="text-muted-foreground mt-1">
                        {orders.length} órdenes {query && `encontradas para "${query}"`}
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/ordenes/nueva">
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Orden
                    </Link>
                </Button>
            </div>

            <OrdersFilters />

            {/* Status filter pills */}
            <div className="flex flex-wrap gap-2">
                {Object.entries(WORK_ORDER_STATUS_LABELS).map(([status, label]) => {
                    const count = orders.filter((o) => o.status === status).length;
                    return (
                        <span
                            key={status}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${WORK_ORDER_STATUS_COLORS[status]}`}
                        >
                            {label}
                            {count > 0 && (
                                <span className="ml-1 bg-white/30 rounded-full px-1.5 py-0.5 text-xs">
                                    {count}
                                </span>
                            )}
                        </span>
                    );
                })}
            </div>

            {/* Orders list */}
            <div className="space-y-3">
                {orders.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <Wrench className="w-12 h-12 mb-4 opacity-30" />
                            <p className="font-medium">No hay órdenes de trabajo</p>
                            <p className="text-sm mt-1">Creá la primera orden para empezar</p>
                            <Button className="mt-4" asChild>
                                <Link href="/dashboard/ordenes/nueva">
                                    <Plus className="w-4 h-4 mr-2" /> Nueva Orden
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    orders.map((order) => (
                        <Link key={order.id} href={`/dashboard/ordenes/${order.id}`}>
                            <div className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md hover:border-primary/30 transition-all duration-200 group">
                                {/* Order number */}
                                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary font-bold text-lg">
                                    #{order.orderNumber}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold truncate">{order.customer.name}</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {order.deviceType}
                                        {order.brand ? ` · ${order.brand}` : ""}
                                        {order.model ? ` ${order.model}` : ""}
                                        {order.serial ? ` (S/N: ${order.serial})` : ""}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {formatDate(order.createdAt)} ·{" "}
                                        {order.technician ? `Técnico: ${order.technician.name}` : "Sin asignar"}
                                    </p>
                                </div>

                                {/* Status badge */}
                                <span
                                    className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium ${WORK_ORDER_STATUS_COLORS[order.status]}`}
                                >
                                    {WORK_ORDER_STATUS_LABELS[order.status]}
                                </span>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
