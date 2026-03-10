"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Lock, Flame, Mail, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const loginSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
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
                toast({ title: "Acceso denegado", description: "Email o contraseña incorrectos.", variant: "destructive" });
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch {
            toast({ title: "Error", description: "Ocurrió un error inesperado.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{ background: "#080808" }}
        >
            {/* ── Atmospheric background glows ── */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] opacity-20 pointer-events-none"
                style={{ background: "radial-gradient(ellipse, #f97316 0%, #dc2626 60%, transparent 100%)" }}
            />
            <div
                className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-10 pointer-events-none"
                style={{ background: "#f97316" }}
            />

            {/* ── Grid pattern overlay ── */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: "linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px)",
                    backgroundSize: "60px 60px",
                }}
            />

            <div className="relative w-full max-w-md animate-in z-10">

                {/* ── Brand ── */}
                <div className="flex flex-col items-center mb-10">
                    <div
                        className="flex items-center justify-center w-16 h-16 rounded-2xl mb-5 shadow-fire"
                        style={{
                            background: "linear-gradient(135deg, #f97316 0%, #dc2626 100%)",
                            boxShadow: "0 0 40px rgba(249,115,22,0.4), 0 8px 32px rgba(0,0,0,0.6)",
                        }}
                    >
                        <Flame className="w-8 h-8 text-white" />
                    </div>
                    <h1
                        className="text-4xl font-black tracking-widest uppercase"
                        style={{
                            background: "linear-gradient(90deg, #f97316 0%, #fb923c 50%, #f97316 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            letterSpacing: "0.12em",
                        }}
                    >
                        SOFTTALLER
                    </h1>
                    <p className="text-xs font-medium tracking-[0.3em] uppercase mt-1" style={{ color: "#3a3a3a" }}>
                        Sistema de Gestión de Talleres
                    </p>
                </div>

                {/* ── Card ── */}
                <div
                    className="rounded-2xl p-8"
                    style={{
                        background: "linear-gradient(135deg, #141414 0%, #0f0f0f 100%)",
                        border: "1px solid #1f1f1f",
                        boxShadow: "0 24px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.04)",
                    }}
                >
                    {/* Card top accent line */}
                    <div
                        className="absolute top-0 left-8 right-8 h-px rounded-full"
                        style={{ background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.6), transparent)" }}
                    />

                    <h2 className="text-xl font-bold text-white mb-6">Iniciar Sesión</h2>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#5a5a5a" }}>
                                <Mail className="w-3 h-3" /> Email
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="usuario@taller.com"
                                    autoComplete="email"
                                    autoFocus
                                    {...register("email")}
                                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all duration-200"
                                    style={{
                                        background: "#0a0a0a",
                                        border: "1px solid #1f1f1f",
                                        color: "#e5e5e5",
                                    }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = "#f97316"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.12)"; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = "#1f1f1f"; e.currentTarget.style.boxShadow = "none"; }}
                                />
                            </div>
                            {errors.email && <p className="text-xs" style={{ color: "#ef4444" }}>{errors.email.message}</p>}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#5a5a5a" }}>
                                <Lock className="w-3 h-3" /> Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    type={showPass ? "text" : "password"}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    {...register("password")}
                                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all duration-200 pr-12"
                                    style={{
                                        background: "#0a0a0a",
                                        border: "1px solid #1f1f1f",
                                        color: "#e5e5e5",
                                    }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = "#f97316"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.12)"; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = "#1f1f1f"; e.currentTarget.style.boxShadow = "none"; }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                                    style={{ color: "#3a3a3a" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = "#f97316")}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = "#3a3a3a")}
                                >
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs" style={{ color: "#ef4444" }}>{errors.password.message}</p>}
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-wider uppercase transition-all duration-200 mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{
                                background: isLoading
                                    ? "linear-gradient(135deg, #7c3505 0%, #7f1d1d 100%)"
                                    : "linear-gradient(135deg, #f97316 0%, #dc2626 100%)",
                                boxShadow: isLoading ? "none" : "0 4px 24px rgba(249,115,22,0.35)",
                            }}
                            onMouseEnter={(e) => {
                                if (!isLoading) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 32px rgba(249,115,22,0.55)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.boxShadow = isLoading ? "none" : "0 4px 24px rgba(249,115,22,0.35)";
                            }}
                        >
                            {isLoading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Ingresando...</>
                            ) : (
                                <><Lock className="w-4 h-4" /> Ingresar al Sistema</>
                            )}
                        </button>
                    </form>

                    {/* Demo credentials */}
                    <div
                        className="mt-6 p-3 rounded-lg"
                        style={{ background: "#0a0a0a", border: "1px solid #1a1a1a" }}
                    >
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#2a2a2a" }}>
                            Demo
                        </p>
                        <p className="text-xs mb-2" style={{ color: "#3a3a3a" }}>
                            Admin: admin@taller.com · <span style={{ color: "#4a4a4a" }}>admin123</span>
                        </p>
                        <p className="text-xs" style={{ color: "#7e22ce" }}>
                            SúperAdmin: superadmin@softtaller.com · <span style={{ color: "#6b21a8" }}>SuperAdmin2026!</span>
                        </p>
                    </div>
                </div>

                <p className="text-center text-xs mt-6" style={{ color: "#2a2a2a" }}>
                    © 2026 SoftTaller · Todos los derechos reservados
                </p>
            </div>
        </div>
    );
}
