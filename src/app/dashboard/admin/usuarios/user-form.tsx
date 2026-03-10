"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUser, updateUser } from "@/lib/actions/admin";
import { useToast } from "@/components/ui/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
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
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Edit, User, Mail, Lock, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

const ROLES = [
    { value: "ADMIN",       label: "Administrador",        desc: "Acceso total al sistema" },
    { value: "ADMIN_STAFF", label: "Staff Administrativo", desc: "Gestión operativa sin configuración" },
    { value: "SALES",       label: "Vendedor / POS",       desc: "Acceso a ventas e inventario" },
    { value: "TECHNICIAN",  label: "Técnico Reparador",    desc: "Órdenes de trabajo y presupuestos" },
    { value: "SUPER_ADMIN", label: "SúperAdmin",           desc: "Acceso total global (Invisible para Staff)" },
];

const userSchema = z.object({
    name:     z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email:    z.string().email("Correo electrónico inválido"),
    role:     z.enum(["ADMIN", "ADMIN_STAFF", "TECHNICIAN", "SALES", "SUPER_ADMIN"]),
    password: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
    userData?: { id: string; name: string; email: string; role: string };
    buttonVariant?: "default" | "outline" | "ghost";
    currentUserRole?: string;
    isEdit?: boolean;
}

export function UserForm({ userData, currentUserRole, buttonVariant = "default", isEdit = false }: UserFormProps) {
    const isSuperAdmin = currentUserRole === "SUPER_ADMIN";
    const availableRoles = isSuperAdmin ? ROLES : ROLES.filter(r => r.value !== "SUPER_ADMIN");
    
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name:     "",
            email:    "",
            role:     "TECHNICIAN",
            password: "",
        },
    });

    // ── KEY FIX: Reset form with fresh user data whenever the dialog opens ──
    useEffect(() => {
        if (open) {
            form.reset({
                name:     userData?.name     ?? "",
                email:    userData?.email    ?? "",
                role:     (userData?.role as any) ?? "TECHNICIAN",
                password: "",
            });
        }
    }, [open, userData, form]);

    const isSubmitting = form.formState.isSubmitting;
    const selectedRole = form.watch("role");

    async function onSubmit(values: UserFormValues) {
        // Validate password required for new users
        if (!isEdit && !values.password) {
            form.setError("password", { message: "La contraseña es requerida para usuarios nuevos." });
            return;
        }

        try {
            if (isEdit && userData) {
                const result = await updateUser(userData.id, {
                    name:     values.name,
                    email:    values.email,
                    role:     values.role,
                    ...(values.password ? { password: values.password } : {}),
                });
                if ((result as any).error) throw new Error((result as any).error);
            } else {
                const result = await createUser({
                    name:     values.name,
                    email:    values.email,
                    role:     values.role,
                    password: values.password || "",
                });
                if ((result as any).error) throw new Error((result as any).error);
            }

            toast({
                title: isEdit ? "✅ Usuario actualizado" : "✅ Usuario creado",
                description: `${values.name} — ${ROLES.find(r => r.value === values.role)?.label}`,
            });
            setOpen(false);
            router.refresh();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Ocurrió un error inesperado.",
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isEdit ? (
                    <Button variant={buttonVariant} size="icon" title="Editar usuario">
                        <Edit className="w-4 h-4" />
                    </Button>
                ) : (
                    <Button variant={buttonVariant} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Nuevo Usuario
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        {isEdit ? `Editar — ${userData?.name}` : "Nuevo Usuario"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Modificá los datos del usuario. Dejá la contraseña vacía para no cambiarla."
                            : "Completá los datos para crear un nuevo acceso al sistema."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">

                        {/* Name */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-muted-foreground" /> Nombre Completo
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Juan Pérez" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Email */}
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Correo Electrónico
                                    </FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="juan@ejemplo.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Role — uses `value` (controlled) not `defaultValue` */}
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                        <Shield className="w-3.5 h-3.5 text-muted-foreground" /> Rol en el Sistema
                                    </FormLabel>
                                    {/* 
                                        FIX: Use value={field.value} (controlled) instead of 
                                        defaultValue={field.value} so the Select updates when the 
                                        dialog re-opens with different user data.
                                    */}
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona un rol" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {availableRoles.map(r => (
                                                <SelectItem key={r.value} value={r.value}>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{r.label}</span>
                                                        <span className="text-xs text-muted-foreground">{r.desc}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {/* Show selected role description */}
                                    {selectedRole && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {ROLES.find(r => r.value === selectedRole)?.desc}
                                        </p>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Password */}
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                                        Contraseña
                                        {isEdit && (
                                            <span className="text-xs text-muted-foreground font-normal ml-1">
                                                (dejar vacío para no cambiar)
                                            </span>
                                        )}
                                        {!isEdit && (
                                            <span className="text-xs text-destructive font-normal ml-1">*</span>
                                        )}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder={isEdit ? "••••••••" : "Mínimo 6 caracteres"}
                                            autoComplete="new-password"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEdit ? "Guardar Cambios" : "Crear Usuario"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
