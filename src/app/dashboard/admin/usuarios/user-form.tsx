"use client";

import { useState } from "react";
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
import { Loader2, Plus, Edit } from "lucide-react";

const userSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    email: z.string().email("Correo electrónico inválido"),
    role: z.enum(["ADMIN", "ADMIN_STAFF", "TECHNICIAN", "SALES"]),
    password: z.string().optional(),
}).refine(data => {
    // If it's a new user, password is required
    return true; // Simple check for now. We enforce it conditionally.
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
    userData?: Partial<UserFormValues> & { id: string };
    buttonVariant?: "default" | "outline" | "ghost";
    isEdit?: boolean;
}

export function UserForm({ userData, buttonVariant = "default", isEdit = false }: UserFormProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: userData?.name || "",
            email: userData?.email || "",
            role: userData?.role || "TECHNICIAN",
            password: "",
        },
    });

    const isSubmitting = form.formState.isSubmitting;

    async function onSubmit(data: UserFormValues) {
        if (!isEdit && !data.password) {
            form.setError("password", { message: "La contraseña es requerida para usuarios nuevos." });
            return;
        }

        try {
            if (isEdit && userData) {
                await updateUser(userData.id, {
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    ...(data.password ? { password: data.password } : {}),
                });
            } else {
                await createUser({
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    password: data.password || "",
                });
            }
            toast({
                title: "Éxito",
                description: `El usuario ha sido ${isEdit ? "actualizado" : "creado"}.`,
            });
            setOpen(false);
            if (!isEdit) form.reset();
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
                    <Button variant={buttonVariant} size="icon">
                        <Edit className="w-4 h-4" />
                    </Button>
                ) : (
                    <Button variant={buttonVariant} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Nuevo Usuario
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre Completo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Juan Pérez" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Correo Electrónico</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="juan@ejemplo.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rol en el Sistema</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona un rol" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="ADMIN">Administrador</SelectItem>
                                            <SelectItem value="ADMIN_STAFF">Staff Administrativo</SelectItem>
                                            <SelectItem value="SALES">Vendedor / POS</SelectItem>
                                            <SelectItem value="TECHNICIAN">Técnico Reparador</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Contraseña
                                        {isEdit && <span className="text-xs text-muted-foreground ml-2">(Dejar en blanco para no cambiar)</span>}
                                    </FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end pt-4">
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
