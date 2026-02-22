"use client";

import { useTransition, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createExpense } from "@/lib/actions/reports";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";

export function ExpenseForm() {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("OTROS");
    const [description, setDescription] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) return;

        startTransition(async () => {
            try {
                const result = await createExpense({
                    amount: Number(amount),
                    category,
                    description,
                });

                if (result.error) {
                    toast({ title: "Error", description: result.error, variant: "destructive" });
                    return;
                }

                toast({ title: "Gasto registrado" });
                setOpen(false);
                setAmount("");
                setDescription("");
                router.refresh();
            } catch (err) {
                toast({ title: "Error Inesperado", description: String(err), variant: "destructive" });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Gasto
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar Salida de Caja</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Monto ($)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="text-2xl font-bold h-14"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Categoría</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MERCADERIA">Mercadería / Insumos</SelectItem>
                                <SelectItem value="SERVICIOS">Servicios (Luz, Internet, etc)</SelectItem>
                                <SelectItem value="ALQUILER">Alquiler</SelectItem>
                                <SelectItem value="SUELDOS">Sueldos / Adelantos</SelectItem>
                                <SelectItem value="OTROS">Otros</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ej: Pago de internet Fibertel"
                        />
                    </div>
                    <DialogFooter className="pt-4">
                        <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Guardar Gasto
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
