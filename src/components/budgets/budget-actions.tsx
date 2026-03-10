"use client";

import { useState, useTransition } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { approveBudget, rejectBudget } from "@/lib/actions/budgets";

interface BudgetActionsProps {
    budgetId: string;
    budgetNumber: number;
    hasWorkOrder: boolean;
    /** If 'compact', renders icon-only buttons (for table rows). Default is full buttons. */
    variant?: "compact" | "full";
}

export function BudgetActions({ budgetId, budgetNumber, hasWorkOrder, variant = "full" }: BudgetActionsProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [dialog, setDialog] = useState<"approve" | "reject" | null>(null);

    const handleApprove = () => {
        startTransition(async () => {
            try {
                const result = await approveBudget(budgetId);
                if (result.success) {
                    toast({
                        title: "✅ Presupuesto aprobado",
                        description: hasWorkOrder
                            ? "La orden de trabajo fue actualizada a estado APROBADO automáticamente."
                            : `Presupuesto #${String(budgetNumber).padStart(4, "0")} aprobado.`,
                    });
                    setDialog(null);
                    router.refresh();
                } else {
                    throw new Error("Error al aprobar");
                }
            } catch (err: any) {
                toast({ title: "Error", description: err.message, variant: "destructive" });
            }
        });
    };

    const handleReject = () => {
        startTransition(async () => {
            try {
                const result = await rejectBudget(budgetId);
                if (result.success) {
                    toast({
                        title: "❌ Presupuesto rechazado",
                        description: hasWorkOrder
                            ? "La orden de trabajo fue actualizada a estado RECHAZADO automáticamente."
                            : `Presupuesto #${String(budgetNumber).padStart(4, "0")} rechazado.`,
                        variant: "destructive",
                    });
                    setDialog(null);
                    router.refresh();
                } else {
                    throw new Error("Error al rechazar");
                }
            } catch (err: any) {
                toast({ title: "Error", description: err.message, variant: "destructive" });
            }
        });
    };

    if (variant === "compact") {
        return (
            <>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        title="Aprobar presupuesto"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => setDialog("approve")}
                        disabled={isPending}
                    >
                        {isPending && dialog === "approve"
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <CheckCircle className="w-4 h-4" />
                        }
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        title="Rechazar presupuesto"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDialog("reject")}
                        disabled={isPending}
                    >
                        {isPending && dialog === "reject"
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <XCircle className="w-4 h-4" />
                        }
                    </Button>
                </div>

                <ApproveDialog
                    open={dialog === "approve"}
                    onClose={() => setDialog(null)}
                    onConfirm={handleApprove}
                    budgetNumber={budgetNumber}
                    hasWorkOrder={hasWorkOrder}
                    isPending={isPending}
                />
                <RejectDialog
                    open={dialog === "reject"}
                    onClose={() => setDialog(null)}
                    onConfirm={handleReject}
                    budgetNumber={budgetNumber}
                    hasWorkOrder={hasWorkOrder}
                    isPending={isPending}
                />
            </>
        );
    }

    return (
        <>
            <div className="flex gap-3">
                <Button
                    onClick={() => setDialog("approve")}
                    className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
                    disabled={isPending}
                >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aprobar Presupuesto
                </Button>
                <Button
                    variant="outline"
                    onClick={() => setDialog("reject")}
                    className="text-red-600 border-red-200 hover:bg-red-50 flex-1 sm:flex-none"
                    disabled={isPending}
                >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rechazar
                </Button>
            </div>

            <ApproveDialog
                open={dialog === "approve"}
                onClose={() => setDialog(null)}
                onConfirm={handleApprove}
                budgetNumber={budgetNumber}
                hasWorkOrder={hasWorkOrder}
                isPending={isPending}
            />
            <RejectDialog
                open={dialog === "reject"}
                onClose={() => setDialog(null)}
                onConfirm={handleReject}
                budgetNumber={budgetNumber}
                hasWorkOrder={hasWorkOrder}
                isPending={isPending}
            />
        </>
    );
}

/* ── Sub-dialogs ─────────────────────────────────────────── */

function ApproveDialog({
    open, onClose, onConfirm, budgetNumber, hasWorkOrder, isPending
}: {
    open: boolean; onClose: () => void; onConfirm: () => void;
    budgetNumber: number; hasWorkOrder: boolean; isPending: boolean;
}) {
    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-5 h-5" />
                        Aprobar Presupuesto #{String(budgetNumber).padStart(4, "0")}
                    </DialogTitle>
                    <DialogDescription className="pt-2">
                        ¿El cliente aprobó el presupuesto?
                        {hasWorkOrder && (
                            <span className="block mt-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-xs font-medium">
                                ✅ La orden de trabajo vinculada pasará automáticamente al estado <strong>APROBADO</strong>, lista para iniciar la reparación.
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-2">
                    <Button variant="outline" onClick={onClose} disabled={isPending}>Cancelar</Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        Confirmar Aprobación
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function RejectDialog({
    open, onClose, onConfirm, budgetNumber, hasWorkOrder, isPending
}: {
    open: boolean; onClose: () => void; onConfirm: () => void;
    budgetNumber: number; hasWorkOrder: boolean; isPending: boolean;
}) {
    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-700">
                        <XCircle className="w-5 h-5" />
                        Rechazar Presupuesto #{String(budgetNumber).padStart(4, "0")}
                    </DialogTitle>
                    <DialogDescription className="pt-2">
                        ¿El cliente rechazó el presupuesto?
                        {hasWorkOrder && (
                            <span className="block mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs font-medium">
                                ⚠️ La orden de trabajo vinculada pasará automáticamente al estado <strong>RECHAZADO</strong>.
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-2">
                    <Button variant="outline" onClick={onClose} disabled={isPending}>Cancelar</Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
                        {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                        Confirmar Rechazo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
