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
import { createExpense, createExpenseCategory } from "@/lib/actions/reports";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Plus, Loader2, PlusCircle } from "lucide-react";

interface Category { id: string; name: string; }

export function ExpenseForm({ categories }: { categories: Category[] }) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [description, setDescription] = useState("");

    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    const handleAddCategory = () => {
        if (!newCategoryName) return;
        startTransition(async () => {
            const result = await createExpenseCategory(newCategoryName);
            if (result.success) {
                toast({ title: "Categoría creada" });
                setIsAddingCategory(false);
                setNewCategoryName("");
                router.refresh();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0 || !categoryId) return;

        startTransition(async () => {
            try {
                const result = await createExpense({
                    amount: Number(amount),
                    categoryId,
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
                        <div className="flex items-center justify-between">
                            <Label>Categoría</Label>
                            {!isAddingCategory && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-[10px]"
                                    onClick={() => setIsAddingCategory(true)}
                                >
                                    <PlusCircle className="w-3 h-3 mr-1" />
                                    Nueva
                                </Button>
                            )}
                        </div>
                        
                        {isAddingCategory ? (
                            <div className="flex gap-2">
                                <Input
                                    size={30}
                                    placeholder="Nombre de categoría..."
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    className="h-10"
                                />
                                <Button type="button" onClick={handleAddCategory}>OK</Button>
                                <Button type="button" variant="outline" onClick={() => setIsAddingCategory(false)}>X</Button>
                            </div>
                        ) : (
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccioná categoría..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
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
                        <Button type="submit" disabled={isPending || isAddingCategory}>
                            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Guardar Gasto
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
