import { auth } from "@/auth";
import {
    Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import {
    Package, Wrench, ShoppingCart, AlertTriangle, TrendingUp, Clock,
} from "lucide-react";
import { formatCurrency, WORK_ORDER_STATUS_COLORS, WORK_ORDER_STATUS_LABELS } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function DashboardPage() {
    const session = await auth();
    if (!session) return null;

    const tenantId = session.user.tenantId;

    // Parallel data fetching
    const [
        productCount,
        lowStockCount,
        openOrders,
        recentOrders,
    ] = await Promise.all([
        prisma.product.count({ where: { tenantId, isActive: true } }),
        prisma.product.count({
            where: { tenantId, isActive: true, stock: { lte: prisma.product.fields.minStock } },
        }).catch(() => prisma.product.count({ where: { tenantId, isActive: true, stock: { lte: 2 } } })),
        prisma.workOrder.count({
            where: { tenantId, status: { notIn: ["ENTREGADO"] } },
        }),
        prisma.workOrder.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            take: 8,
            include: { customer: true },
        }),
    ]);

    const stats = [
        {
            title: "Productos en Stock",
            value: productCount,
            icon: Package,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            title: "Stock Crítico",
            value: lowStockCount,
            icon: AlertTriangle,
            color: "text-amber-600",
            bg: "bg-amber-50",
            alert: lowStockCount > 0,
        },
        {
            title: "Órdenes Activas",
            value: openOrders,
            icon: Wrench,
            color: "text-green-600",
            bg: "bg-green-50",
        },
        {
            title: "Días de Suscripción",
            value: session.user.daysRemaining,
            icon: Clock,
            color: session.user.daysRemaining <= 7 ? "text-red-600" : "text-purple-600",
            bg: session.user.daysRemaining <= 7 ? "bg-red-50" : "bg-purple-50",
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Bienvenido, <span className="font-medium text-foreground">{session.user.name}</span> — {new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
            </div>

            {/* Stats cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title} className={stat.alert ? "border-amber-200 shadow-amber-100/50 shadow-md" : ""}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2 rounded-lg ${stat.bg}`}>
                                    <Icon className={`h-4 w-4 ${stat.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-3xl font-bold ${stat.alert ? "text-amber-600" : ""}`}>
                                    {stat.value}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Recent orders */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-muted-foreground" />
                        <CardTitle className="text-base">Últimas Órdenes de Trabajo</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    {recentOrders.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p>No hay órdenes de trabajo aún.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentOrders.map((order) => (
                                <Link href={`/dashboard/ordenes/${order.id}`} key={order.id}>
                                    <div
                                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 hover:cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary text-sm font-bold">
                                                #{order.orderNumber}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{order.customer.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {order.deviceType}{order.brand ? ` · ${order.brand}` : ""}
                                                    {order.model ? ` ${order.model}` : ""}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`text-xs px-2.5 py-1 rounded-full font-medium ${WORK_ORDER_STATUS_COLORS[order.status]}`}
                                        >
                                            {WORK_ORDER_STATUS_LABELS[order.status]}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
