"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft, ScanBarcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createProduct, updateProduct, deleteProduct } from "@/lib/actions/products";
import { useToast } from "@/components/ui/use-toast";
import { handleEnterKey } from "@/lib/utils";
import Link from "next/link";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const schema = z.object({
    name: z.string().min(1, "Nombre requerido"),
    brand: z.string().optional(),
    model: z.string().optional(),
    barcode: z.string().optional(),
    description: z.string().optional(),
    costPrice: z.coerce.number().min(0, "Debe ser positivo"),
    salePrice: z.coerce.number().min(0, "Debe ser positivo"),
    ivaRate: z.coerce.number(),
    stock: z.coerce.number().int().min(0, "Debe ser entero positivo"),
    minStock: z.coerce.number().int().min(0, "Debe ser entero positivo"),
    unit: z.string().optional(),
    categoryId: z.string().optional(),
    supplierId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ProductFormProps {
    initialData?: any;
    categories: { id: string; name: string }[];
    suppliers: { id: string; name: string }[];
}

export function ProductForm({ initialData, categories, suppliers }: ProductFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [scannerOpen, setScannerOpen] = useState(false);
    const [marginInput, setMarginInput] = useState(() => {
        if (initialData?.costPrice > 0 && initialData?.salePrice >= 0) {
            return (((initialData.salePrice / initialData.costPrice) - 1) * 100).toFixed(2);
        }
        return "";
    });

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: initialData ? {
            ...initialData,
            brand: initialData.brand || "",
            model: initialData.model || "",
            barcode: initialData.barcode || "",
            description: initialData.description || "",
            categoryId: initialData.categoryId || undefined,
            unit: initialData.unit || "unidad",
            costPrice: Number(initialData.costPrice),
            salePrice: Number(initialData.salePrice),
            ivaRate: Number(initialData.ivaRate),
            stock: Number(initialData.stock),
            minStock: Number(initialData.minStock),
        } : {
            name: "",
            brand: "",
            model: "",
            barcode: "",
            description: "",
            costPrice: 0,
            salePrice: 0,
            ivaRate: 21,
            stock: 0,
            minStock: 2,
            unit: "unidad",
        },
    });

    const onSubmit = (data: FormValues) => {
        startTransition(async () => {
            try {
                let result;
                if (initialData?.id) {
                    result = await updateProduct(initialData.id, {
                        ...data,
                        supplierId: data.supplierId === "none" ? null : data.supplierId
                    } as any);
                } else {
                    result = await createProduct({
                        ...data,
                        supplierId: data.supplierId === "none" ? null : data.supplierId
                    } as any);
                }

                if (result.error) {
                    toast({
                        title: "Error",
                        description: result.error,
                        variant: "destructive",
                    });
                    return;
                }

                toast({ title: initialData?.id ? "Producto actualizado" : "Producto creado" });
                router.push("/dashboard/inventario");
                router.refresh();
            } catch (err) {
                toast({
                    title: "Error Inesperado",
                    description: String(err),
                    variant: "destructive",
                });
            }
        });
    };

    const handleDelete = (id: string) => {
        startTransition(async () => {
            try {
                const result = await deleteProduct(id);
                if (result.error) {
                    toast({ title: "Error", description: result.error, variant: "destructive" });
                    return;
                }
                toast({ title: "Producto eliminado exitosamente" });
                router.push("/dashboard/inventario");
                router.refresh();
            } catch (err) {
                toast({ title: "Error Inesperado", description: String(err), variant: "destructive" });
            }
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit, (errors) => {
            console.error("Errores de validación:", errors);
            toast({ title: "Error de Validación", description: "Revisá los campos obligatorios en rojo.", variant: "destructive" });
        })} className="space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/inventario">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">
                    {initialData?.id ? "Editar Producto" : "Nuevo Producto"}
                </h1>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base text-primary">Información General</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nombre del Producto *</Label>
                            <Input
                                {...register("name")}
                                placeholder="Ej: Memoria RAM 8GB DDR4"
                                onKeyDown={handleEnterKey}
                            />
                            {errors.name && (
                                <p className="text-red-500 text-xs">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Marca</Label>
                                <Input
                                    {...register("brand")}
                                    placeholder="Ej: Kingston"
                                    onKeyDown={handleEnterKey}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Modelo</Label>
                                <Input
                                    {...register("model")}
                                    placeholder="Ej: Fury"
                                    onKeyDown={handleEnterKey}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Código de Barras (EAN13)</Label>
                            <div className="flex gap-2">
                                <Input
                                    {...register("barcode")}
                                    placeholder="7421234567890"
                                    onKeyDown={handleEnterKey}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setScannerOpen(true)}
                                >
                                    <ScanBarcode className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Categoría</Label>
                            <Select
                                onValueChange={(v) => setValue("categoryId", v)}
                                defaultValue={initialData?.categoryId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Proveedor Principal</Label>
                            <Select
                                onValueChange={(v) => setValue("supplierId", v)}
                                defaultValue={initialData?.supplierId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar proveedor" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">— Sin proveedor —</SelectItem>
                                    {suppliers.map((sup) => (
                                        <SelectItem key={sup.id} value={sup.id}>
                                            {sup.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base text-primary">Precios y Stock</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Precio Costo ($) *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    {...register("costPrice")}
                                    onBlur={(e) => {
                                        register("costPrice").onBlur(e);
                                        const c = parseFloat(e.target.value);
                                        const s = watch("salePrice");
                                        if (c > 0 && !isNaN(c)) {
                                            setMarginInput((((s / c) - 1) * 100).toFixed(2));
                                        }
                                    }}
                                    onKeyDown={handleEnterKey}
                                />
                                {errors.costPrice && <p className="text-red-500 text-xs">{errors.costPrice.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>IVA (%)</Label>
                                <Select
                                    onValueChange={(v) => setValue("ivaRate", Number(v))}
                                    defaultValue={String(initialData?.ivaRate || 21)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">0%</SelectItem>
                                        <SelectItem value="10.5">10.5%</SelectItem>
                                        <SelectItem value="21">21%</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                                <Label>Ganancia (%)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Ej: 30"
                                    value={marginInput}
                                    onChange={(e) => {
                                        setMarginInput(e.target.value);
                                        const m = parseFloat(e.target.value);
                                        const c = watch("costPrice") || 0;
                                        if (!isNaN(m) && c >= 0) {
                                            const newSalePrice = c * (1 + m / 100);
                                            setValue("salePrice", Number(newSalePrice.toFixed(2)));
                                        }
                                    }}
                                    onKeyDown={handleEnterKey}
                                />
                            </div>

                            <div className="space-y-2 text-blue-600 bg-blue-50 p-3 rounded-md border border-blue-100">
                                <Label>Precio Venta Sugerido ($) *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    {...register("salePrice")}
                                    onBlur={(e) => {
                                        register("salePrice").onBlur(e);
                                        const s = parseFloat(e.target.value);
                                        const c = watch("costPrice");
                                        if (c > 0 && !isNaN(c)) {
                                            setMarginInput((((s / c) - 1) * 100).toFixed(2));
                                        }
                                    }}
                                    className="font-bold border-blue-200"
                                    onKeyDown={handleEnterKey}
                                />
                                {errors.salePrice && <p className="text-red-500 text-xs">{errors.salePrice.message}</p>}
                                <p className="text-[10px] opacity-70 italic absolute mt-0.5">
                                    Margen en $: {((watch("salePrice") || 0) - (watch("costPrice") || 0)).toFixed(2)}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <Label>Stock Inicial *</Label>
                                <Input
                                    type="number"
                                    {...register("stock", { valueAsNumber: true })}
                                    onKeyDown={handleEnterKey}
                                />
                                {errors.stock && <p className="text-red-500 text-xs">{errors.stock.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Stock Mínimo (Alerta) *</Label>
                                <Input
                                    type="number"
                                    {...register("minStock", { valueAsNumber: true })}
                                    onKeyDown={handleEnterKey}
                                />
                                {errors.minStock && <p className="text-red-500 text-xs">{errors.minStock.message}</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base text-primary">Detalles Adicionales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label>Descripción</Label>
                            <Textarea
                                {...register("description")}
                                placeholder="Especificaciones técnicas, notas del proveedor..."
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-between items-center pt-4">
                <div>
                    {initialData?.id && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button type="button" variant="destructive">Eliminar Producto</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción no se puede deshacer de forma fácil. Ocultará y eliminará este producto del inventario de forma permanente para el cajero.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                        onClick={() => handleDelete(initialData.id)}
                                    >
                                        Sí, eliminar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
                <div className="flex gap-3">
                    <Button type="button" variant="outline" asChild>
                        <Link href="/dashboard/inventario">Cancelar</Link>
                    </Button>
                    <Button type="submit" disabled={isPending} className="min-w-[140px]">
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            "Guardar Producto"
                        )}
                    </Button>
                </div>
            </div>

            <BarcodeScanner
                open={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onScan={(code) => setValue("barcode", code)}
            />
        </form>
    );
}
