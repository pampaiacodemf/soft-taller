"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { registerManualMovement } from "@/lib/actions/cash";

const PAYMENT_METHODS = [
    { value: "CASH",     label: "Efectivo" },
    { value: "TRANSFER", label: "Transferencia" },
    { value: "DEBIT",    label: "Débito" },
    { value: "CREDIT",   label: "Crédito" },
];

export function ManualMovementButton({ shiftId }: { shiftId: string }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<"IN" | "OUT">("IN");
    const [method, setMethod] = useState("CASH");
    const [amount, setAmount] = useState("");
    const [concept, setConcept] = useState("");

    const reset = () => {
        setType("IN");
        setMethod("CASH");
        setAmount("");
        setConcept("");
    };

    const handleOpen = (t: "IN" | "OUT") => {
        reset();
        setType(t);
        setOpen(true);
    };

    const handleSubmit = () => {
        const parsedAmount = parseFloat(amount);
        if (!parsedAmount || parsedAmount <= 0) {
            toast({ title: "Error", description: "Ingresá un monto válido.", variant: "destructive" });
            return;
        }
        if (!concept.trim()) {
            toast({ title: "Error", description: "Ingresá un concepto.", variant: "destructive" });
            return;
        }

        startTransition(async () => {
            try {
                const result = await registerManualMovement({ type, amount: parsedAmount, method, concept });
                if (result.error) {
                    toast({ title: "Error", description: result.error, variant: "destructive" });
                } else {
                    toast({
                        title: type === "IN" ? "✅ Ingreso registrado" : "✅ Egreso registrado",
                        description: `${concept} — $${parsedAmount.toLocaleString("es-AR")}`,
                    });
                    setOpen(false);
                    router.refresh();
                }
            } catch (err: any) {
                toast({ title: "Error", description: err.message, variant: "destructive" });
            }
        });
    };

    return (
        <>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpen("IN")}
                    className="text-green-700 border-green-200 hover:bg-green-50"
                >
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                    Ingreso
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpen("OUT")}
                    className="text-red-700 border-red-200 hover:bg-red-50"
                >
                    <ArrowDownRight className="w-4 h-4 mr-1" />
                    Egreso
                </Button>
            </div>

            <Dialog open={open} onOpenChange={v => { if (!v) setOpen(false); }}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle className={`flex items-center gap-2 ${type === "IN" ? "text-green-700" : "text-red-700"}`}>
                            {type === "IN"
                                ? <><ArrowUpRight className="w-5 h-5" /> Registrar Ingreso</>
                                : <><ArrowDownRight className="w-5 h-5" /> Registrar Egreso</>
                            }
                        </DialogTitle>
                        <DialogDescription>
                            {type === "IN"
                                ? "Registrá un ingreso manual en la caja (ej: cobro adicional, devuelta de proveedor)."
                                : "Registrá un egreso manual de caja (ej: pago de gastos, retiro de efectivo)."
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Concepto</Label>
                            <Input
                                placeholder="Ej: Pago de servicio eléctrico"
                                value={concept}
                                onChange={e => setConcept(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Monto</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">$</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        className="pl-7"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Medio de Pago</Label>
                                <Select value={method} onValueChange={setMethod}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PAYMENT_METHODS.map(m => (
                                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isPending}
                            className={type === "IN" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
                        >
                            {isPending
                                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                : type === "IN"
                                    ? <ArrowUpRight className="w-4 h-4 mr-2" />
                                    : <ArrowDownRight className="w-4 h-4 mr-2" />
                            }
                            Confirmar {type === "IN" ? "Ingreso" : "Egreso"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
