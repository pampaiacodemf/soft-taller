"use client";

import { useState, useTransition, useRef } from "react";
import {
    Search, ShoppingCart, Trash2, Plus, Minus, Receipt, Loader2,
    ScanBarcode, Banknote, CreditCard, Landmark, FileText, AlertCircle,
    ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import { createSale } from "@/lib/actions/sales";
import { useRouter } from "next/navigation";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { cn } from "@/lib/utils";

interface POSProps {
    products: any[];
    customers: any[];
}

type PaymentMethodKey = "CASH" | "TRANSFER" | "DEBIT" | "CREDIT" | "CURRENT_ACCOUNT";

interface PaymentLine {
    id: number;
    method: PaymentMethodKey;
    amount: string;
}

const PAYMENT_METHODS: { value: PaymentMethodKey; label: string; icon: React.ReactNode; iconColor: string }[] = [
    { value: "CASH",            label: "Efectivo",         icon: <Banknote   className="w-3.5 h-3.5" />, iconColor: "text-green-600" },
    { value: "TRANSFER",        label: "Transferencia",    icon: <Landmark   className="w-3.5 h-3.5" />, iconColor: "text-blue-600" },
    { value: "DEBIT",           label: "Débito",           icon: <CreditCard className="w-3.5 h-3.5" />, iconColor: "text-purple-600" },
    { value: "CREDIT",          label: "Crédito",          icon: <CreditCard className="w-3.5 h-3.5" />, iconColor: "text-orange-600" },
    { value: "CURRENT_ACCOUNT", label: "Cta. Corriente",   icon: <FileText   className="w-3.5 h-3.5" />, iconColor: "text-slate-600" },
];

export function POS({ products: initialProducts, customers }: POSProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [cart, setCart] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [invoiceType, setInvoiceType] = useState<"A" | "B" | "C">("B");
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Split payment state
    const [payments, setPayments] = useState<PaymentLine[]>([
        { id: 1, method: "CASH", amount: "" },
    ]);

    // ── Cart logic ────────────────────────────────────────────────────────
    const filteredProducts = initialProducts.filter(
        (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search)
    );

    const addToCart = (product: any) => {
        if (product.stock <= 0) {
            toast({ title: "Sin stock", variant: "destructive" });
            return;
        }
        const existing = cart.find((item) => item.id === product.id);
        if (existing) {
            if (existing.qty >= product.stock) {
                toast({ title: "Sin stock suficiente", variant: "destructive" });
                return;
            }
            setCart(cart.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
        } else {
            setCart([...cart, { ...product, qty: 1 }]);
        }
        setSearch("");
        searchInputRef.current?.focus();
    };

    const removeFromCart = (id: string) => setCart(cart.filter((item) => item.id !== id));

    const updateQty = (id: string, delta: number) => {
        setCart(
            cart.map((item) => {
                if (item.id === id) {
                    const newQty = item.qty + delta;
                    if (newQty <= 0) return null;
                    if (newQty > item.stock) return item;
                    return { ...item, qty: newQty };
                }
                return item;
            }).filter(Boolean)
        );
    };

    const total = cart.reduce((sum, item) => sum + item.salePrice * item.qty, 0);

    // ── Payment split logic ────────────────────────────────────────────────
    const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const remaining = total - totalPaid;
    const isPaidExactly = Math.abs(remaining) < 0.01;
    const isOverpaid = totalPaid > total + 0.01;

    const addPaymentLine = () => {
        const usedMethods = payments.map((p) => p.method);
        const nextMethod = PAYMENT_METHODS.find((m) => !usedMethods.includes(m.value))?.value || "CASH";
        setPayments((prev) => [...prev, { id: Date.now(), method: nextMethod, amount: "" }]);
    };

    const removePaymentLine = (id: number) => {
        if (payments.length === 1) return;
        setPayments((prev) => prev.filter((p) => p.id !== id));
    };

    const updateLine = (id: number, field: "method" | "amount", value: string) => {
        setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    };

    const fillRemaining = (id: number) => {
        const otherPaid = payments.filter((p) => p.id !== id).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
        const rem = Math.max(0, total - otherPaid);
        updateLine(id, "amount", rem.toFixed(2));
    };

    // When total changes, fill single payment if there's only one line
    const syncSinglePayment = () => {
        if (payments.length === 1 && !payments[0].amount) {
            setPayments([{ ...payments[0], amount: total.toFixed(2) }]);
        }
    };

    // ── Checkout ──────────────────────────────────────────────────────────
    const handleFinishSale = () => {
        if (cart.length === 0) return;
        if (!selectedCustomer) {
            toast({ title: "Error", description: "Seleccioná un cliente.", variant: "destructive" });
            return;
        }
        if (!isPaidExactly || isOverpaid) {
            toast({ title: "Error", description: "El total de los pagos no coincide con el monto de la venta.", variant: "destructive" });
            return;
        }

        const paymentSplit = payments
            .filter((p) => parseFloat(p.amount) > 0)
            .map((p) => ({ method: p.method, amount: parseFloat(p.amount) }));

        // Primary method = largest amount
        const primaryMethod = paymentSplit.reduce((a, b) => a.amount >= b.amount ? a : b).method;

        startTransition(async () => {
            try {
                const result = await createSale({
                    customerId: selectedCustomer,
                    items: cart.map((i) => ({
                        productId: i.id,
                        qty: i.qty,
                        price: i.salePrice,
                        iva: i.ivaRate,
                    })),
                    type: invoiceType,
                    paymentMethod: primaryMethod as any,
                    total,
                    paymentSplit,
                });

                if (result.error) {
                    toast({ title: "Error en la venta", description: result.error, variant: "destructive" });
                    return;
                }

                if (result.success && result.invoiceId) {
                    const methodSummary = paymentSplit
                        .map((p) => {
                            const m = PAYMENT_METHODS.find((m) => m.value === p.method);
                            return `${m?.label}: ${formatCurrency(p.amount)}`;
                        })
                        .join(" · ");

                    toast({ title: "✅ Venta realizada", description: methodSummary });
                    setCart([]);
                    setSelectedCustomer("");
                    setPayments([{ id: 1, method: "CASH", amount: "" }]);
                    router.refresh();
                    window.open(`/dashboard/ventas/ticket/${result.invoiceId}`, "_blank");
                }
            } catch (err) {
                toast({ title: "Error", description: String(err), variant: "destructive" });
            }
        });
    };

    const handleScan = (code: string) => {
        const product = initialProducts.find((p) => p.barcode === code);
        if (product) {
            addToCart(product);
        } else {
            toast({ title: "No encontrado", description: `Código: ${code}`, variant: "destructive" });
        }
    };

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)]">
            {/* ── Left: Product Selection ── */}
            <div className="lg:col-span-7 flex flex-col gap-4 overflow-hidden">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            ref={searchInputRef}
                            placeholder="Buscar por nombre o código de barras..."
                            className="pl-9 h-12"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && filteredProducts.length === 1) {
                                    addToCart(filteredProducts[0]);
                                }
                            }}
                        />
                    </div>
                    <Button size="icon" variant="outline" className="h-12 w-12" onClick={() => setIsScannerOpen(true)}>
                        <ScanBarcode className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-1">
                    {filteredProducts.map((p) => (
                        <Card
                            key={p.id}
                            className={`cursor-pointer hover:border-primary transition-all active:scale-95 ${p.stock <= 0 ? "opacity-50 grayscale" : ""}`}
                            onClick={() => addToCart(p)}
                        >
                            <CardContent className="p-3 space-y-2">
                                <div className="flex justify-between items-start gap-2">
                                    <p className="font-semibold text-sm leading-tight line-clamp-2">{p.name}</p>
                                    <Badge variant={p.stock < 5 ? "destructive" : "secondary"}>{p.stock}</Badge>
                                </div>
                                <p className="text-xl font-black text-primary">{formatCurrency(p.salePrice)}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">{p.barcode || "Sin EAN"}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* ── Right: Cart + Payment ── */}
            <div className="lg:col-span-5 flex flex-col gap-4">
                <Card className="flex-1 flex flex-col overflow-hidden">
                    {/* Cart header */}
                    <CardHeader className="py-3 border-b flex flex-row justify-between items-center shrink-0">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5" /> Carrito
                        </CardTitle>
                        <Badge variant="outline">{cart.length} items</Badge>
                    </CardHeader>

                    {/* Cart items */}
                    <CardContent className="flex-1 overflow-y-auto p-0 min-h-0">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2 p-12">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                    <ShoppingCart className="w-6 h-6 opacity-20" />
                                </div>
                                <p className="text-sm">Carrito vacío</p>
                                <p className="text-xs">Hacé click en un producto para agregarlo</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {cart.map((item) => (
                                    <div key={item.id} className="p-3 flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium leading-tight truncate">{item.name}</p>
                                            <p className="text-xs text-primary font-bold mt-0.5">
                                                {formatCurrency(item.salePrice)} × {item.qty} = {formatCurrency(item.salePrice * item.qty)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 border rounded-lg bg-muted/50 p-0.5">
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQty(item.id, -1)}>
                                                <Minus className="w-3 h-3" />
                                            </Button>
                                            <span className="text-xs font-bold w-5 text-center">{item.qty}</span>
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQty(item.id, 1)} disabled={item.qty >= item.stock}>
                                                <Plus className="w-3 h-3" />
                                            </Button>
                                        </div>
                                        <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive h-7 w-7 shrink-0" onClick={() => removeFromCart(item.id)}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>

                    {/* Checkout panel */}
                    <div className="p-3 border-t bg-muted/20 space-y-3 shrink-0">
                        {/* Customer + Invoice type */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold opacity-70">Cliente</Label>
                                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                                    <SelectTrigger className="bg-background h-9 text-sm">
                                        <SelectValue placeholder="Consumidor Final" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customers.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold opacity-70">Comprobante</Label>
                                <Select value={invoiceType} onValueChange={(v: any) => setInvoiceType(v)}>
                                    <SelectTrigger className="bg-background h-9 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="B">Fact. B — Consumidor</SelectItem>
                                        <SelectItem value="A">Fact. A — Resp. Inscripto</SelectItem>
                                        <SelectItem value="C">Fact. C — Monotributo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Total display */}
                        <div className="flex items-center justify-between px-1">
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total</p>
                            <p className="text-2xl font-black text-primary">{formatCurrency(total)}</p>
                        </div>

                        {/* ── Split payment section ── */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] uppercase font-bold opacity-70">Medios de Pago</Label>
                                <div className={cn(
                                    "text-xs font-bold px-2 py-0.5 rounded-full",
                                    isPaidExactly ? "bg-green-100 text-green-700" :
                                    isOverpaid   ? "bg-red-100 text-red-700" :
                                                   "bg-amber-100 text-amber-700"
                                )}>
                                    {isPaidExactly ? "✓ Completo" :
                                     isOverpaid   ? `Excede ${formatCurrency(totalPaid - total)}` :
                                                    `Falta ${formatCurrency(remaining)}`}
                                </div>
                            </div>

                            {payments.map((p) => {
                                const meta = PAYMENT_METHODS.find((m) => m.value === p.method);
                                return (
                                    <div key={p.id} className="flex gap-1.5 items-center">
                                        <Select value={p.method} onValueChange={(v) => updateLine(p.id, "method", v)}>
                                            <SelectTrigger className="h-8 text-xs bg-background flex-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PAYMENT_METHODS.map((m) => (
                                                    <SelectItem key={m.value} value={m.value}>
                                                        <span className={cn("flex items-center gap-1.5", m.iconColor)}>
                                                            {m.icon} {m.label}
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <div className="relative w-28">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={p.amount}
                                                onChange={(e) => updateLine(p.id, "amount", e.target.value)}
                                                placeholder="0.00"
                                                className="h-8 text-xs pl-5 pr-1 bg-background"
                                            />
                                        </div>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-xs text-primary shrink-0"
                                            title="Completar con el monto restante"
                                            onClick={() => fillRemaining(p.id)}
                                        >
                                            Max
                                        </Button>

                                        {payments.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-destructive shrink-0"
                                                onClick={() => removePaymentLine(p.id)}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}

                            {payments.length < PAYMENT_METHODS.length && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-7 text-xs"
                                    onClick={addPaymentLine}
                                >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Agregar otro medio de pago
                                </Button>
                            )}

                            {isOverpaid && (
                                <div className="flex items-center gap-1.5 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    El total ingresado supera el monto de la venta.
                                </div>
                            )}
                        </div>

                        {/* Finish button */}
                        <Button
                            className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20"
                            onClick={handleFinishSale}
                            disabled={cart.length === 0 || isPending || !isPaidExactly || isOverpaid || !selectedCustomer}
                        >
                            {isPending ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Facturando...</>
                            ) : (
                                <><Receipt className="mr-2 h-5 w-5" /> FINALIZAR VENTA</>
                            )}
                        </Button>
                    </div>
                </Card>
            </div>

            <BarcodeScanner open={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScan={handleScan} />
        </div>
    );
}
