import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, User, TrendingUp, TrendingDown, Receipt } from "lucide-react";
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
                        <p className="text-muted-foreground text-sm">Historial de movimientos</p>
                    </div>
                </div>
                <PaymentForm customerId={params.id} />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className={account.balance > 0 ? "border-red-200 bg-red-50/50" : "border-green-200 bg-green-50/50"}>
                    <CardContent className="pt-6">
                        <p className="text-xs uppercase font-bold text-muted-foreground">Saldo Actual</p>
                        <p className={`text-4xl font-black ${account.balance > 0 ? "text-red-700" : "text-green-700"}`}>
                            {formatCurrency(account.balance)}
                        </p>
                        <p className="text-xs mt-2 opacity-70">
                            {account.balance > 0 ? "El cliente debe dinero" : "Saldo a favor del cliente"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Movimientos Recientes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Concepto</TableHead>
                                    <TableHead className="text-right">Monto</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {account.movements.map((move) => (
                                    <TableRow key={move.id}>
                                        <TableCell className="text-xs">
                                            {formatDate(move.date)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{move.concept}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">
                                                    {move.type}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className={`font-bold ${move.type === "DEBT" ? "text-red-600" : "text-green-600"}`}>
                                                {move.type === "DEBT" ? "+" : "-"} {formatCurrency(move.amount)}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
