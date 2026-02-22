import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DocumentHeader } from "@/components/layout/document-header";

export const metadata = { title: "Recibo de Pago" };

export default async function ReceiptPrintPage({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session) return redirect("/login");

    const receipt = await prisma.receipt.findFirst({
        where: { id: params.id, currentAccount: { tenantId: session.user.tenantId } },
        include: {
            currentAccount: {
                include: {
                    customer: true,
                    tenant: true,
                },
            },
        },
    });

    if (!receipt) return notFound();

    const receiptNumberStr = `RC-${String(receipt.receiptNumber).padStart(8, '0')}`;

    return (
        <div className="bg-muted/50 min-h-screen p-4 print:bg-white print:p-0">
            {/* Contenedor del Recibo */}
            <div className="max-w-[800px] mx-auto p-8 bg-white shadow-lg print:shadow-none print:max-w-full relative overflow-hidden">

                {/* Marca de agua decorativa */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[150px] font-black text-primary/5 uppercase -rotate-45 pointer-events-none">
                    RECIBO
                </div>

                <DocumentHeader
                    tenant={receipt.currentAccount.tenant!}
                    title="Recibo de Cobro"
                    number={receiptNumberStr}
                    date={receipt.date}
                />

                {/* Cuerpo del Recibo */}
                <div className="space-y-8 relative z-10">
                    <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
                        <p className="text-lg leading-relaxed italic">
                            Recibimos de <span className="font-bold border-b-2 border-primary/20 not-italic uppercase">{receipt.currentAccount.customer.name}</span>
                            <br />
                            la cantidad de <span className="font-bold border-b-2 border-primary/20 not-italic">{formatCurrency(receipt.amount)}</span>
                        </p>
                        <p className="mt-4 text-base">
                            en concepto de: <span className="font-medium text-primary">{receipt.concept || "Cobro de cuenta corriente"}</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Medio de Pago</p>
                            <div className="inline-block px-3 py-1 bg-muted rounded-full text-sm font-bold uppercase tracking-wider">
                                {receipt.paymentMethod || "Efectivo"}
                            </div>
                        </div>
                        <div className="text-right flex flex-col justify-end items-end">
                            <div className="w-[200px] pt-8 border-t-2 border-primary/20 text-center">
                                <p className="text-sm font-bold uppercase tracking-widest text-primary">Firma y Sello</p>
                                <p className="text-[9px] text-muted-foreground uppercase leading-tight mt-1">Responsable del Comercio</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pie de página */}
                <div className="mt-20 pt-8 border-t border-primary/10 text-center text-[10px] text-muted-foreground uppercase tracking-widest">
                    Comprobante de operación interna • {receipt.currentAccount.tenant?.name}
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
