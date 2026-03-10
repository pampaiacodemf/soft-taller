import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";

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

    return (
        <div className="bg-white text-black min-h-screen font-mono text-sm">
            {/* Contenedor del Ticket (ancho típico de impresora térmica 80mm ~ 300px) */}
            <div className="max-w-[320px] mx-auto p-4 bg-white print:p-0 print:m-0">
                {/* Cabecera */}
                <div className="text-center mb-6">
                    <h1 className="font-bold text-xl uppercase">{invoice.tenant?.name || "MI COMERCIO"}</h1>
                    {invoice.tenant?.cuit && <p>CUIT: {invoice.tenant.cuit}</p>}
                    {invoice.tenant?.address && <p>{invoice.tenant.address}</p>}
                    {invoice.tenant?.phone && <p>Tel: {invoice.tenant.phone}</p>}
                    <p className="mt-2">--------------------------------</p>
                    <p className="font-bold text-lg">TICKET Factura {invoice.invoiceType}</p>
                    <p>Nº {String(invoice.puntoVenta).padStart(4, '0')}-{String(invoice.invoiceNumber).padStart(8, '0')}</p>
                    <p>Fecha: {formatDate(invoice.invoiceDate)}</p>
                    <p className="mt-2">--------------------------------</p>
                </div>

                {/* Cliente */}
                <div className="mb-4">
                    <p>Cliente: {invoice.customer?.name || "Consumidor Final"}</p>
                    {invoice.customer?.cuit && <p>CUIT/DNI: {invoice.customer.cuit}</p>}
                </div>
                <p className="mb-2">--------------------------------</p>

                {/* Ítems */}
                <div className="mb-4">
                    <table className="w-full text-left">
                        <thead>
                            <tr>
                                <th>Cant</th>
                                <th>Descripción</th>
                                <th className="text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item) => (
                                <tr key={item.id} className="align-top">
                                    <td className="pr-2">{item.quantity}</td>
                                    <td className="pr-2">{item.description}</td>
                                    <td className="text-right">{formatCurrency(item.subtotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <p className="mb-2">--------------------------------</p>

                {/* Totales */}
                <div className="space-y-1 mb-6 text-right">
                    <p>Subtotal: {formatCurrency(invoice.subtotal)}</p>
                    <p>IVA: {formatCurrency(invoice.ivaAmount)}</p>
                    <p className="font-bold text-lg mt-2">TOTAL: {formatCurrency(invoice.total)}</p>
                    <p className="text-xs uppercase mt-2">Condición de Venta: {
                        invoice.paymentMethod === 'CASH' ? 'Efectivo' :
                            invoice.paymentMethod === 'DEBIT' ? 'Débito' :
                                invoice.paymentMethod === 'CREDIT' ? 'Crédito' :
                                    invoice.paymentMethod === 'TRANSFER' ? 'Transferencia' : 'Cta. Cte.'
                    }</p>
                </div>

                {/* Pie */}
                <div className="text-center text-xs mt-8 pb-8">
                    <p>¡Gracias por su compra!</p>
                    <p>Este documento no es válido como factura.</p>
                </div>
            </div>

            {/* Script de impresión automática */}
            <script
                dangerouslySetInnerHTML={{
                    __html: `
                        window.onload = function() {
                            window.print();
                        }
                    `
                }}
            />
        </div>
    );
}
