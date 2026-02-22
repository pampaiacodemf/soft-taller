"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Copy, Save, Building2, Mail, Phone, MapPin, Hash } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { updateTenantSettings } from "@/lib/actions/admin";

const formSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    cuit: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
});

type TenantData = {
    id: string;
    name: string;
    slug: string;
    cuit: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
};

interface TenantSettingsFormProps {
    tenant: TenantData;
}

export function TenantSettingsForm({ tenant }: TenantSettingsFormProps) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: tenant.name,
            cuit: tenant.cuit || "",
            email: tenant.email || "",
            phone: tenant.phone || "",
            address: tenant.address || "",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        startTransition(async () => {
            try {
                await updateTenantSettings(values);
                toast({
                    title: "Configuración actualizada",
                    description: "Los datos del negocio se guardaron correctamente.",
                });
            } catch (error: any) {
                toast({
                    title: "Error",
                    description: error.message || "No se pudo actualizar la configuración.",
                    variant: "destructive",
                });
            }
        });
    }

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copiado",
            description: `${label} copiado al portapapeles.`,
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* General Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                            Información Principal
                        </h3>

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Taller / Negocio</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: FixIt Tech" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="cuit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>RUT / CUIT / Identificación Fiscal</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input className="pl-9" placeholder="Ej: 30-12345678-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            <Mail className="w-5 h-5 text-muted-foreground" />
                            Contacto y Ubicación
                        </h3>

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Comercial</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input className="pl-9" type="email" placeholder="contacto@taller.com" {...field} />
                                        </div>
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
                                    <FormLabel>Teléfono de Contacto</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input className="pl-9" placeholder="+54 11 1234-5678" {...field} />
                                        </div>
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
                                    <FormLabel>Dirección Física</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input className="pl-9" placeholder="Av. Principal 123, Ciudad" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormDescription>Se mostrará en los presupuestos y órdenes de trabajo.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border">
                    <div>
                        <p className="text-sm font-medium">Enlace Directo al Taller (Slug)</p>
                        <p className="text-xs text-muted-foreground mt-1">Este identificador único se usa para tu URL personalizada.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-background border rounded text-xs font-mono">
                            {tenant.slug}
                        </code>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyToClipboard(tenant.slug, "Slug")}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <Button type="submit" disabled={isPending}>
                        {isPending && <div className="w-4 h-4 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Configuración
                    </Button>
                </div>
            </form>
        </Form>
    );
}
