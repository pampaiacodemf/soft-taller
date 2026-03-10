"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Wrench,
    User,
    Calendar,
    Monitor,
    CheckCircle2,
    ArrowRight,
    ClipboardList,
    Camera,
    Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
    cn,
    formatDate,
    WORK_ORDER_STATUS_COLORS,
    WORK_ORDER_STATUS_LABELS,
    WORK_ORDER_PRIORITY_COLORS,
    WORK_ORDER_PRIORITY_LABELS,
} from "@/lib/utils";
import { WorkflowStatus } from "@/components/orders/workflow-status";
import { advanceWorkOrderStatus, assignTechnician, addPhotosToOrder, deleteWorkOrder } from "@/lib/actions/orders";
import { useToast } from "@/components/ui/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TechnicalReportForm } from "./technical-report-form";
import Link from "next/link";
import { CameraCapture } from "@/components/camera-capture";
import { QuickChargeDialog } from "@/components/orders/quick-charge-dialog";
import { AdminDeleteButton } from "@/components/ui/admin-delete-button";

interface WorkOrderDetailProps {
    order: any;
    technicians: any[];
    userRole?: string;
}

export function WorkOrderDetail({ order, technicians, userRole }: WorkOrderDetailProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [statusNote, setStatusNote] = useState("");
    const [isChargeOpen, setIsChargeOpen] = useState(false);

    const [isAddPhotosOpen, setIsAddPhotosOpen] = useState(false);
    const [newPhotos, setNewPhotos] = useState<{ base64Data: string; mimeType: string }[]>([]);
    const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

    const handleAdvanceStatus = () => {
        startTransition(async () => {
            try {
                const result = await advanceWorkOrderStatus(order.id, statusNote);
                if (result.success) {
                    toast({
                        title: "Estado actualizado",
                        description: `La orden ahora está en: ${WORK_ORDER_STATUS_LABELS[result.newStatus as string]
                            }`,
                    });
                    setIsStatusDialogOpen(false);
                    setStatusNote("");
                    router.refresh();
                }
            } catch (err) {
                toast({
                    title: "Error",
                    description: String(err),
                    variant: "destructive",
                });
            }
        });
    };

    const handleAssignTech = (techId: string) => {
        startTransition(async () => {
            try {
                await assignTechnician(order.id, techId);
                toast({ title: "Técnico asignado" });
                router.refresh();
            } catch (err) {
                toast({
                    title: "Error",
                    description: String(err),
                    variant: "destructive",
                });
            }
        });
    };

    const handleAddPhotos = () => {
        if (newPhotos.length === 0) return;
        setIsUploadingPhotos(true);
        startTransition(async () => {
            try {
                const result = await addPhotosToOrder(order.id, newPhotos);
                if (result.success) {
                    toast({ title: "Fotos agregadas", description: "Se han adjuntado las fotos exitosamente." });
                    setIsAddPhotosOpen(false);
                    setNewPhotos([]);
                    router.refresh();
                }
            } catch (err) {
                toast({ title: "Error", description: String(err), variant: "destructive" });
            } finally {
                setIsUploadingPhotos(false);
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Header with Status Stepper */}
            <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-lg py-1 px-3">
                                    #{order.orderNumber}
                                </Badge>
                                <Badge className={cn("text-xs py-1 px-3", WORK_ORDER_PRIORITY_COLORS[order.priority] || "bg-gray-100")}>
                                    {WORK_ORDER_PRIORITY_LABELS[order.priority] || order.priority}
                                </Badge>
                                <h1 className="text-2xl font-bold">Orden de Trabajo</h1>
                            </div>
                            <p className="text-muted-foreground text-sm flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Ingresada el {formatDate(order.createdAt)}
                            </p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {/* Cobrar: oculto para TECHNICIAN y si ya fue entregado/cobrado */}
                            {order.budgetAmount &&
                                order.status !== "INGRESADO" &&
                                order.status !== "EN_REVISION" &&
                                order.status !== "ENTREGADO" &&
                                userRole !== "TECHNICIAN" && (
                                <Button onClick={() => setIsChargeOpen(true)} variant="default" className="bg-green-600 hover:bg-green-700 text-white">
                                    <Receipt className="w-4 h-4 mr-2" />
                                    Cobrar Equipo
                                </Button>
                            )}
                            {order.status !== "ENTREGADO" && (
                                <Button onClick={() => setIsStatusDialogOpen(true)} variant="outline">
                                    Avanzar Estado
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            )}
                            {(userRole === "ADMIN" || userRole === "SUPER_ADMIN") && (
                                <AdminDeleteButton
                                    label={`Orden #${order.orderNumber}`}
                                    onDelete={() => deleteWorkOrder(order.id)}
                                    redirectTo="/dashboard/ordenes"
                                    warning="Se eliminará permanentemente la orden, sus fotos, historial de estados e informe técnico."
                                />
                            )}
                        </div>
                    </div>
                    <WorkflowStatus currentStatus={order.status} />
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Monitor className="w-5 h-5 text-primary" />
                                Detalles del Equipo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Tipo</p>
                                <p className="font-medium">{order.deviceType}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Marca / Modelo</p>
                                <p className="font-medium">
                                    {order.brand || "—"} {order.model || ""}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Nro de Serie</p>
                                <p className="font-mono text-sm">{order.serial || "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Accesorios</p>
                                <p className="text-sm">{order.accessoryList || "Ninguno"}</p>
                            </div>
                            <div className="sm:col-span-2 pt-2 border-t">
                                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Problema Reportado</p>
                                <div className="p-3 bg-muted/50 rounded-lg text-sm italic">
                                    "{order.problemDescription}"
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Photos */}
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Camera className="w-5 h-5 text-primary" />
                                Evidencia Fotográfica ({order.photos?.length || 0})
                            </CardTitle>
                            {(userRole === "TECHNICIAN" || userRole === "ADMIN") && (
                                <Button size="sm" variant="outline" onClick={() => setIsAddPhotosOpen(true)}>
                                    Añadir más fotos
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {order.photos && order.photos.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {order.photos.map((photo: any) => (
                                        <div key={photo.id} className="aspect-square relative rounded-lg overflow-hidden border">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={photo.url}
                                                alt="Evidencia"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-sm text-muted-foreground italic">No hay fotos previas del equipo.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Technical Report (if exists) */}
                    {(userRole === "TECHNICIAN" || userRole === "ADMIN") && !order.technicalReport && (
                        <TechnicalReportForm orderId={order.id} />
                    )}

                    {order.technicalReport && (
                        <Card className="border-green-200">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <ClipboardList className="w-5 h-5 text-primary" />
                                        Informe Técnico
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Diagnóstico</p>
                                        <p className="text-sm whitespace-pre-wrap">{order.technicalReport.diagnosis}</p>
                                    </div>
                                    {order.technicalReport.solution && (
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase font-semibold">Solución</p>
                                            <p className="text-sm whitespace-pre-wrap">{order.technicalReport.solution}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {!order.technicalReport && (userRole !== "TECHNICIAN" && userRole !== "ADMIN") && (
                        <Card className="border-dashed opacity-70">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <ClipboardList className="w-5 h-5 text-primary" />
                                    Informe Técnico
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-6">
                                    <p className="text-sm text-muted-foreground italic">No se ha cargado el informe técnico aún.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Cliente</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {order.customer.name[0]}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{order.customer.name}</p>
                                    <p className="text-xs text-muted-foreground">{order.customer.phone || "Sin teléfono"}</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="w-full" asChild>
                                <a href={`tel:${order.customer.phone}`}>Llamar Cliente</a>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Asignación</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Técnico Responsable</Label>
                                <Select
                                    defaultValue={order.technicianId || ""}
                                    onValueChange={handleAssignTech}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sin asignar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {technicians.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Finanzas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm text-muted-foreground">Presupuesto:</span>
                                <span className="font-bold">
                                    {order.budgetAmount ? `$${order.budgetAmount}` : "—"}
                                </span>
                            </div>
                            {order.budgetAmount ? (
                                <>
                                    {/* Finance sidebar cobrar: hidden for TECHNICIAN or if delivered */}
                                    {userRole !== "TECHNICIAN" && order.status !== "ENTREGADO" && (
                                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => setIsChargeOpen(true)}>
                                            <Receipt className="w-4 h-4 mr-2" />
                                            Cobrar Equipo
                                        </Button>
                                    )}
                                    {order.status === "ENTREGADO" && (
                                        <div className="text-center py-2 text-xs text-green-600 font-semibold">✅ Equipo cobrado y entregado</div>
                                    )}
                                    <Button className="w-full" variant="ghost" size="sm" asChild>
                                        <Link href={`/dashboard/presupuestos`}>Ver Presupuesto</Link>
                                    </Button>
                                </>
                            ) : (
                                <Button className="w-full" variant="secondary" disabled={!order.technicalReport} asChild={!!order.technicalReport}>
                                    {order.technicalReport ? (
                                        <Link href={`/dashboard/presupuestos/nuevo?orderId=${order.id}&customerId=${order.customerId}`}>
                                            Generar Presupuesto
                                        </Link>
                                    ) : (
                                        <span>Generar Presupuesto</span>
                                    )}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Advance Status Dialog */}
            <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Avanzar Estado de la Orden</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Estás por cambiar el estado de la orden a la siguiente fase del workflow.
                        </p>
                        <div className="space-y-2">
                            <Label>Nota opcional para el historial</Label>
                            <Textarea
                                placeholder="Ej: El cliente aprobó por WhatsApp..."
                                value={statusNote}
                                onChange={(e) => setStatusNote(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleAdvanceStatus} disabled={isPending}>
                            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Confirmar Cambio
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddPhotosOpen} onOpenChange={setIsAddPhotosOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Añadir Fotos Adicionales</DialogTitle>
                        <DialogDescription>
                            Sube o captura fotos de hallazgos durante el diagnóstico o la reparación.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <CameraCapture
                            maxPhotos={4}
                            onPhotosChange={(captured) =>
                                setNewPhotos(captured.map((p) => ({ base64Data: p.base64, mimeType: p.mimeType })))
                            }
                            label="Fotos de diagnóstico en proceso"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddPhotosOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAddPhotos} disabled={isUploadingPhotos || newPhotos.length === 0}>
                            {isUploadingPhotos && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Subir {newPhotos.length} fotos
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <QuickChargeDialog
                open={isChargeOpen}
                onOpenChange={setIsChargeOpen}
                order={order}
            />
        </div>
    );
}
