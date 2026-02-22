import { getInvoices } from "@/lib/actions/invoices";
import { FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Metadata } from "next";

import { FacturacionFilters } from "@/components/invoices/facturacion-filters";

export const metadata: Metadata = { title: "Facturación" };

const getInvoiceTypeColor = (type: string) => {
    switch (type) {
        case "A": return "bg-blue-100 text-blue-800";
        case "B": return "bg-green-100 text-green-800";
        case "C": return "bg-orange-100 text-orange-800";
        default: return "bg-gray-100 text-gray-800";
    }
};

export default async function FacturacionPage({
    searchParams,
}: {
    searchParams?: { q?: string; tipo?: "A" | "B" | "C" };
}) {
    const search = searchParams?.q || "";
    const type = (searchParams?.tipo === "all" ? undefined : searchParams?.tipo) as any;
    const invoices = await getInvoices(search, type);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Facturación</h1>
                    <p className="text-muted-foreground mt-1">
                        {invoices.length} comprobantes emitidos {search && `encontrados para "${search}"`}
                    </p>
                </div>
            </div>

            <FacturacionFilters />

            <Card>
                <CardContent className="pt-6">
                    {invoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <FileText className="w-12 h-12 mb-4 opacity-30" />
                            <p className="font-medium">No hay facturas emitidas</p>
                            <p className="text-sm mt-1">Las facturas aparecerán aquí al registrar una venta.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Comprobante</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>CAE / AFIP</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="w-[60px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.map((inv) => (
                                    <TableRow key={inv.id}>
                                        <TableCell className="whitespace-nowrap">
                                            {formatDate(inv.invoiceDate)}
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium">{inv.customer.name}</p>
                                            <p className="text-xs text-muted-foreground">{inv.customer.cuit || inv.customer.dni || "Consumidor Final"}</p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-mono text-sm">
                                                {inv.puntoVenta.toString().padStart(4, '0')}-{inv.invoiceNumber.toString().padStart(8, '0')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getInvoiceTypeColor(inv.invoiceType)}>
                                                Factura {inv.invoiceType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs">
                                                <p className="font-mono font-medium">{inv.afipCae || "Pendiente"}</p>
                                                {inv.afipCaeExpiry && (
                                                    <p className="text-muted-foreground">Vto: {new Date(inv.afipCaeExpiry).toLocaleDateString("es-AR")}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            {formatCurrency(inv.total)}
                                            <p className="text-[10px] text-muted-foreground font-normal uppercase mt-1">
                                                {inv.paymentMethod.replace(/_/g, " ")}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" asChild title="Imprimir Comprobante">
                                                <a href={`/dashboard/ventas/ticket/${inv.id}`} target="_blank" rel="noopener noreferrer">
                                                    <FileText className="w-4 h-4 text-primary" />
                                                </a>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
