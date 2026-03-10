"use client";

import { useState, useTransition } from "react";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
    CreditCard, Banknote, Landmark, FileText, Loader2, Receipt, Plus, Trash2, AlertCircle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { createSale } from "@/lib/actions/sales";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface QuickChargeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: any;
}

type PaymentMethodKey = "CASH" | "TRANSFER" | "DEBIT" | "CREDIT" | "CURRENT_ACCOUNT";

interface PaymentLine {
    id: number;
    method: PaymentMethodKey;
    amount: string;
}

const PAYMENT_METHODS: { value: PaymentMethodKey; label: string; icon: React.ReactNode; color: string }[] = [
    { value: "CASH",            label: "Efectivo",          icon: <Banknote className="w-4 h-4" />,    color: "text-green-600" },
    { value: "TRANSFER",        label: "Transferencia",     icon: <Landmark className="w-4 h-4" />,    color: "text-blue-600" },
    { value: "DEBIT",           label: "Débito",            icon: <CreditCard className="w-4 h-4" />,  color: "text-purple-600" },
    { value: "CREDIT",          label: "Crédito",           icon: <CreditCard className="w-4 h-4" />,  color: "text-orange-600" },
    { value: "CURRENT_ACCOUNT", label: "Cuenta Corriente",  icon: <FileText className="w-4 h-4" />,    color: "text-slate-600" },
];

export function QuickChargeDialog({ open, onOpenChange, order }: QuickChargeDialogProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [invoiceType, setInvoiceType] = useState<"A" | "B" | "C">("B");
    const [payments, setPayments] = useState<PaymentLine[]>([
        { id: 1, method: "CASH", amount: "" }
    ]);

    const amount = order.budgetAmount || 0;

    const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const remaining = amount - totalPaid;
    const isOverpaid = totalPaid > amount + 0.01;
    const isPaidExactly = Math.abs(remaining) < 0.01;

    const addPaymentLine = () => {
        const unusedMethod = PAYMENT_METHODS.find(m => !payments.some(p => p.method === m.value));
        setPayments(prev => [
            ...prev, 
            { id: Date.now(), method: unusedMethod?.value || "CASH", amount: "" }
        ]);
    };

    const removePaymentLine = (id: number) => {
        setPayments(prev => prev.filter(p => p.id !== id));
    };

    const updateLine = (id: number, field: "method" | "amount", value: string) => {
        setPayments(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const fillRemaining = (id: number) => {
        const otherPaid = payments
            .filter(p => p.id !== id)
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const rem = Math.max(0, amount - otherPaid);
        updateLine(id, "amount", rem.toFixed(2));
    };

    const handleCharge = () => {
        if (amount <= 0) {
            toast({ title: "Error", description: "La orden no tiene un monto presupuestado.", variant: "destructive" });
            return;
        }
        if (!isPaidExactly) {
            toast({ title: "Error", description: `El total pagado (${formatCurrency(totalPaid)}) no coincide con el monto a cobrar (${formatCurrency(amount)}).`, variant: "destructive" });
            return;
        }

        startTransition(async () => {
            try {
                // For multi-payment, we use the first/primary payment method for the invoice record
                // and create additional cash movements for the rest
                const primaryPayment = payments.reduce((a, b) => 
                    (parseFloat(a.amount) || 0) >= (parseFloat(b.amount) || 0) ? a : b
                );

                const result = await createSale({
                    customerId: order.customerId,
                    items: [{
                        qty: 1,
                        price: amount,
                        iva: 21,
                        description: `Servicio Técnico - Orden #${order.orderNumber}`,
                    }],
                    type: invoiceType,
                    paymentMethod: primaryPayment.method as any,
                    total: amount,
                    // Pass all payment methods split info
                    paymentSplit: payments
                        .filter(p => parseFloat(p.amount) > 0)
                        .map(p => ({ method: p.method, amount: parseFloat(p.amount) })),
                } as any);

                if (result.success) {
                    const methodNames = payments
                        .filter(p => parseFloat(p.amount) > 0)
                        .map(p => {
                            const m = PAYMENT_METHODS.find(m => m.value === p.method);
                            return `${m?.label}: ${formatCurrency(parseFloat(p.amount))}`;
                        }).join(", ");

                    toast({
                        title: "✅ Cobro registrado",
                        description: methodNames,
                    });
                    onOpenChange(false);
                    setPayments([{ id: 1, method: "CASH", amount: "" }]);
                    router.refresh();
                } else {
                    toast({ title: "Error", description: (result as any).error, variant: "destructive" });
                }
            } catch (err: any) {
                toast({ title: "Error", description: err.message || "No se pudo procesar el cobro.", variant: "destructive" });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-primary" />
                        Cobrar Reparación — Orden #{order.orderNumber}
                    </DialogTitle>
                    <DialogDescription>
                        Cliente: <strong>{order.customer?.name}</strong> · {order.deviceType} {order.brand} {order.model}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Total card */}
                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Total a Cobrar</p>
                            <p className="text-3xl font-bold text-primary">{formatCurrency(amount)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Restante</p>
                            <p className={cn(
                                "text-2xl font-bold",
                                isPaidExactly ? "text-green-600" : isOverpaid ? "text-red-600" : "text-amber-600"
                            )}>
                                {formatCurrency(Math.abs(remaining))}
                                {isOverpaid && <span className="text-xs ml-1">excede</span>}
                            </p>
                        </div>
                    </div>

                    {/* Payment lines */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold">Medios de Pago</Label>
                        
                        {payments.map((p, i) => (
                            <div key={p.id} className="flex items-center gap-2">
                                <Select
                                    value={p.method}
                                    onValueChange={(v) => updateLine(p.id, "method", v)}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PAYMENT_METHODS.map(m => (
                                            <SelectItem key={m.value} value={m.value}>
                                                <div className={cn("flex items-center gap-2", m.color)}>
                                                    {m.icon} {m.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="flex-1 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">$</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={p.amount}
                                        onChange={e => updateLine(p.id, "amount", e.target.value)}
                                        placeholder="0.00"
                                        className="pl-7"
                                    />
                                </div>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="shrink-0 text-xs text-primary"
                                    onClick={() => fillRemaining(p.id)}
                                    title="Completar con el resto"
                                >
                                    Max
                                </Button>

                                {payments.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="shrink-0 text-destructive hover:text-destructive"
                                        onClick={() => removePaymentLine(p.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        ))}

                        {payments.length < PAYMENT_METHODS.length && (
                            <Button type="button" variant="outline" size="sm" className="w-full" onClick={addPaymentLine}>
                                <Plus className="w-4 h-4 mr-2" />
                                Agregar otro medio de pago
                            </Button>
                        )}

                        {isOverpaid && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                El total ingresado supera el monto de la orden.
                            </div>
                        )}
                    </div>

                    {/* Invoice type */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Tipo de Comprobante</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: "B", label: "Factura B", desc: "Consumidor Final" },
                                { value: "A", label: "Factura A", desc: "Resp. Inscripto" },
                                { value: "C", label: "Factura C", desc: "Monotributo" },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setInvoiceType(opt.value as any)}
                                    className={cn(
                                        "p-3 rounded-lg border-2 text-left transition-all",
                                        invoiceType === opt.value
                                            ? "border-primary bg-primary/5 text-primary"
                                            : "border-border hover:border-primary/30"
                                    )}
                                >
                                    <p className="font-bold text-sm">{opt.label}</p>
                                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button 
                        onClick={handleCharge} 
                        disabled={isPending || amount <= 0 || !isPaidExactly || isOverpaid}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Receipt className="w-4 h-4 mr-2" />}
                        Confirmar Cobro
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
