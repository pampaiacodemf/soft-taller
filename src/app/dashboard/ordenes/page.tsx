import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import { Plus, Wrench, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, WORK_ORDER_STATUS_COLORS, WORK_ORDER_STATUS_LABELS, WORK_ORDER_PRIORITY_COLORS, WORK_ORDER_PRIORITY_LABELS } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Órdenes de Trabajo" };

import { SearchInput } from "@/components/ui/search-input";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { Prisma } from "@prisma/client";

export default async function OrdenesPage({
    searchParams,
}: {
    searchParams?: { q?: string; status?: string; technicianId?: string };
}) {
    const session = await auth();
    if (!session) return null;

    const query = searchParams?.q || "";
    const statusFilter = searchParams?.status || "";
    const technicianFilter = searchParams?.technicianId || "";

    // Fetch technicians for the filter
    const technicians = await prisma.user.findMany({
        where: { 
            tenantId: session.user.tenantId,
            role: { in: ["TECHNICIAN", "ADMIN", "ADMIN_STAFF"] }
        },
        select: { id: true, name: true }
    });

    const techOptions = technicians.reduce((acc, t) => {
        acc[t.id] = t.name || "Usuario";
        return acc;
    }, {} as Record<string, string>);

    // Build Prisma query
    const whereClause: Prisma.WorkOrderWhereInput = {
        tenantId: session.user.tenantId,
    };

    if (statusFilter) {
        whereClause.status = statusFilter;
    }

    if (technicianFilter) {
        whereClause.technicianId = technicianFilter;
    }

    if (query) {
        const orderNum = parseInt(query);
        whereClause.OR = [
            { customer: { name: { contains: query } } },
            { customer: { dni: { contains: query } } },
            { customer: { phone: { contains: query } } },
            { deviceType: { contains: query } },
            { brand: { contains: query } },
            { model: { contains: query } },
            { serial: { contains: query } },
        ];
        
        if (!isNaN(orderNum)) {
            whereClause.OR.push({ orderNumber: orderNum });
        }
    }

    const orders = await prisma.workOrder.findMany({
        where: whereClause,
        include: { customer: true, technician: true },
        orderBy: { createdAt: "desc" },
        take: 100,
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Órdenes de Trabajo</h1>
                    <p className="text-muted-foreground mt-1">{orders.length} órdenes</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <SearchInput placeholder="# Orden, cliente o equipo..." className="w-full sm:w-80" />
                    <Button asChild>
                        <Link href="/dashboard/ordenes/nueva">
                            <Plus className="w-4 h-4 mr-2" />
                            Nueva Orden
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="space-y-4">
                <div className="overflow-x-auto pb-2 scrollbar-hide">
                    <FilterTabs 
                        paramName="status" 
                        options={WORK_ORDER_STATUS_LABELS} 
                        colors={WORK_ORDER_STATUS_COLORS}
                    />
                </div>
                
                <div className="overflow-x-auto pb-2 scrollbar-hide">
                    <FilterTabs 
                        paramName="technicianId" 
                        options={techOptions} 
                        allLabel="Todos los técnicos"
                    />
                </div>
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
                    orders.map((order: any) => (
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

                                {/* Badges */}
                                <div className="flex flex-col items-end gap-2">
                                    <span
                                        className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${WORK_ORDER_PRIORITY_COLORS[order.priority] || "bg-gray-100"}`}
                                    >
                                        {WORK_ORDER_PRIORITY_LABELS[order.priority] || order.priority}
                                    </span>
                                    <span
                                        className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium ${WORK_ORDER_STATUS_COLORS[order.status]}`}
                                    >
                                        {WORK_ORDER_STATUS_LABELS[order.status]}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
