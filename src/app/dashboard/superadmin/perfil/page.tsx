import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Crown, Shield, Globe } from "lucide-react";

export const metadata: Metadata = { title: "Perfil SúperAdmin" };

export default async function SuperAdminPerfilPage() {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") return redirect("/dashboard");

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)" }}>
                    <Crown className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Perfil SúperAdmin</h1>
                    <p className="text-sm" style={{ color: "#5a5a5a" }}>Cuenta con acceso total al sistema</p>
                </div>
            </div>

            <div className="rounded-2xl p-6 space-y-5" style={{ background: "#101010", border: "1px solid #1e1e1e" }}>
                {/* Avatar */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white"
                        style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)" }}>
                        {session.user.name?.[0]?.toUpperCase() ?? "S"}
                    </div>
                    <div>
                        <p className="text-xl font-bold text-white">{session.user.name}</p>
                        <p className="text-sm" style={{ color: "#5a5a5a" }}>{session.user.email}</p>
                        <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold px-2.5 py-0.5 rounded-full"
                            style={{ background: "rgba(168,85,247,0.2)", color: "#c084fc" }}>
                            <Crown className="w-3 h-3" /> SúperAdmin
                        </span>
                    </div>
                </div>

                {/* Privileges */}
                <div className="pt-4 border-t" style={{ borderColor: "#1e1e1e" }}>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#4a4a4a" }}>Privilegios</p>
                    <div className="space-y-2">
                        {[
                            { icon: Shield, label: "Acceso total al sistema", desc: "Sin restricciones de rol ni suscripción" },
                            { icon: Crown, label: "Gestión de membresías", desc: "Puede extender o reiniciar subscripciones de talleres" },
                            { icon: Globe, label: "Gestión multi-tenant", desc: "Acceso a todos los talleres registrados" },
                        ].map(({ icon: Icon, label, desc }) => (
                            <div key={label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#0a0a0a" }}>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: "rgba(168,85,247,0.12)" }}>
                                    <Icon className="w-4 h-4 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">{label}</p>
                                    <p className="text-xs" style={{ color: "#4a4a4a" }}>{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
