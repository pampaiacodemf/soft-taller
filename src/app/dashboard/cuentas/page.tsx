import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
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
import { Wallet, ArrowRight, User } from "lucide-react";

import { CuentasFilters } from "@/components/accounts/cuentas-filters";

export default async function CuentasPage({
    searchParams
}: {
    searchParams?: { query?: string };
}) {
    const session = await auth();
    if (!session) return null;

    const query = searchParams?.query || "";

    const accounts = await prisma.currentAccount.findMany({
        where: {
            tenantId: session.user.tenantId,
            customer: {
                name: { contains: query }
            }
        },
        include: { customer: true },
        orderBy: { balance: "desc" },
    });

    const totalDebt = accounts.reduce((sum, acc) => sum + (acc.balance > 0 ? acc.balance : 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Cuentas Corrientes</h1>
                    <p className="text-muted-foreground mt-1">
                        {accounts.length} cuentas {query && `encontradas para "${query}"`}
                    </p>
                </div>
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="py-2 px-4">
                        <p className="text-[10px] uppercase font-bold text-primary/70">
                            Total a Cobrar
                        </p>
                        <p className="text-xl font-black text-primary">
                            {formatCurrency(totalDebt)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <CuentasFilters />

            <Card>
                <CardContent className="pt-6">
                    {accounts.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Wallet className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p>No hay cuentas corrientes activas.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Contacto</TableHead>
                                    <TableHead className="text-right">Saldo</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {accounts.map((acc) => (
                                    <TableRow key={acc.id} className="group">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                                                    {acc.customer.name[0]}
                                                </div>
                                                <span className="font-medium">{acc.customer.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {acc.customer.phone || acc.customer.email || "—"}
                                        </TableCell>
                                        <TableCell className="text-right font-black text-lg">
                                            <span className={acc.balance > 0 ? "text-red-600" : "text-green-600"}>
                                                {formatCurrency(acc.balance)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/dashboard/cuentas/${acc.customerId}`}>
                                                    Ver Detalle
                                                    <ArrowRight className="w-4 h-4 ml-2" />
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
