"use client";

import { useTransition, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { registerPayment } from "@/lib/actions/accounts";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Banknote, Landmark, CreditCard } from "lucide-react";

const PAYMENT_METHODS = [
    { value: "CASH",     label: "Efectivo",        icon: Banknote },
    { value: "TRANSFER", label: "Transferencia",   icon: Landmark },
    { value: "DEBIT",    label: "Débito",           icon: CreditCard },
    { value: "CREDIT",   label: "Crédito",          icon: CreditCard },
];

export function PaymentForm({
    customerId,
    currentBalance,
}: {
    customerId: string;
    currentBalance?: number;
}) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("CASH");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) return;

        startTransition(async () => {
            try {
                const result = await registerPayment({
                    customerId,
                    amount: Number(amount),
                    description,
                    paymentMethod,
                });

                if (result.success) {
                    toast({
                        title: "✅ Pago registrado",
                        description: `Recibo #${result.receiptNumber} — ${formatCurrency(Number(amount))}`,
                    });
                    setOpen(false);
                    setAmount("");
                    setDescription("");
                    setPaymentMethod("CASH");
                    router.refresh();
                } else {
                    toast({
                        title: "Error",
                        description: (result as any).error || "No se pudo registrar el pago",
                        variant: "destructive",
                    });
                }
            } catch (err) {
                toast({
                    title: "Error",
                    description: String(err),
                    variant: "destructive",
                });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Cobro
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle>Registrar Cobro / Pago</DialogTitle>
                    {currentBalance !== undefined && currentBalance > 0 && (
                        <DialogDescription>
                            Saldo pendiente del cliente:{" "}
                            <span className="font-bold text-red-600">{formatCurrency(currentBalance)}</span>
                        </DialogDescription>
                    )}
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label>Monto ($)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                            <Input
                                type="number"
                                step="0.01"
                                autoFocus
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="pl-8 text-2xl font-bold h-14"
                            />
                        </div>
                        {currentBalance !== undefined && currentBalance > 0 && (
                            <button
                                type="button"
                                className="text-xs text-primary underline"
                                onClick={() => setAmount(currentBalance.toFixed(2))}
                            >
                                Completar saldo total ({formatCurrency(currentBalance)})
                            </button>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Medio de Pago</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {PAYMENT_METHODS.map((m) => {
                                const Icon = m.icon;
                                return (
                                    <button
                                        key={m.value}
                                        type="button"
                                        onClick={() => setPaymentMethod(m.value)}
                                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 text-xs font-semibold transition-all
                                            ${paymentMethod === m.value
                                                ? "border-primary bg-primary/5 text-primary"
                                                : "border-border hover:border-primary/30 text-muted-foreground"}`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {m.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Concepto / Observación</Label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ej: Pago parcial en efectivo"
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending || !amount || Number(amount) <= 0}>
                            {isPending ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
                            ) : (
                                "Confirmar Cobro"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
