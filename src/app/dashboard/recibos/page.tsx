import { getReceipts } from "@/lib/actions/receipts";
import { Receipt, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Recibos de Cobro" };

import { SearchInput } from "@/components/ui/search-input";
import { FilterTabs } from "@/components/ui/filter-tabs";

export default async function RecibosPage({
    searchParams,
}: {
    searchParams?: { q?: string; method?: string };
}) {
    const search = searchParams?.q || "";
    const methodFilter = searchParams?.method || "";
    
    let receipts = await getReceipts(search);

    if (methodFilter) {
        receipts = (receipts as any[]).filter(r => r.paymentMethod === methodFilter);
    }

    const PAYMENT_METHODS = {
        "CASH": "Efectivo",
        "TRANSFER": "Transferencia",
        "CREDIT": "Tarjeta Crédito",
        "DEBIT": "Tarjeta Débito",
        "CURRENT_ACCOUNT": "Cuenta Corriente"
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Recibos de Cobro</h1>
                    <p className="text-muted-foreground mt-1">
                        Historial de pagos en cuentas corrientes
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <SearchInput placeholder="Número o cliente..." className="w-full sm:w-80" />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 overflow-x-auto scrollbar-hide">
                    <FilterTabs 
                        paramName="method" 
                        options={PAYMENT_METHODS} 
                        allLabel="Todos los medios"
                    />
                </div>
                <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-100 flex-shrink-0">
                    <p className="text-xs font-semibold text-green-600 uppercase">Total Cobrado</p>
                    <p className="text-xl font-bold text-green-700">{formatCurrency((receipts as any[]).reduce((sum, r) => sum + r.amount, 0))}</p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {receipts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <Receipt className="w-12 h-12 mb-4 opacity-30" />
                            <p className="font-medium">No hay recibos generados</p>
                            <p className="text-sm mt-1">
                                Los recibos aparecerán aquí cuando registres un pago en la cuenta corriente de un cliente.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Nro. Recibo</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Concepto</TableHead>
                                    <TableHead className="text-right">Monto Percibido</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {receipts.map((receipt) => (
                                    <TableRow key={receipt.id}>
                                        <TableCell className="whitespace-nowrap text-sm">
                                            {formatDate(receipt.date)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-mono text-sm font-medium">
                                                RC-{receipt.receiptNumber.toString().padStart(8, '0')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium text-sm">
                                                {receipt.currentAccount.customer.name}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm">
                                                {receipt.concept || "Cobro de cuenta corriente"}
                                            </p>
                                            {receipt.paymentMethod && (
                                                <Badge variant="outline" className="mt-1 text-[10px] uppercase">
                                                    {receipt.paymentMethod.replace(/_/g, " ")}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right text-green-600 font-bold">
                                            +{formatCurrency(receipt.amount)}
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
