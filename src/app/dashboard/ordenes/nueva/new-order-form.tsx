"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CameraCapture } from "@/components/camera-capture";
import { createWorkOrder } from "@/lib/actions/orders";
import { useToast } from "@/components/ui/use-toast";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { CustomerCombobox } from "@/components/customers/customer-combobox";
import { handleEnterKey } from "@/lib/utils";
import Link from "next/link";

interface Customer { id: string; name: string; cuit?: string | null; phone?: string | null; }
interface Technician { id: string; name: string; }

const schema = z.object({
    customerId: z.string().min(1, "Seleccioná un cliente"),
    deviceType: z.string().min(1, "Tipo de equipo requerido"),
    brand: z.string().optional(),
    model: z.string().optional(),
    serial: z.string().optional(),
    problemDescription: z.string().min(5, "Descripción requerida"),
    priority: z.string().default("MEDIA"),
    accessoryList: z.string().optional(),
    technicianId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export interface DictionaryData {
    types: { id: string, value: string }[];
    brands: { id: string, value: string }[];
    models: { id: string, value: string }[];
}

interface NewOrderFormProps {
    customers: Customer[];
    technicians: Technician[];
    dictionaries: DictionaryData;
}

export function NewOrderForm({ customers, technicians, dictionaries }: NewOrderFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [photos, setPhotos] = useState<{ base64Data: string; mimeType: string }[]>([]);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
    });

    const onSubmit = (data: FormValues) => {
        startTransition(async () => {
            try {
                const result = await createWorkOrder({ ...data, photos });
                if (result.error) {
                    toast({ title: "Error", description: result.error, variant: "destructive" });
                    return;
                }
                if (result.success) {
                    toast({
                        title: "✅ Orden creada",
                        description: `Orden #${result.workOrder?.orderNumber} ingresada exitosamente.`,
                    });
                    router.push("/dashboard/ordenes");
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

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/ordenes">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Nueva Orden de Trabajo</h1>
                    <p className="text-muted-foreground text-sm">Recepción de equipo para reparación</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Cliente y Técnico */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Cliente</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Cliente *</Label>
                            <CustomerCombobox
                                customers={customers}
                                value={watch("customerId")}
                                onChange={(val) => setValue("customerId", val, { shouldValidate: true })}
                            />
                            {errors.customerId && (
                                <p className="text-red-500 text-xs">{errors.customerId.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Técnico Asignado</Label>
                            <Select onValueChange={(v) => setValue("technicianId", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sin asignar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {technicians.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Prioridad</Label>
                            <Select defaultValue="MEDIA" onValueChange={(v) => setValue("priority", v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BAJA">Baja</SelectItem>
                                    <SelectItem value="MEDIA">Media</SelectItem>
                                    <SelectItem value="ALTA">Alta</SelectItem>
                                    <SelectItem value="URGENTE">Urgente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Equipo */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Equipo</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2 col-span-2">
                                <Label>Tipo de Equipo *</Label>
                                <SearchableSelect
                                    type="TYPE"
                                    value={watch("deviceType")}
                                    onChange={(v) => setValue("deviceType", v, { shouldValidate: true })}
                                    options={dictionaries.types}
                                    placeholder="Notebook, PC..."
                                />
                                {errors.deviceType && (
                                    <p className="text-red-500 text-xs">{errors.deviceType.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Marca</Label>
                                <SearchableSelect
                                    type="BRAND"
                                    value={watch("brand") || ""}
                                    onChange={(v) => setValue("brand", v)}
                                    options={dictionaries.brands}
                                    placeholder="Dell, HP..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Modelo</Label>
                                <SearchableSelect
                                    type="MODEL"
                                    value={watch("model") || ""}
                                    onChange={(v) => setValue("model", v)}
                                    options={dictionaries.models}
                                    placeholder="Inspiron 15..."
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Número de Serie</Label>
                                <Input placeholder="SN-XXXXXX" {...register("serial")} onKeyDown={handleEnterKey} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Problema */}
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle className="text-base">Descripción del Problema</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Problema reportado por el cliente *</Label>
                            <Textarea
                                placeholder="Descripción detallada del problema o falla..."
                                rows={4}
                                {...register("problemDescription")}
                            />
                            {errors.problemDescription && (
                                <p className="text-red-500 text-xs">{errors.problemDescription.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Accesorios entregados</Label>
                            <Input
                                placeholder="Cargador, mouse, mochila..."
                                {...register("accessoryList")}
                                onKeyDown={handleEnterKey}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Fotos */}
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle className="text-base">Fotos de Recepción</CardTitle></CardHeader>
                    <CardContent>
                        <CameraCapture
                            maxPhotos={4}
                            onPhotosChange={(captured) =>
                                setPhotos(captured.map((p) => ({ base64Data: p.base64, mimeType: p.mimeType })))
                            }
                            label="Fotos del estado del equipo"
                        />
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end gap-3">
                <Button variant="outline" type="button" asChild>
                    <Link href="/dashboard/ordenes">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={isPending} className="min-w-32">
                    {isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
                    ) : (
                        "Ingresar Orden"
                    )}
                </Button>
            </div>
        </form>
    );
}
