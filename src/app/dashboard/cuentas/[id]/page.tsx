import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { notFound } from "next/navigation";
import { PaymentForm } from "@/components/accounts/payment-form";

export default async function DetalleCuentaPage({
    params,
}: {
    params: { id: string };
}) {
    const session = await auth();
    if (!session) return null;

    const account = await prisma.currentAccount.findUnique({
        where: {
            tenantId_customerId: {
                customerId: params.id,
                tenantId: session.user.tenantId,
            },
        },
        include: {
            customer: true,
            movements: {
                orderBy: { date: "desc" },
            },
        },
    });

    if (!account) return notFound();

    // Compute totals for summary cards
    const totalDebts = account.movements
        .filter((m) => m.type === "DEBT")
        .reduce((s, m) => s + m.amount, 0);
    const totalPaid = account.movements
        .filter((m) => m.type === "PAYMENT")
        .reduce((s, m) => s + m.amount, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/cuentas">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{account.customer.name}</h1>
                        <p className="text-muted-foreground text-sm">Cuenta corriente · {account.customer.phone || account.customer.email || "Sin contacto"}</p>
                    </div>
                </div>
                <PaymentForm customerId={params.id} currentBalance={account.balance} />
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className={account.balance > 0 ? "border-red-200 bg-red-50/50" : account.balance < 0 ? "border-green-200 bg-green-50/50" : ""}>
                    <CardContent className="pt-5">
                        <p className="text-xs uppercase font-bold text-muted-foreground">Saldo Actual</p>
                        <p className={`text-4xl font-black mt-1 ${account.balance > 0 ? "text-red-700" : account.balance < 0 ? "text-green-700" : "text-foreground"}`}>
                            {formatCurrency(Math.abs(account.balance))}
                        </p>
                        <p className="text-xs mt-2 opacity-70">
                            {account.balance > 0 ? "⚠️ El cliente debe dinero" : account.balance < 0 ? "✅ Saldo a favor del cliente" : "Saldo saldado"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-red-100">
                    <CardContent className="pt-5">
                        <p className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-1">
                            <ArrowUpRight className="w-3.5 h-3.5 text-red-500" /> Total Cargado (Deudas)
                        </p>
                        <p className="text-2xl font-black mt-1 text-red-700">{formatCurrency(totalDebts)}</p>
                        <p className="text-xs mt-2 opacity-70">{account.movements.filter(m => m.type === "DEBT").length} movimientos de deuda</p>
                    </CardContent>
                </Card>

                <Card className="border-green-100">
                    <CardContent className="pt-5">
                        <p className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-1">
                            <ArrowDownRight className="w-3.5 h-3.5 text-green-500" /> Total Cobrado (Pagos)
                        </p>
                        <p className="text-2xl font-black mt-1 text-green-700">{formatCurrency(totalPaid)}</p>
                        <p className="text-xs mt-2 opacity-70">{account.movements.filter(m => m.type === "PAYMENT").length} pagos recibidos</p>
                    </CardContent>
                </Card>
            </div>

            {/* Movements Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Historial de Movimientos
                    </CardTitle>
                    <Badge variant="outline">{account.movements.length} registros</Badge>
                </CardHeader>
                <CardContent className="p-0">
                    {account.movements.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>Sin movimientos registrados.</p>
                        </div>
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Concepto</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                                <TableHead className="text-right">Saldo Posterior</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {account.movements.map((move) => {
                                const isDebt = move.type === "DEBT";
                                const isPayment = move.type === "PAYMENT";
                                return (
                                    <TableRow key={move.id}>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDate(move.date)}
                                        </TableCell>
                                        <TableCell>
                                            {isDebt ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">
                                                    <ArrowUpRight className="w-3 h-3" /> Cargo
                                                </span>
                                            ) : isPayment ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200">
                                                    <ArrowDownRight className="w-3 h-3" /> Pago
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                                                    {move.type}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">{move.concept}</TableCell>
                                        <TableCell className="text-right">
                                            <span className={`font-bold ${isDebt ? "text-red-600" : "text-green-600"}`}>
                                                {isDebt ? "+" : "-"}{formatCurrency(move.amount)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right text-sm text-muted-foreground">
                                            {formatCurrency(move.balanceAfter)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
