"use client";

import { useState } from "react";
import { Edit, Trash2, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { updateCategory, deleteCategory } from "@/lib/actions/categories";
import { useToast } from "@/hooks/use-toast";

interface CategoryRowProps {
    category: {
        id: string;
        name: string;
    };
}

export function CategoryRow({ category }: CategoryRowProps) {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [name, setName] = useState(category.name);

    const handleSave = async () => {
        if (!name.trim() || name === category.name) {
            setIsEditing(false);
            return;
        }

        setIsPending(true);
        const res = await updateCategory(category.id, name);

        if (res.error) {
            toast({
                title: "Error al modificar",
                description: res.error,
                variant: "destructive",
            });
            setName(category.name);
        } else {
            toast({
                title: "Modificado exitosamente",
                description: "La categoría se actualizó.",
            });
        }

        setIsPending(false);
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (!confirm(`¿Estás seguro de que deseas eliminar la categoría "${category.name}"?`)) return;

        setIsPending(true);
        const res = await deleteCategory(category.id);

        if (res.error) {
            toast({
                title: "Error al eliminar",
                description: res.error,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Eliminado exitosamente",
                description: "La categoría ha sido removida.",
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
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-8 py-1 max-w-[250px]"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSave();
                                if (e.key === "Escape") {
                                    setName(category.name);
                                    setIsEditing(false);
                                }
                            }}
                            disabled={isPending}
                        />
                    </div>
                ) : (
                    category.name
                )}
            </TableCell>
            <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                    {isEditing ? (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600"
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
                                    setName(category.name);
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
