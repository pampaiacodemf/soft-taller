"use client";

import { useState } from "react";
import { extendSubscription, resetSubscription } from "@/lib/actions/superadmin";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, Crown, Zap, RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react";

const PLANS = [
    { days: 1,   icon: Calendar, label: "1 Día",        desc: "Extender la membresía actual por 24 horas (modo prueba / emergencia).", color: "#10b981", shadow: "rgba(16,185,129,0.3)" },
    { days: 30,  icon: Calendar, label: "30 Días",       desc: "Extender la membresía actual por 1 mes (30 días).",                      color: "#3b82f6", shadow: "rgba(59,130,246,0.3)" },
    { days: 365, icon: Crown,    label: "365 Días (1 Año)", desc: "Extender la membresía actual por 1 año calendario completo (365 días).", color: "#f97316", shadow: "rgba(249,115,22,0.3)" },
];

export function MembresiaClient({ tenants }: { tenants: any[] }) {
    const { toast } = useToast();
    const [selectedTenant, setSelectedTenant] = useState(tenants[0]?.id ?? "");
    const [loading, setLoading] = useState<string | null>(null);

    const tenant = tenants.find(t => t.id === selectedTenant);
    const sub = tenant?.subscription;
    const daysLeft = sub?.daysRemaining ?? 0;
    const expiresAt = sub?.expiresAt ? new Date(sub.expiresAt).toLocaleDateString("es-AR") : "—";

    const handleExtend = async (days: number) => {
        setLoading(`extend-${days}`);
        try {
            const r = await extendSubscription(selectedTenant, days);
            toast({ title: "✅ Membresía extendida", description: `Ahora tiene ${r.newDays} días restantes.` });
        } catch (e: any) {
            toast({ variant: "destructive", title: "Error", description: e.message });
        } finally {
            setLoading(null);
        }
    };

    const handleReset = async () => {
        if (!confirm("¿Reiniciar membresía a 0 días? Esto marcará la suscripción como vencida.")) return;
        setLoading("reset");
        try {
            await resetSubscription(selectedTenant);
            toast({ title: "Reiniciado", description: "Membresía reiniciada a 0 días." });
        } catch (e: any) {
            toast({ variant: "destructive", title: "Error", description: e.message });
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)" }}>
                    <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Gestión de Membresías</h1>
                    <p className="text-sm" style={{ color: "#5a5a5a" }}>Administra y extiende las suscripciones de los talleres</p>
                </div>
            </div>

            {/* Tenant selector */}
            {tenants.length > 1 && (
                <select
                    value={selectedTenant}
                    onChange={e => setSelectedTenant(e.target.value)}
                    className="px-4 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: "#141414", border: "1px solid #242424", minWidth: "260px" }}
                >
                    {tenants.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
            )}

            {/* Current status */}
            <div
                className="rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                style={{ background: "#101010", border: "1px solid #1e1e1e" }}
            >
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#4a4a4a" }}>Estado Actual</p>
                    <p className="text-xl font-bold" style={{ color: sub?.isActive && daysLeft > 0 ? "#10b981" : "#ef4444" }}>
                        {sub?.isActive && daysLeft > 0 ? "Suscripción Activa" : "Suscripción Vencida"}
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: "#5a5a5a" }}>Válido hasta: {expiresAt}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#4a4a4a" }}>Días Restantes</p>
                    <p className="text-4xl font-black" style={{ color: daysLeft > 7 ? "#10b981" : "#f97316" }}>{daysLeft}</p>
                </div>
            </div>

            {/* Extension plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PLANS.map(plan => {
                    const Icon = plan.icon;
                    const isLoading = loading === `extend-${plan.days}`;
                    return (
                        <div
                            key={plan.days}
                            className="rounded-2xl p-6 flex flex-col items-center text-center gap-4"
                            style={{ background: "#101010", border: "1px solid #1e1e1e" }}
                        >
                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                style={{ background: `${plan.color}18`, border: `1px solid ${plan.color}30` }}
                            >
                                <Icon className="w-7 h-7" style={{ color: plan.color }} />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-white mb-1">{plan.label}</p>
                                <p className="text-xs" style={{ color: "#4a4a4a" }}>{plan.desc}</p>
                            </div>
                            <button
                                onClick={() => handleExtend(plan.days)}
                                disabled={!!loading}
                                className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all"
                                style={{
                                    background: isLoading ? "#2a2a2a" : `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
                                    boxShadow: isLoading ? "none" : `0 4px 20px ${plan.shadow}`,
                                    opacity: loading && !isLoading ? 0.5 : 1,
                                }}
                            >
                                <Calendar className="w-4 h-4" />
                                {isLoading ? "Procesando..." : `Añadir ${plan.label}`}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Danger zone */}
            <div
                className="rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                style={{ background: "#120808", border: "1px solid #3a1010" }}
            >
                <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div>
                        <p className="font-semibold" style={{ color: "#ef4444" }}>Zona de Peligro</p>
                        <p className="text-xs" style={{ color: "#5a5a5a" }}>Reiniciar la membresía eliminará todos los días restantes y marcará la suscripción como vencida.</p>
                    </div>
                </div>
                <button
                    onClick={handleReset}
                    disabled={!!loading}
                    className="px-5 py-2.5 rounded-xl font-bold text-white text-sm flex items-center gap-2 whitespace-nowrap transition-all"
                    style={{ background: "linear-gradient(135deg, #dc2626, #991b1b)", boxShadow: "0 4px 16px rgba(220,38,38,0.3)" }}
                >
                    <RotateCcw className="w-4 h-4" />
                    {loading === "reset" ? "Reiniciando..." : "Reiniciar a 0 Días"}
                </button>
            </div>
        </div>
    );
}
