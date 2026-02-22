"use client";

import { useState } from "react";
import { Edit, Trash2, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { editDictionaryItem, deleteDictionaryItem } from "@/lib/actions/dictionary";
import { useToast } from "@/hooks/use-toast";

interface DictionaryRowProps {
    item: {
        id: string;
        value: string;
    };
}

export function DictionaryRow({ item }: DictionaryRowProps) {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [value, setValue] = useState(item.value);

    const handleSave = async () => {
        if (!value.trim() || value === item.value) {
            setIsEditing(false);
            return;
        }

        setIsPending(true);
        const res = await editDictionaryItem(item.id, value);

        if (res.error) {
            toast({
                title: "Error al modificar",
                description: res.error,
                variant: "destructive",
            });
            setValue(item.value); // Revert
        } else {
            toast({
                title: "Modificado exitosamente",
                description: "El registro global se actualizó.",
            });
        }

        setIsPending(false);
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (!confirm(`¿Estás seguro de que deseas eliminar "${item.value}"?`)) return;

        setIsPending(true);
        const res = await deleteDictionaryItem(item.id);

        if (res.error) {
            toast({
                title: "Error al eliminar",
                description: res.error,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Eliminado exitosamente",
                description: "La entrada ha sido removida del diccionario.",
            });
        }
        setIsPending(false);
    };

    return (
        <TableRow>
            <TableCell className="font-medium">
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <Input
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="h-8 py-1 max-w-[250px]"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSave();
                                if (e.key === "Escape") {
                                    setValue(item.value);
                                    setIsEditing(false);
                                }
                            }}
                            disabled={isPending}
                        />
                    </div>
                ) : (
                    item.value
                )}
            </TableCell>
            <TableCell>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={handleSave}
                                disabled={isPending}
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500"
                                onClick={() => {
                                    setValue(item.value);
                                    setIsEditing(false);
                                }}
                                disabled={isPending}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setIsEditing(true)}
                                disabled={isPending}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={handleDelete}
                                disabled={isPending}
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                        </>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
}
