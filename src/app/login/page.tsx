"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Monitor, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { handleEnterKey } from "@/lib/utils";

const loginSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);
        try {
            const result = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (result?.error) {
                toast({
                    title: "Error de acceso",
                    description: "Email o contraseña incorrectos.",
                    variant: "destructive",
                });
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch {
            toast({
                title: "Error",
                description: "Ocurrió un error inesperado.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full opacity-10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full opacity-10 blur-3xl" />
            </div>

            <div className="relative w-full max-w-md animate-in">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-2xl shadow-blue-900/50 mb-4">
                        <Monitor className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        SoftTaller
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Sistema de Gestión de Talleres
                    </p>
                </div>

                <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl text-white">Iniciar Sesión</CardTitle>
                        <CardDescription className="text-slate-400">
                            Ingresá tus credenciales para acceder al sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-300">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="usuario@taller.com"
                                    autoComplete="email"
                                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                                    {...register("email")}
                                    onKeyDown={handleEnterKey}
                                />
                                {errors.email && (
                                    <p className="text-red-400 text-xs">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-300">
                                    Contraseña
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                                    {...register("password")}
                                    onKeyDown={handleEnterKey}
                                />
                                {errors.password && (
                                    <p className="text-red-400 text-xs">
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white h-11 font-medium transition-all duration-200 shadow-lg shadow-blue-900/50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Ingresando...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="mr-2 h-4 w-4" />
                                        Ingresar
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Demo credentials */}
                        <div className="mt-6 p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                            <p className="text-xs text-slate-400 font-medium mb-2">
                                Credenciales de demostración:
                            </p>
                            <div className="space-y-1 text-xs text-slate-500">
                                <p>
                                    Admin:{" "}
                                    <span className="text-slate-300">admin@taller.com</span> /{" "}
                                    <span className="text-slate-300">admin123</span>
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-center text-slate-500 text-xs mt-6">
                    © 2026 SoftTaller by pampaiacode. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
}
