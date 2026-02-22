"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addDictionaryItem, DictionaryType } from "@/lib/actions/dictionary";
import { toast } from "@/components/ui/use-toast";

interface AddDictionaryItemButtonProps {
    type: DictionaryType;
    title: string;
}

export function AddDictionaryItemButton({ type, title }: AddDictionaryItemButtonProps) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(false);

    async function onSubmit() {
        if (!value.trim()) return;

        setLoading(true);
        try {
            const result = await addDictionaryItem(type, value);
            if (result.error) {
                toast({
                    title: "Error",
                    description: result.error,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Éxito",
                    description: `${title} agregado correctamente.`,
                });
                setValue("");
                setOpen(false);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Ocurrió un error inesperado.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" /> Agregar {title}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Agregar Nuevo {title}</DialogTitle>
                    <DialogDescription>
                        Ingresá el valor para el nuevo {title.toLowerCase()}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Valor</Label>
                        <Input
                            id="name"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={`Ej: ${type === "TYPE" ? "Notebook" : type === "BRAND" ? "Apple" : "MacBook Air"}`}
                            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={onSubmit} disabled={loading || !value.trim()}>
                        {loading ? "Guardando..." : "Guardar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
