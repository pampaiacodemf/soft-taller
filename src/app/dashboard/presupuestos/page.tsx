import { getBudgets } from "@/lib/actions/budgets";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText, Plus, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Presupuestos" };

export default async function PresupuestosPage({
    searchParams,
}: {
    searchParams: { q?: string };
}) {
    const search = searchParams?.q || "";
    const budgets = await getBudgets(search);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <FileText className="w-8 h-8 text-primary" />
                        Presupuestos
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Cotizaciones a clientes (vinculadas a Órdenes de Trabajo o libres)
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/presupuestos/nuevo">
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Presupuesto
                    </Link>
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <form className="flex-1 max-w-sm flex items-center gap-2">
                    <Input
                        name="q"
                        placeholder="Buscar por cliente o notas..."
                        defaultValue={search}
                        className="bg-background"
                    />
                    <Button type="submit" variant="secondary">Buscar</Button>
                </form>
            </div>

            <div className="bg-card border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Nº</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Origen</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {budgets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No se encontraron presupuestos.
                                </TableCell>
                            </TableRow>
                        ) : (
                            budgets.map((budget) => {
                                let statusColor = "bg-yellow-100 text-yellow-800";
                                let statusIcon = <Clock className="w-3 h-3 mr-1" />;
                                let statusText = "Pendiente";

                                if (budget.approvedAt) {
                                    statusColor = "bg-green-100 text-green-800";
                                    statusIcon = <CheckCircle className="w-3 h-3 mr-1" />;
                                    statusText = "Aprobado";
                                } else if (budget.rejectedAt) {
                                    statusColor = "bg-red-100 text-red-800";
                                    statusIcon = <XCircle className="w-3 h-3 mr-1" />;
                                    statusText = "Rechazado";
                                }

                                return (
                                    <TableRow key={budget.id}>
                                        <TableCell>{formatDate(budget.createdAt)}</TableCell>
                                        <TableCell className="font-medium">#{budget.budgetNumber.toString().padStart(4, '0')}</TableCell>
                                        <TableCell>
                                            {budget.customer ? budget.customer.name : "Consumidor Final"}
                                        </TableCell>
                                        <TableCell>
                                            {budget.workOrder ? (
                                                <Badge variant="outline">OT #{budget.workOrder.orderNumber}</Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Libre</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                                                {statusIcon}
                                                {statusText}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            {formatCurrency(budget.total)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {/* TODO: Add edit/view/approve buttons if pending */}
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/dashboard/presupuestos/${budget.id}`}>Ver</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
