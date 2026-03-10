"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addDictionaryItem, DictionaryType } from "@/lib/actions/dictionary";
import { useToast } from "@/hooks/use-toast";

interface AddDictionaryItemButtonProps {
    type: DictionaryType;
    title: string;
}

export function AddDictionaryItemButton({ type, title }: AddDictionaryItemButtonProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");
    const [isPending, setIsPending] = useState(false);

    const handleAdd = async () => {
        if (!value.trim()) return;

        setIsPending(true);
        const res = await addDictionaryItem(type, value);

        if (res.error) {
            toast({
                title: "Error al agregar",
                description: res.error,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Agregado exitosamente",
                description: `"${value}" se ha sumado al diccionario.`,
            });
            setValue("");
            setOpen(false);
        }
        setIsPending(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nueva {title}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Agregar {title}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="value">Nueva sugerencia</Label>
                        <Input
                            id="value"
                            placeholder="Escribe el valor..."
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleAdd();
                            }}
                            autoFocus
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleAdd} disabled={isPending}>
                        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
