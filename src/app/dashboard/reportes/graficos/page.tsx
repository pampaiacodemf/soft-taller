import { getGraphicalMetrics } from "@/lib/actions/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, PieChart, TrendingUp, Package } from "lucide-react";

export const metadata = { title: "Gráficos de Reportes" };

export default async function GraficosPage() {
    const metrics = await getGraphicalMetrics();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Análisis Visual</h1>
                <p className="text-muted-foreground mt-1">
                    Métricas detalladas y distribución del negocio.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Daily Revenue Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            Ingresos Diarios (Últimos 7 días)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] flex items-end justify-between gap-2 pt-8">
                            {metrics.dailyRevenue.map((d, i) => {
                                const maxVal = Math.max(...metrics.dailyRevenue.map(v => v.value), 1);
                                const height = (d.value / maxVal) * 100;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center group relative">
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-primary text-white text-[10px] px-2 py-1 rounded shadow-md whitespace-nowrap transition-opacity">
                                            {formatCurrency(d.value)}
                                        </div>
                                        <div
                                            className="w-full bg-primary/20 group-hover:bg-primary transition-all rounded-t-sm"
                                            style={{ height: `${Math.max(height, 5)}%` }}
                                        />
                                        <span className="text-[10px] text-muted-foreground mt-2 uppercase">{d.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Orders by Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary" />
                            Distribución de Órdenes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 pt-4">
                            {metrics.ordersByStatus.map((s, i) => {
                                const total = metrics.ordersByStatus.reduce((acc, curr) => acc + curr.value, 0);
                                const percentage = (s.value / total) * 100;
                                return (
                                    <div key={i} className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span>{s.name}</span>
                                            <span>{s.value} ({percentage.toFixed(1)}%)</span>
                                        </div>
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Categories Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Package className="w-4 h-4 text-primary" />
                            Inventario por Categoría
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            {metrics.categoryDistribution.map((c, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                                    <div className="w-2 h-8 bg-primary rounded-full" />
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{c.name}</p>
                                        <p className="text-xl font-black">{c.count}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Methods */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <PieChart className="w-4 h-4 text-primary" />
                            Ingresos por Medio de Pago
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 pt-4">
                            {metrics.paymentMethods.map((m, i) => {
                                const total = metrics.paymentMethods.reduce((acc, curr) => acc + curr.value, 0);
                                const percentage = (m.value / total) * 100;
                                return (
                                    <div key={i} className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span className="uppercase text-[10px]">{m.name}</span>
                                            <span className="font-bold">{formatCurrency(m.value)}</span>
                                        </div>
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary/60"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
