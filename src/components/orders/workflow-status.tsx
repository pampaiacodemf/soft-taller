"use client";

import { WORK_ORDER_STATUS_LABELS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
    Check, Circle,
    ClipboardList, Microscope, Calculator, ThumbsUp, Wrench, CheckCircle2, PackageCheck,
} from "lucide-react";

const statuses = [
    { key: "INGRESADO", icon: ClipboardList },
    { key: "EN_REVISION", icon: Microscope },
    { key: "PRESUPUESTADO", icon: Calculator },
    { key: "APROBADO", icon: ThumbsUp },
    { key: "EN_REPARACION", icon: Wrench },
    { key: "LISTO", icon: CheckCircle2 },
    { key: "ENTREGADO", icon: PackageCheck },
] as const;

type WorkOrderStatus = typeof statuses[number]["key"];

interface WorkflowStatusProps {
    currentStatus: WorkOrderStatus;
    className?: string;
}

function getStatusIndex(status: WorkOrderStatus) {
    return statuses.findIndex((s) => s.key === status);
}

export function WorkflowStatus({ currentStatus, className }: WorkflowStatusProps) {
    const currentIndex = getStatusIndex(currentStatus);

    return (
        <div className={cn("w-full overflow-x-auto", className)}>
            <div className="flex items-center min-w-max px-2 py-4">
                {statuses.map((status, index) => {
                    const Icon = status.icon;
                    const isDone = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const isFuture = index > currentIndex;

                    return (
                        <div key={status.key} className="flex items-center">
                            {/* Step */}
                            <div className="flex flex-col items-center gap-1.5">
                                <div
                                    className={cn(
                                        "flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all duration-300",
                                        isDone
                                            ? "bg-green-500 border-green-500 text-white"
                                            : isCurrent
                                                ? "bg-primary border-primary text-white scale-110 shadow-md shadow-primary/30"
                                                : "bg-background border-muted-foreground/30 text-muted-foreground/50"
                                    )}
                                >
                                    {isDone ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        <Icon className="w-4 h-4" />
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        "text-xs font-medium whitespace-nowrap text-center max-w-[80px]",
                                        isCurrent ? "text-primary font-semibold" : isDone ? "text-green-600" : "text-muted-foreground/50"
                                    )}
                                >
                                    {WORK_ORDER_STATUS_LABELS[status.key]}
                                </span>
                            </div>

                            {/* Connector */}
                            {index < statuses.length - 1 && (
                                <div
                                    className={cn(
                                        "h-0.5 w-12 mx-1 mt-[-22px] rounded-full transition-all duration-300",
                                        index < currentIndex ? "bg-green-500" : "bg-muted-foreground/20"
                                    )}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
