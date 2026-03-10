"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import Link from "next/link";
import { createBudget } from "@/lib/actions/budgets";
import { formatCurrency } from "@/lib/utils";
import { ProductCombobox } from "@/components/products/product-combobox";

// This is simplified and uses free text for the customer for "libre" budgets
const formSchema = z.object({
    customerName: z.string().optional(),
    customerEmail: z.string().email().optional().or(z.literal('')),
    validUntil: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(z.object({
        description: z.string().min(1, "Requerido"),
        quantity: z.coerce.number().min(1, "Mínimo 1"),
        unitPrice: z.coerce.number().min(0, "No puede ser negativo"),
        ivaRate: z.coerce.number().min(0, "No puede ser negativo"),
    })).min(1, "Debe agregar al menos un ítem"),
});

export function NewBudgetForm({
    defaultCustomerName,
    defaultCustomerEmail,
    orderId,
    customerId,
    techReportText = "",
    products = []
}: {
    defaultCustomerName?: string,
    defaultCustomerEmail?: string,
    orderId?: string,
    customerId?: string,
    techReportText?: string,
    products?: { id: string; name: string; salePrice: number; ivaRate: number; }[]
}) {
    const { toast } = useToast();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            customerName: defaultCustomerName || "",
            customerEmail: defaultCustomerEmail || "",
            notes: orderId ? `${techReportText}Presupuesto correspondiente a la Orden de Trabajo #${orderId.slice(-4).toUpperCase()}` : "",
            items: [
                { description: "", quantity: 1, unitPrice: 0, ivaRate: 21 },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    // Calculate totals for summary preview
    const watchedItems = form.watch("items");
    let subtotal = 0;
    let totalIva = 0;

    watchedItems.forEach(item => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unitPrice) || 0;
        const iva = Number(item.ivaRate) || 0;

        const itemSubtotal = qty * price;
        const itemIvaAmount = itemSubtotal * (iva / 100);

        subtotal += itemSubtotal;
        totalIva += itemIvaAmount;
    });

    const total = subtotal + totalIva;

    function onSubmit(values: z.infer<typeof formSchema>) {
        startTransition(async () => {
            try {
                // Formatting data for the server action
                let finalNotes = values.notes || "";
                if (values.customerName && !customerId) {
                    finalNotes = `Presupuesto para: ${values.customerName}${values.customerEmail ? ` (${values.customerEmail})` : ''}\n\n${finalNotes}`;
                }

                // Call server action, wait for result to get ID
                const result = await createBudget({
                    customerId: customerId,
                    workOrderId: orderId,
                    validUntil: values.validUntil ? new Date(values.validUntil) : undefined,
                    notes: finalNotes,
                    items: values.items.map(i => ({
                        description: i.description,
                        quantity: Number(i.quantity),
                        unitPrice: Number(i.unitPrice),
                        ivaRate: Number(i.ivaRate)
                    }))
                });

                if (result.success) {
                    toast({
                        title: "Presupuesto creado",
                        description: "El presupuesto fue guardado exitosamente.",
                    });
                    // Redirect directly to the PDF/Detail view rather than the list
                    router.push(`/dashboard/presupuestos/${result.budget.id}`);
                    router.refresh();
                }

            } catch (error: any) {
                toast({
                    title: "Error",
                    description: error.message || "No se pudo guardar el presupuesto.",
                    variant: "destructive",
                });
            }
        });
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/presupuestos">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Nuevo Presupuesto</h1>
                    <p className="text-muted-foreground mt-1">
                        {orderId ? "Cotización desde Orden de Trabajo" : "Generar una cotización independiente"}
                    </p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Cabecera */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Datos del Cliente</CardTitle>
                                <CardDescription>{orderId ? "Autocompletado desde la Orden" : "Para presupuestos rápidos a consumidores finales"}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="customerName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre / Razón Social</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej: Juan Pérez" {...field} readOnly={!!customerId} className={customerId ? "bg-muted" : ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="customerEmail"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email de contacto</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="juan@ejemplo.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="validUntil"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Válido hasta</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notas */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Observaciones</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <textarea
                                                    className="flex min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                    placeholder="Garantía de 3 meses. El pago es contado efectivo. Los repuestos están sujetos a disponibilidad de importación."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Ítems del Presupuesto */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Detalle del Presupuesto</CardTitle>
                                <CardDescription>Repuestos, componentes y mano de obra a cotizar</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <ProductCombobox
                                    products={products}
                                    onSelectProduct={(p) => {
                                        append({
                                            description: p.name,
                                            quantity: 1,
                                            unitPrice: p.salePrice,
                                            ivaRate: p.ivaRate
                                        });
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ description: "", quantity: 1, unitPrice: 0, ivaRate: 21 })}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Fila Libre
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex flex-wrap md:flex-nowrap gap-3 items-end p-4 border rounded-lg bg-muted/20">
                                        <div className="w-full md:flex-1 min-w-[200px]">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.description`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Descripción</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Memoria RAM Kingston 8GB DDR4" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="w-24">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.quantity`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Cant.</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" min="1" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="w-32">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.unitPrice`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">P. Unitario ($)</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" step="0.01" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="w-24">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.ivaRate`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">IVA %</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" step="0.5" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="w-full md:w-32 flex justify-between items-center h-[40px] px-2 py-1 bg-background border rounded-md font-bold text-right pt-[10px] pb-[10px]">
                                            <span className="text-xs font-normal md:hidden">Subt: </span>
                                            {formatCurrency((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unitPrice || 0) * (1 + (watchedItems[index]?.ivaRate || 0) / 100))}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-100"
                                            onClick={() => remove(index)}
                                            disabled={fields.length === 1}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                {form.formState.errors.items?.root && (
                                    <p className="text-sm font-medium text-destructive">
                                        {form.formState.errors.items.root.message}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col items-end border-t bg-muted/50 p-6">
                            <div className="space-y-1 w-64">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal:</span>
                                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">IVA:</span>
                                    <span className="font-medium">{formatCurrency(totalIva)}</span>
                                </div>
                                <div className="flex justify-between text-xl font-bold pt-2 border-t mt-2">
                                    <span>Total:</span>
                                    <span className="text-primary">{formatCurrency(total)}</span>
                                </div>
                            </div>
                            <Button
                                type="submit"
                                size="lg"
                                className="w-64 mt-6 bg-blue-600 hover:bg-blue-700"
                                disabled={isPending || fields.length === 0}
                            >
                                <Save className="w-5 h-5 mr-2" />
                                {isPending ? "Generando..." : "Generar Presupuesto"}
                            </Button>
                        </CardFooter>
                    </Card>

                </form>
            </Form>
        </div>
    );
}
