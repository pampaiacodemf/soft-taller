"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCustomer, updateCustomer } from "@/lib/actions/customers";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Pencil } from "lucide-react";

const customerSchema = z.object({
    name: z.string().min(1, "Nombre requerido"),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    cuit: z.string().optional(),
    dni: z.string().optional(),
    ivaCondition: z.enum(["CONSUMIDOR_FINAL", "RESPONSABLE_INSCRIPTO", "MONOTRIBUTO", "EXENTO"]).default("CONSUMIDOR_FINAL"),
});

type FormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
    customer?: any; // If provided, it's an edit form
    onSuccessCallback?: (savedCustomer: any) => void;
}

export function CustomerForm({ customer, onSuccessCallback }: CustomerFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            name: customer?.name || "",
            email: customer?.email || "",
            phone: customer?.phone || "",
            address: customer?.address || "",
            cuit: customer?.cuit || "",
            dni: customer?.dni || "",
            ivaCondition: (customer?.ivaCondition as any) || "CONSUMIDOR_FINAL",
        },
    });

    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            try {
                // Convert to FormData as the current actions expect it
                const formData = new FormData();
                Object.entries(values).forEach(([key, value]) => {
                    formData.append(key, value || "");
                });

                let result;
                if (customer) {
                    result = await updateCustomer(customer.id, formData);
                } else {
                    result = await createCustomer(formData);
                }

                if (result.error) {
                    toast({ title: "Error", description: result.error, variant: "destructive" });
                    return;
                }

                toast({ title: customer ? "Cliente actualizado" : "Cliente creado" });
                setOpen(false);
                if (!customer) form.reset();

                if (onSuccessCallback && (result as any).customer) {
                    onSuccessCallback((result as any).customer);
                } else {
                    router.refresh();
                }
            } catch (err) {
                toast({ title: "Error", description: String(err), variant: "destructive" });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {customer ? (
                    <Button variant="ghost" size="icon">
                        <Pencil className="w-4 h-4" />
                    </Button>
                ) : (
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Cliente
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{customer ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre completo / Razón Social *</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Ej: Juan Pérez" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="cuit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CUIT</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="20-XXXXXXXX-X" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="dni"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>DNI</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="XXXXXXXX" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="ivaCondition"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Condición IVA</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="CONSUMIDOR_FINAL">Consumidor Final</SelectItem>
                                            <SelectItem value="RESPONSABLE_INSCRIPTO">Resp. Inscripto</SelectItem>
                                            <SelectItem value="MONOTRIBUTO">Monotributo</SelectItem>
                                            <SelectItem value="EXENTO">Exento</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="email" placeholder="email@ejemplo.com" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Teléfono</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Ej: 11 1234 5678" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dirección</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Ej: Calle 123, Ciudad" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {customer ? "Guardar Cambios" : "Crear Cliente"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
