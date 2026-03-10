import { getCurrentShift, getLastClosedShift } from "@/lib/actions/cash";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
    DollarSign, ArrowUpRight, ArrowDownRight, Wallet, Lock, Unlock, Clock,
    Banknote, CreditCard, Landmark, FileText, TrendingUp, TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { OpenShiftButton } from "./open-shift-button";
import { CloseShiftButton } from "./close-shift-button";
import { ManualMovementButton } from "./manual-movement-button";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Caja" };

// ── helpers ────────────────────────────────────────────────────────────────
const METHOD_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    CASH:     { label: "Efectivo",       icon: <Banknote   className="w-4 h-4" />, color: "text-green-700",  bg: "bg-green-50 border-green-200" },
    TRANSFER: { label: "Transferencia",  icon: <Landmark   className="w-4 h-4" />, color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
    DEBIT:    { label: "Débito",         icon: <CreditCard className="w-4 h-4" />, color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
    CREDIT:   { label: "Crédito",        icon: <CreditCard className="w-4 h-4" />, color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
    CURRENT_ACCOUNT: { label: "Cta. Corriente", icon: <FileText className="w-4 h-4" />, color: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
};

export default async function CajaPage() {
    const currentShiftResult = await getCurrentShift();
    const currentShift = currentShiftResult.success ? currentShiftResult.shift : null;
    const lastShift = !currentShift ? await getLastClosedShift() : null;

    // ── Calculate totals ─────────────────────────────────────────────────
    let totalIn = 0;
    let totalOut = 0;

    // Breakdown by method: separate IN and OUT
    const methodIn: Record<string, number> = {};
    const methodOut: Record<string, number> = {};

    if (currentShift) {
        currentShift.movements.forEach((m: any) => {
            if (m.type === "IN") {
                totalIn += Number(m.amount);
                methodIn[m.method] = (methodIn[m.method] || 0) + Number(m.amount);
            } else {
                totalOut += Number(m.amount);
                methodOut[m.method] = (methodOut[m.method] || 0) + Number(m.amount);
            }
        });
    }

    // Expected cash in drawer = initial + all CASH IN - all CASH OUT
    const cashInDrawer =
        Number(currentShift?.initialCash || 0)
        + (methodIn["CASH"] || 0)
        - (methodOut["CASH"] || 0);

    // Net total (all income minus all expenses)
    const netBalance = totalIn - totalOut;

    // All methods with any movement
    const allMethods = Array.from(
        new Set([...Object.keys(methodIn), ...Object.keys(methodOut)])
    );

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Wallet className="w-8 h-8 text-primary" />
                        Caja Principal
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Control de turnos, ingresos y egresos diarios por medio de pago
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {currentShift && (
                        <ManualMovementButton shiftId={currentShift.id} />
                    )}
                    <div>
                        {currentShift ? (
                            <CloseShiftButton shiftId={currentShift.id} expectedCash={cashInDrawer} />
                        ) : (
                            <OpenShiftButton previousCash={Number(lastShift?.finalCash || lastShift?.initialCash || 0)} />
                        )}
                    </div>
                </div>
            </div>

            {/* ── Status Banner ── */}
            <Card className={currentShift ? "border-green-200 bg-green-50/50" : "border-orange-200 bg-orange-50/30"}>
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
                                        Abierta a las{" "}
                                        {new Date(currentShift.openedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                                        {" "}por {(currentShift as any).openedBy?.name}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-2 bg-orange-100 text-orange-700 rounded-full">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-orange-800 uppercase tracking-wider">Caja Cerrada</p>
                                    <p className="text-xs text-orange-700/80">
                                        {lastShift
                                            ? `Último cierre: ${formatDate(lastShift.closedAt!)} · Efectivo final: ${formatCurrency(Number(lastShift.finalCash || 0))}`
                                            : "Abrí la caja para empezar a operar"}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                    {currentShift && (
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Efectivo Estimado en Caja</p>
                            <p className="text-2xl font-black text-green-700">{formatCurrency(cashInDrawer)}</p>
                            <p className="text-xs text-muted-foreground">Fondo inicial: {formatCurrency(Number(currentShift.initialCash))}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {currentShift && (
                <>
                    {/* ── Summary metrics ── */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-green-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-green-700">Total Ingresos</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">+{formatCurrency(totalIn)}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {currentShift.movements.filter((m: any) => m.type === "IN").length} movimientos
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-red-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-red-700">Total Egresos</CardTitle>
                                <TrendingDown className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">-{formatCurrency(totalOut)}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {currentShift.movements.filter((m: any) => m.type === "OUT").length} movimientos
                                </p>
                            </CardContent>
                        </Card>

                        <Card className={netBalance >= 0 ? "border-primary/20" : "border-red-300"}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Balance Neto del Turno</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className={cn("text-2xl font-bold", netBalance >= 0 ? "text-primary" : "text-red-600")}>
                                    {netBalance >= 0 ? "+" : ""}{formatCurrency(netBalance)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">ingresos − egresos del turno</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Movimientos</CardTitle>
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{currentShift.movements.length}</div>
                                <p className="text-xs text-muted-foreground mt-1">en este turno</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Breakdown by payment method ── */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-primary" />
                                Desglose por Medio de Pago
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {allMethods.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">Sin movimientos en este turno.</p>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {allMethods.map((mKey) => {
                                        const meta = METHOD_META[mKey] || { label: mKey, icon: <DollarSign className="w-4 h-4" />, color: "text-slate-700", bg: "bg-slate-50 border-slate-200" };
                                        const inAmt = methodIn[mKey] || 0;
                                        const outAmt = methodOut[mKey] || 0;
                                        const net = inAmt - outAmt;
                                        return (
                                            <div key={mKey} className={`p-4 rounded-xl border ${meta.bg}`}>
                                                <div className={`flex items-center gap-2 mb-3 font-semibold ${meta.color}`}>
                                                    {meta.icon}
                                                    {meta.label}
                                                </div>
                                                <div className="space-y-1 text-sm">
                                                    {inAmt > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground flex items-center gap-1">
                                                                <ArrowUpRight className="w-3 h-3 text-green-500" /> Ingresos
                                                            </span>
                                                            <span className="font-bold text-green-600">+{formatCurrency(inAmt)}</span>
                                                        </div>
                                                    )}
                                                    {outAmt > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground flex items-center gap-1">
                                                                <ArrowDownRight className="w-3 h-3 text-red-500" /> Egresos
                                                            </span>
                                                            <span className="font-bold text-red-600">-{formatCurrency(outAmt)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between border-t border-current/10 pt-1 mt-1">
                                                        <span className="text-muted-foreground font-medium">Neto</span>
                                                        <span className={cn("font-bold", net >= 0 ? meta.color : "text-red-600")}>
                                                            {net >= 0 ? "+" : ""}{formatCurrency(net)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ── Movements Table ── */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Detalle de Movimientos del Turno</CardTitle>
                            <Badge variant="outline">{currentShift.movements.length} registros</Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            {currentShift.movements.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">
                                    <Wallet className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                    <p>No hay movimientos registrados aún.</p>
                                    <p className="text-sm mt-1">Los cobros de ventas y órdenes aparecerán aquí automáticamente.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Hora</TableHead>
                                            <TableHead>Concepto</TableHead>
                                            <TableHead>Medio</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead className="text-right">Ingreso</TableHead>
                                            <TableHead className="text-right">Egreso</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(currentShift.movements as any[]).map((m) => {
                                            const meta = METHOD_META[m.method] || { label: m.method, icon: null, color: "text-slate-700", bg: "" };
                                            return (
                                                <TableRow key={m.id}>
                                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {new Date(m.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                                                    </TableCell>
                                                    <TableCell className="font-medium max-w-[220px] truncate" title={m.concept}>
                                                        {m.concept}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${meta.bg} ${meta.color}`}>
                                                            {meta.icon}
                                                            {meta.label}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {m.type === "IN" ? (
                                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                                                <ArrowUpRight className="w-3 h-3" /> Ingreso
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                                                <ArrowDownRight className="w-3 h-3" /> Egreso
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-green-600">
                                                        {m.type === "IN" ? `+${formatCurrency(Number(m.amount))}` : ""}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-red-600">
                                                        {m.type === "OUT" ? `-${formatCurrency(Number(m.amount))}` : ""}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            {/* ── Shift closed / no movements ── */}
            {!currentShift && (
                <Card className="border-dashed">
                    <CardContent className="py-16 text-center text-muted-foreground">
                        <Lock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">La caja está cerrada</p>
                        <p className="text-sm mt-1">
                            Abrí el turno para comenzar a registrar ventas, cobros y movimientos.
                        </p>
                        {lastShift && (
                            <div className="mt-6 inline-flex gap-6 text-sm">
                                <div>
                                    <p className="text-xs uppercase tracking-wider mb-1">Último cierre</p>
                                    <p className="font-semibold">{formatDate(lastShift.closedAt!)}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wider mb-1">Efectivo final</p>
                                    <p className="font-semibold">{formatCurrency(Number(lastShift.finalCash || 0))}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
