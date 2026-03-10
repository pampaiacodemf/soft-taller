"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface AdminDeleteButtonProps {
    /** Label shown in the confirmation dialog */
    label: string;
    /** The server action to call on confirm */
    onDelete: () => Promise<{ success?: boolean; error?: string } | undefined>;
    /** Where to redirect after success. If not provided, just refreshes. */
    redirectTo?: string;
    /** Optional extra warning message */
    warning?: string;
    /** Icon size */
    size?: "icon" | "sm" | "default";
    /** Show as full button with text */
    showLabel?: boolean;
}

export function AdminDeleteButton({
    label,
    onDelete,
    redirectTo,
    warning,
    size = "icon",
    showLabel = false,
}: AdminDeleteButtonProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleConfirm = () => {
        startTransition(async () => {
            try {
                const result = await onDelete();
                if (result?.error) {
                    toast({
                        title: "Error al eliminar",
                        description: result.error,
                        variant: "destructive",
                    });
                } else {
                    toast({
                        title: "Eliminado correctamente",
                        description: `${label} eliminado.`,
                    });
                    setOpen(false);
                    if (redirectTo) {
                        router.push(redirectTo);
                    } else {
                        router.refresh();
                    }
                }
            } catch (err: any) {
                toast({
                    title: "Error",
                    description: err.message || "No se pudo eliminar.",
                    variant: "destructive",
                });
            }
        });
    };

    return (
        <>
            <Button
                variant="ghost"
                size={size}
                onClick={() => setOpen(true)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
                <Trash2 className="w-4 h-4" />
                {showLabel && <span className="ml-2">Eliminar</span>}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                            Confirmar eliminación
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            ¿Estás seguro de que querés eliminar <strong>{label}</strong>?
                            {warning && (
                                <span className="block mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs font-medium">
                                    ⚠️ {warning}
                                </span>
                            )}
                            {!warning && (
                                <span className="block mt-1">Esta acción no se puede deshacer.</span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-2">
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
                            {isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            Eliminar definitivamente
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
