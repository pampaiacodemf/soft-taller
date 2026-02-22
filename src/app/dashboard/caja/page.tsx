import { getCurrentShift, getLastClosedShift } from "@/lib/actions/cash";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign, ArrowUpRight, ArrowDownRight, Wallet, Lock, Unlock, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { OpenShiftButton } from "./open-shift-button";
import { CloseShiftButton } from "./close-shift-button";
import type { Metadata } from "next";

import { CajaFilters } from "@/components/cash/caja-filters";

export const metadata: Metadata = { title: "Caja Fuerte" };

interface CajaPageProps {
    searchParams: {
        method?: string;
        type?: string;
    };
}

export default async function CajaPage({ searchParams }: CajaPageProps) {
    const currentShiftResult = await getCurrentShift();
    const currentShift = currentShiftResult.success ? currentShiftResult.shift : null;
    const lastShift = !currentShift ? await getLastClosedShift() : null;

    const filterMethod = searchParams.method === "all" ? undefined : searchParams.method;
    const filterType = searchParams.type === "all" ? undefined : searchParams.type;

    // Filter movements in-memory for the current shift view
    const filteredMovements = currentShift?.movements.filter(m => {
        const matchesMethod = !filterMethod || m.method === filterMethod;
        const matchesType = !filterType || m.type === filterType;
        return matchesMethod && matchesType;
    }) || [];

    // Calculate totals for active shift
    let totalIn = 0;
    let totalOut = 0;

    // Group by method
    const methodTotals: Record<string, number> = {
        CASH: 0,
        TRANSFER: 0,
        CREDIT: 0,
        DEBIT: 0,
    };

    if (currentShift) {
        currentShift.movements.forEach(m => {
            if (m.type === "IN") {
                totalIn += m.amount;
                methodTotals[m.method] = (methodTotals[m.method] || 0) + m.amount;
            } else {
                totalOut += m.amount;
                // Expenses are mostly cash, subtract from cash
                if (m.method === "CASH") {
                    methodTotals["CASH"] -= m.amount;
                }
            }
        });
    }

    const currentCashExpected = (currentShift?.initialCash || 0) + (methodTotals["CASH"] || 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Wallet className="w-8 h-8 text-primary" />
                        Caja Principal
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Control de turnos, ingresos y egresos diarios
                    </p>
                </div>
                <div>
                    {currentShift ? (
                        <CloseShiftButton
                            shiftId={currentShift.id}
                            expectedCash={currentCashExpected}
                        />
                    ) : (
                        <OpenShiftButton previousCash={lastShift?.finalCash || lastShift?.initialCash || 0} />
                    )}
                </div>
            </div>

            {/* Shift Status Banner */}
            <Card className={currentShift ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}>
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {currentShift ? (
                            <>
                                <div className="p-2 bg-green-100 text-green-700 rounded-full">
                                    <Unlock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-green-800 uppercase tracking-wider">Caja Abierta</p>
                                    <p className="text-xs text-green-700/80 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Abierta hoy a las {new Date(currentShift.openedAt).toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit' })} por {currentShift.openedBy.name}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-2 bg-red-100 text-red-700 rounded-full">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-red-800 uppercase tracking-wider">Caja Cerrada</p>
                                    <p className="text-xs text-red-700/80">
                                        {lastShift ? `Último cierre: ${formatDate(lastShift.closedAt!)}` : "Abre la caja para empezar operar hoy"}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                    {currentShift && (
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Efectivo en Caja</p>
                            <p className="text-2xl font-black text-green-700">{formatCurrency(currentCashExpected)}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {currentShift && (
                <>
                    {/* Metrics */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Fondo Inicial</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold">{formatCurrency(currentShift.initialCash)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                                <ArrowUpRight className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-green-600">+{formatCurrency(totalIn)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Egresos / Gastos</CardTitle>
                                <ArrowDownRight className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-red-600">-{formatCurrency(totalOut)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Transferencias</CardTitle>
                                <Wallet className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-blue-600">{formatCurrency(methodTotals["TRANSFER"] || 0)}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Movements Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Movimientos de Caja del Turno</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CajaFilters />
                            {filteredMovements.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No hay movimientos registrados en este turno aún.
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Hora</TableHead>
                                            <TableHead>Concepto</TableHead>
                                            <TableHead>Método</TableHead>
                                            <TableHead className="text-right">Ingreso</TableHead>
                                            <TableHead className="text-right">Egreso</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredMovements.map((m) => (
                                            <TableRow key={m.id}>
                                                <TableCell className="text-xs">
                                                    {new Date(m.createdAt).toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit' })}
                                                </TableCell>
                                                <TableCell className="font-medium">{m.concept}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] uppercase">
                                                        {m.method.replace(/_/g, " ")}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-green-600">
                                                    {m.type === "IN" ? `+${formatCurrency(m.amount)}` : ""}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-red-600">
                                                    {m.type === "OUT" ? `-${formatCurrency(m.amount)}` : ""}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
