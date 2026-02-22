import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Detalle de Presupuesto" };

export default async function BudgetDetail({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session) return redirect("/login");

    const rawBudget = await prisma.budget.findFirst({
        where: {
            id: params.id,
            tenantId: session.user.tenantId
        },
        include: {
            customer: true,
            workOrder: true,
            items: true,
        },
    });

    const budget = rawBudget as any;

    if (!budget) return notFound();

    // Re-calculate totals
    let subtotal = 0;
    let totalIva = 0;

    budget.items.forEach((item: any) => {
        const itemSubtotal = item.quantity * Number(item.unitPrice);
        const itemIvaAmount = itemSubtotal * (Number(item.ivaRate) / 100);
        subtotal += itemSubtotal;
        totalIva += itemIvaAmount;
    });
    const total = subtotal + totalIva;

    let derivedStatus = "PENDIENTE";
    if (budget.approvedAt) derivedStatus = "APROBADO";
    if (budget.rejectedAt) derivedStatus = "RECHAZADO";

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            {/* Action Bar (hidden when printing) */}
            <div className="flex justify-between items-center mb-8 print:hidden">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/presupuestos">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver
                    </Link>
                </Button>
                <div className="space-x-2">
                    {/* Imprimir button needs client component or direct window.print via script, so we use a small client wrapper or just an inline onclick if client */}
                    <Link
                        href={`/dashboard/presupuestos/${budget.id}/imprimir`}
                        target="_blank"
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimir / PDF
                    </Link>
                </div>
            </div>

            {/* A4 Paper Container for Preview */}
            <div className="bg-white text-black p-8 md:p-12 shadow-xl border rounded-lg min-h-[1056px] print:shadow-none print:border-none print:p-0 print:min-h-0 mx-auto w-full max-w-[800px] print:max-w-none">
                {/* Headers */}
                <div className="flex justify-between items-start border-b pb-8 mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">PRESUPUESTO</h1>
                        <p className="text-gray-500 mt-1 font-mono">#{budget.id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold">{session.user.name || "Taller"}</h2>
                        <p className="text-sm text-gray-500">{session.user.email}</p>
                        {formatDate(budget.createdAt)}
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Para</p>
                        <p className="font-bold text-lg">{budget?.customer?.name || "Cliente Final"}</p>
                        {budget?.customer?.email && <p className="text-sm text-gray-600">{budget.customer.email}</p>}
                        {budget?.customer?.phone && <p className="text-sm text-gray-600">{budget.customer.phone}</p>}
                        {budget?.customer?.cuit && <p className="text-sm text-gray-600">CUIT: {budget.customer.cuit}</p>}
                    </div>

                    <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Detalles</p>
                        <div className="space-y-1">
                            <p className="text-sm"><span className="font-medium text-gray-600">Estado:</span> <Badge variant="outline" className="ml-2 uppercase">{derivedStatus}</Badge></p>
                            {budget.validUntil && (
                                <p className="text-sm"><span className="font-medium text-gray-600">Válido hasta:</span> {formatDate(budget.validUntil)}</p>
                            )}
                            {budget.workOrder && (
                                <p className="text-sm"><span className="font-medium text-gray-600">Orden Ref:</span> #{budget.workOrder.orderNumber}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-8">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b-2 border-gray-200">
                                <th className="text-left py-3 font-bold text-gray-500 uppercase">Descripción</th>
                                <th className="text-center py-3 font-bold text-gray-500 uppercase">Cant.</th>
                                <th className="text-right py-3 font-bold text-gray-500 uppercase">P. Unitario</th>
                                <th className="text-right py-3 font-bold text-gray-500 uppercase">IVA</th>
                                <th className="text-right py-3 font-bold text-gray-500 uppercase">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {budget.items.map((item: any) => {
                                const lineSubtotal = item.quantity * Number(item.unitPrice) * (1 + Number(item.ivaRate) / 100);
                                return (
                                    <tr key={item.id}>
                                        <td className="py-4 font-medium">{item.description}</td>
                                        <td className="py-4 text-center">{item.quantity}</td>
                                        <td className="py-4 text-right">{formatCurrency(Number(item.unitPrice))}</td>
                                        <td className="py-4 text-right text-gray-500">{Number(item.ivaRate)}%</td>
                                        <td className="py-4 text-right font-medium">{formatCurrency(lineSubtotal)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Totals Section */}
                <div className="flex justify-end mb-12">
                    <div className="w-64 space-y-3">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal Bruto:</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Total IVA:</span>
                            <span>{formatCurrency(totalIva)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-black text-gray-900 border-t-2 border-gray-200 pt-3">
                            <span>TOTAL:</span>
                            <span>{formatCurrency(total)}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {budget.notes && (
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 mt-auto">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Notas y Condiciones</p>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{budget.notes}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
