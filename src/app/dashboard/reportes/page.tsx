import { getDashboardMetrics } from "@/lib/actions/reports";
import { formatCurrency } from "@/lib/utils";
import {
    Activity,
    CreditCard,
    DollarSign,
    Users,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reportes" };

export default async function ReportesPage() {
    const metrics = await getDashboardMetrics();

    // Calculate dynamic scaling for the raw HTML chart
    const maxVal = Math.max(...metrics.chartData.map(d => d.total), 1);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Reportes y Estadísticas</h1>
                    <p className="text-muted-foreground mt-1">
                        Resumen general del rendimiento del negocio
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Ingresos Totales Brutos
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">
                            Basado en recibos y ventas cobradas
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Gastos y Egresos
                        </CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{formatCurrency(metrics.totalExpenses)}</div>
                        <p className="text-xs text-muted-foreground">
                            Egresos operativos del negocio
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Órdenes de Trabajo Activas
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.activeOrders}</div>
                        <p className="text-xs text-muted-foreground">
                            Órdenes en proceso o finalizadas sin entregar
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Nuevos Clientes
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{metrics.newCustomers}</div>
                        <p className="text-xs text-muted-foreground">
                            Registrados en los últimos 30 días
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Basic HTML/Tailwind Chart Fallback */}
            <Card className="col-span-4 mt-6">
                <CardHeader>
                    <CardTitle>Fluctuación de Ingresos (Últimos 6 meses)</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[250px] w-full flex items-end justify-between px-4 pb-4 gap-4 mt-8">
                        {metrics.chartData.map((data, i) => {
                            const heightPercentage = (data.total / maxVal) * 100;
                            return (
                                <div key={i} className="flex flex-col items-center justify-end w-full group">
                                    {/* Tooltip on hover */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 text-xs font-semibold bg-primary text-primary-foreground px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                        {formatCurrency(data.total)}
                                    </div>
                                    {/* Bar */}
                                    <div
                                        className="w-full bg-primary/20 group-hover:bg-primary transition-colors rounded-t-sm"
                                        style={{ height: `${Math.max(heightPercentage, 2)}%`, minHeight: '4px' }}
                                    />
                                    {/* Label */}
                                    <div className="mt-3 text-xs text-muted-foreground font-medium">
                                        {data.name}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
