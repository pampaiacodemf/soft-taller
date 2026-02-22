import { getReceipts } from "@/lib/actions/receipts";
import { Receipt, Search, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Recibos de Cobro" };

export default async function RecibosPage({
    searchParams,
}: {
    searchParams?: { q?: string };
}) {
    const search = searchParams?.q || "";
    const receipts = await getReceipts(search);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Recibos de Cobro</h1>
                    <p className="text-muted-foreground mt-1">
                        Historial de pagos en cuentas corrientes
                    </p>
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
                                    <TableHead className="text-right">Acciones</TableHead>
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
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="icon" asChild title="Imprimir Recibo">
                                                <Link href={`/dashboard/recibos/imprimir/${receipt.id}`} target="_blank">
                                                    <Printer className="w-4 h-4" />
                                                </Link>
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
