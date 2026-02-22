"use client";

import { useTransition, useState } from "react";
import { formatCurrency, handleEnterKey } from "@/lib/utils";
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
} from "@/components/ui/dialog";
import { registerPayment } from "@/lib/actions/accounts";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Receipt, Trash2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function PaymentForm({ customerId }: { customerId: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);
    const [description, setDescription] = useState("");
    const [payments, setPayments] = useState<{ method: "CASH" | "DEBIT" | "CREDIT" | "TRANSFER"; amount: number }[]>([
        { method: "CASH", amount: 0 }
    ]);

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (totalPaid <= 0) return;

        startTransition(async () => {
            try {
                const result = await registerPayment({
                    customerId,
                    payments: payments as any,
                    description,
                });

                if (result.success) {
                    toast({
                        title: "Pago registrado",
                        description: `Se generó el recibo correctamente.`,
                    });
                    setOpen(false);
                    setPayments([{ method: "CASH", amount: 0 }]);
                    setDescription("");
                    router.refresh();
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar Pago / Cobro</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="font-bold">Medios de Pago</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPayments([...payments, { method: "CASH", amount: 0 }])}
                            >
                                <Plus className="w-4 h-4 mr-2" /> Agregar medio
                            </Button>
                        </div>
                        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                            {payments.map((p, index) => (
                                <div key={index} className="flex gap-2 items-end">
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-[10px] uppercase opacity-70">Método</Label>
                                        <Select
                                            value={p.method}
                                            onValueChange={(v: any) => {
                                                const newPayments = [...payments];
                                                newPayments[index].method = v;
                                                setPayments(newPayments);
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CASH">Efectivo</SelectItem>
                                                <SelectItem value="DEBIT">Débito</SelectItem>
                                                <SelectItem value="CREDIT">Crédito</SelectItem>
                                                <SelectItem value="TRANSFER">Transferencia</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-[140px] space-y-1">
                                        <Label className="text-[10px] uppercase opacity-70">Monto</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={p.amount}
                                            onChange={(e) => {
                                                const newPayments = [...payments];
                                                newPayments[index].amount = parseFloat(e.target.value) || 0;
                                                setPayments(newPayments);
                                            }}
                                            placeholder="0.00"
                                            className="font-bold"
                                        />
                                    </div>
                                    {payments.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={() => setPayments(payments.filter((_, i) => i !== index))}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border border-dashed">
                            <span className="font-bold text-sm">TOTAL A COBRAR:</span>
                            <span className="text-2xl font-black text-primary">{formatCurrency(totalPaid)}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Concepto / Observación</Label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ej: Pago de saldo pendiente"
                        />
                    </div>
                    <DialogFooter className="pt-4">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => setOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Procesando...
                                </>
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
