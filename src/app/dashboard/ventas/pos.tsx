"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
    Search,
    ShoppingCart,
    Trash2,
    Plus,
    Minus,
    User,
    CreditCard,
    Receipt,
    Loader2,
    ScanBarcode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, handleEnterKey } from "@/lib/utils";
import { createSale } from "@/lib/actions/sales";
import { useRouter } from "next/navigation";
import { BarcodeScanner } from "@/components/barcode-scanner";

interface POSProps {
    products: any[];
    customers: any[];
}

export function POS({ products: initialProducts, customers }: POSProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [cart, setCart] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [invoiceType, setInvoiceType] = useState<"A" | "B" | "C">("B");
    const [payments, setPayments] = useState<{ method: string; amount: number }[]>([
        { method: "CASH", amount: 0 }
    ]);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Default to "Consumidor Final" if found
    useEffect(() => {
        if (!selectedCustomer && customers.length > 0) {
            const defaultCustomer = customers.find(c => c.name.toLowerCase().includes("consumidor"));
            if (defaultCustomer) setSelectedCustomer(defaultCustomer.id);
        }
    }, [customers, selectedCustomer]);

    const filteredProducts = initialProducts.filter(
        (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.barcode?.includes(search)
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
            setCart(
                cart.map((item) =>
                    item.id === product.id ? { ...item, qty: item.qty + 1 } : item
                )
            );
        } else {
            setCart([...cart, { ...product, qty: 1 }]);
        }
        setSearch("");
        searchInputRef.current?.focus();
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter((item) => item.id !== id));
    };

    const updateQty = (id: string, delta: number) => {
        setCart(
            cart
                .map((item) => {
                    if (item.id === id) {
                        const newQty = item.qty + delta;
                        if (newQty <= 0) return null;
                        if (newQty > item.stock) return item;
                        return { ...item, qty: newQty };
                    }
                    return item;
                })
                .filter(Boolean)
        );
    };

    const subtotal = cart.reduce((sum, item) => sum + item.salePrice * item.qty, 0);
    const total = subtotal; // Simplified for this POS

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    const handleFinishSale = () => {
        if (cart.length === 0) return;
        if (!selectedCustomer) {
            toast({ title: "Error", description: "Seleccioná un cliente", variant: "destructive" });
            return;
        }

        if (Math.abs(totalPaid - total) > 0.01) {
            toast({
                title: "Error de pago",
                description: `El total de los pagos (${formatCurrency(totalPaid)}) debe coincidir con el total de la venta (${formatCurrency(total)})`,
                variant: "destructive"
            });
            return;
        }

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
                    payments: payments as any,
                    total,
                });

                if (result.error) {
                    toast({ title: "Error en la venta", description: result.error, variant: "destructive" });
                    return;
                }

                if (result.success && result.invoiceId) {
                    toast({ title: "Venta realizada", description: "Factura generada con éxito." });
                    setCart([]);
                    setSelectedCustomer("");
                    setPayments([{ method: "CASH", amount: 0 }]);
                    router.refresh();

                    window.open(`/dashboard/ventas/ticket/${result.invoiceId}`, '_blank');
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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)]">
            {/* Left: Product Selection */}
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
                    <Button
                        size="icon"
                        variant="outline"
                        className="h-12 w-12"
                        onClick={() => setIsScannerOpen(true)}
                    >
                        <ScanBarcode className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-1">
                    {filteredProducts.map((p) => (
                        <Card
                            key={p.id}
                            className={`cursor-pointer hover:border-primary transition-all active:scale-95 ${p.stock <= 0 ? "opacity-50 grayscale" : ""
                                }`}
                            onClick={() => addToCart(p)}
                        >
                            <CardContent className="p-3 space-y-2">
                                <div className="flex justify-between items-start gap-2">
                                    <p className="font-semibold text-sm leading-tight line-clamp-2">
                                        {p.name}
                                    </p>
                                    <Badge variant={p.stock < 5 ? "destructive" : "secondary"}>
                                        {p.stock}
                                    </Badge>
                                </div>
                                <p className="text-xl font-black text-primary">
                                    {formatCurrency(p.salePrice)}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-mono">
                                    {p.barcode || "Sin EAN"}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Right: Cart and Total */}
            <div className="lg:col-span-5 flex flex-col gap-4">
                <Card className="flex-1 flex flex-col overflow-hidden">
                    <CardHeader className="py-3 border-b flex flex-row justify-between items-center">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5" /> Carrito
                        </CardTitle>
                        <Badge variant="outline">{cart.length} items</Badge>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-0">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2 p-12">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                    <ShoppingCart className="w-6 h-6 opacity-20" />
                                </div>
                                <p className="text-sm">Carrito vacío</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {cart.map((item) => (
                                    <div key={item.id} className="p-3 flex items-center gap-3">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium leading-tight">
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-primary font-bold mt-1">
                                                {formatCurrency(item.salePrice)} x {item.qty}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 border rounded-lg bg-muted/50 p-1">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7"
                                                onClick={() => updateQty(item.id, -1)}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </Button>
                                            <span className="text-xs font-bold w-6 text-center">
                                                {item.qty}
                                            </span>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7"
                                                onClick={() => updateQty(item.id, 1)}
                                                disabled={item.qty >= item.stock}
                                            >
                                                <Plus className="w-3 h-3" />
                                            </Button>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-muted-foreground hover:text-destructive h-8 w-8"
                                            onClick={() => removeFromCart(item.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                    <div className="p-4 border-t bg-muted/20 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold opacity-70">
                                    Cliente
                                </Label>
                                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Consumidor Final" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customers.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold opacity-70">
                                    Comprobante
                                </Label>
                                <Select
                                    value={invoiceType}
                                    onValueChange={(v: any) => setInvoiceType(v)}
                                >
                                    <SelectTrigger className="bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="B">Tipo B (Consumidor)</SelectItem>
                                        <SelectItem value="A">Tipo A (Responsable)</SelectItem>
                                        <SelectItem value="C">Tipo C (Monotributo)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] uppercase font-bold opacity-70">
                                    Pagos / Medios de Pago
                                </Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[10px] gap-1"
                                    onClick={() => setPayments([...payments, { method: "CASH", amount: 0 }])}
                                >
                                    <Plus className="w-3 h-3" /> Agregar Pago
                                </Button>
                            </div>

                            <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                                {payments.map((p, index) => (
                                    <div key={index} className="flex gap-2 items-end group">
                                        <div className="flex-1">
                                            <Select
                                                value={p.method}
                                                onValueChange={(v) => {
                                                    const newPayments = [...payments];
                                                    newPayments[index].method = v;
                                                    setPayments(newPayments);
                                                }}
                                            >
                                                <SelectTrigger className="h-9 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="CASH">Efectivo</SelectItem>
                                                    <SelectItem value="DEBIT">Dédito</SelectItem>
                                                    <SelectItem value="CREDIT">Crédito</SelectItem>
                                                    <SelectItem value="TRANSFER">Transferencia</SelectItem>
                                                    <SelectItem value="CURRENT_ACCOUNT">Cta. Cte.</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-[120px]">
                                            <Input
                                                type="number"
                                                className="h-9 text-xs"
                                                value={p.amount}
                                                onChange={(e) => {
                                                    const newPayments = [...payments];
                                                    newPayments[index].amount = parseFloat(e.target.value) || 0;
                                                    setPayments(newPayments);
                                                }}
                                                placeholder="Monto"
                                            />
                                        </div>
                                        {payments.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                                onClick={() => setPayments(payments.filter((_, i) => i !== index))}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {totalPaid !== total && (
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className={totalPaid > total ? "text-red-500" : "text-amber-500"}>
                                        {totalPaid > total ? "Excedente:" : "Faltante:"}
                                    </span>
                                    <span className={totalPaid > total ? "text-red-500" : "text-amber-500"}>
                                        {formatCurrency(Math.abs(total - totalPaid))}
                                    </span>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-[10px] h-8"
                                    onClick={() => {
                                        const totalCurrent = payments.reduce((s, p, i) => i === payments.length - 1 ? s : s + p.amount, 0);
                                        const newPayments = [...payments];
                                        newPayments[newPayments.length - 1].amount = Math.max(0, total - totalCurrent);
                                        setPayments(newPayments);
                                    }}
                                >
                                    Saldar automático
                                </Button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-muted-foreground text-sm">TOTAL</p>
                                <p className="text-3xl font-black text-primary">
                                    {formatCurrency(total)}
                                </p>
                            </div>
                            <Button
                                className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20"
                                onClick={handleFinishSale}
                                disabled={cart.length === 0 || isPending}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Facturando...
                                    </>
                                ) : (
                                    "FINALIZAR VENTA"
                                )}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            <BarcodeScanner
                open={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={handleScan}
            />
        </div>
    );
}
