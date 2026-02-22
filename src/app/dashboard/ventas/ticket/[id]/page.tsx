import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DocumentHeader } from "@/components/layout/document-header";

export const metadata = { title: "Ticket de Venta" };

export default async function TicketPage({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session) return redirect("/login");

    const invoice = await prisma.invoice.findFirst({
        where: { id: params.id, tenantId: session.user.tenantId },
        include: {
            customer: true,
            items: true,
            tenant: true,
        },
    });

    if (!invoice) return notFound();

    const invoiceNumberStr = `${String(invoice.puntoVenta).padStart(4, '0')}-${String(invoice.invoiceNumber).padStart(8, '0')}`;

    return (
        <div className="bg-muted/50 min-h-screen p-4 print:bg-white print:p-0">
            {/* Contenedor del Ticket */}
            <div className="max-w-[800px] mx-auto p-8 bg-white shadow-lg print:shadow-none print:max-w-full">

                <DocumentHeader
                    tenant={invoice.tenant}
                    title={`Factura ${invoice.invoiceType}`}
                    number={invoiceNumberStr}
                    date={invoice.invoiceDate}
                />

                {/* Info del Cliente */}
                <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-dashed">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Cliente</p>
                        <p className="font-bold text-base">{invoice.customer?.name || "Consumidor Final"}</p>
                        {invoice.customer?.cuit && <p className="text-sm">CUIT/DNI: {invoice.customer.cuit}</p>}
                        {invoice.customer?.address && <p className="text-sm">{invoice.customer.address}</p>}
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Condición de Venta</p>
                        <p className="font-bold">
                            {invoice.paymentMethod === 'CASH' ? 'Efectivo' :
                                invoice.paymentMethod === 'DEBIT' ? 'Débito' :
                                    invoice.paymentMethod === 'CREDIT' ? 'Crédito' :
                                        invoice.paymentMethod === 'TRANSFER' ? 'Transferencia' :
                                            invoice.paymentMethod === 'MULTIPLE' ? 'Múltiples Medios' : 'Cta. Cte.'}
                        </p>
                    </div>
                </div>

                {/* Tabla de Ítems */}
                <div className="mb-8">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b-2 border-primary/10 text-left">
                                <th className="py-2 font-bold uppercase text-[10px]">Cant</th>
                                <th className="py-2 font-bold uppercase text-[10px]">Descripción</th>
                                <th className="py-2 font-bold uppercase text-[10px] text-right">Unitario</th>
                                <th className="py-2 font-bold uppercase text-[10px] text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5">
                            {invoice.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="py-3 pr-4 font-mono">{item.quantity}</td>
                                    <td className="py-3 pr-4 font-medium">{item.description}</td>
                                    <td className="py-3 pr-4 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                                    <td className="py-3 text-right font-bold text-primary">{formatCurrency(item.subtotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totales */}
                <div className="flex justify-end pt-4">
                    <div className="w-full max-w-[250px] space-y-2">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal:</span>
                            <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>IVA (21%):</span>
                            <span className="font-mono">{formatCurrency(invoice.ivaAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t-2 border-primary/20">
                            <span className="font-black text-lg uppercase">Total:</span>
                            <span className="font-black text-2xl text-primary">{formatCurrency(invoice.total)}</span>
                        </div>
                    </div>
                </div>

                {/* Pie de página profesional */}
                <div className="mt-16 pt-8 border-t border-primary/10 text-center">
                    <p className="text-sm font-bold text-primary mb-1 uppercase tracking-widest leading-none">
                        ¡Gracias por confiar en nosotros!
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase leading-none">
                        Este documento no tiene validez fiscal como factura. Consulte por comprobante oficial.
                    </p>
                </div>
            </div>

            {/* Script de impresión automática */}
            <script
                dangerouslySetInnerHTML={{
                    __html: `
                        window.onload = function() {
                            setTimeout(() => window.print(), 500);
                        }
                    `
                }}
            />
        </div>
    );
}
