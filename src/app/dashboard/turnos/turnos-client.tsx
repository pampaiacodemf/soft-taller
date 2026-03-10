"use client";

import { useState } from "react";
import { Calendar, Clock, Plus, User, ChevronLeft, ChevronRight, Trash2, Check, X, Wrench } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { createAppointment, deleteAppointment, updateAppointmentStatus } from "@/lib/actions/appointments";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_COLORS: Record<string, string> = {
    PENDING:   "#f97316",
    CONFIRMED: "#10b981",
    CANCELLED: "#ef4444",
    DONE:      "#6b7280",
};

const STATUS_LABELS: Record<string, string> = {
    PENDING:   "Pendiente",
    CONFIRMED: "Confirmado",
    CANCELLED: "Cancelado",
    DONE:      "Realizado",
};

export function TurnosClient({ appointments, customers, technicians, tenantId }: {
    appointments: any[];
    customers: any[];
    technicians: any[];
    tenantId: string;
}) {
    const router = useRouter();
    const { toast } = useToast();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
    const [isNewOpen, setIsNewOpen] = useState(false);
    const [loading, setLoading] = useState<string | null>(null);

    // New appointment form state
    const [form, setForm] = useState({
        title: "",
        description: "",
        customerId: "",
        technicianId: "",
        date: format(new Date(), "yyyy-MM-dd"),
        time: "09:00",
    });

    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    const dayAppointments = selectedDay
        ? appointments.filter(a => isSameDay(new Date(a.startAt), selectedDay))
        : [];

    const getMonthAppointments = (day: Date) =>
        appointments.filter(a => isSameDay(new Date(a.startAt), day));

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        setLoading("create");
        try {
            const startAt = new Date(`${form.date}T${form.time}`);
            await createAppointment({
                tenantId,
                title: form.title,
                description: form.description,
                customerId: form.customerId || undefined,
                technicianId: form.technicianId || undefined,
                startAt,
            });
            toast({ title: "✅ Turno creado", description: `${form.title} — ${format(startAt, "d MMM HH:mm", { locale: es })}` });
            setIsNewOpen(false);
            setForm({ title: "", description: "", customerId: "", technicianId: "", date: format(new Date(), "yyyy-MM-dd"), time: "09:00" });
            router.refresh();
        } catch (e: any) {
            toast({ variant: "destructive", title: "Error", description: e.message });
        } finally {
            setLoading(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este turno?")) return;
        setLoading(id);
        try {
            await deleteAppointment(id);
            toast({ title: "Turno eliminado" });
            router.refresh();
        } catch (e: any) {
            toast({ variant: "destructive", title: "Error", description: e.message });
        } finally {
            setLoading(null);
        }
    };

    const handleStatus = async (id: string, status: string) => {
        setLoading(id + status);
        try {
            await updateAppointmentStatus(id, status);
            router.refresh();
        } catch (e: any) {
            toast({ variant: "destructive", title: "Error", description: e.message });
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <Calendar className="w-7 h-7 text-orange-400" /> Turnos
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "#5a5a5a" }}>Agenda y gestión de turnos de clientes</p>
                </div>
                <button
                    onClick={() => setIsNewOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white text-sm transition-all"
                    style={{ background: "linear-gradient(135deg, #f97316, #dc2626)", boxShadow: "0 4px 16px rgba(249,115,22,0.3)" }}
                >
                    <Plus className="w-4 h-4" /> Nuevo Turno
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Calendar ── */}
                <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: "#101010", border: "1px solid #1e1e1e" }}>
                    {/* Month navigation */}
                    <div className="flex items-center justify-between mb-5">
                        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}
                            className="p-2 rounded-lg transition-colors hover:bg-white/5">
                            <ChevronLeft className="w-4 h-4 text-white" />
                        </button>
                        <h2 className="text-lg font-bold text-white capitalize">
                            {format(currentMonth, "MMMM yyyy", { locale: es })}
                        </h2>
                        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}
                            className="p-2 rounded-lg transition-colors hover:bg-white/5">
                            <ChevronRight className="w-4 h-4 text-white" />
                        </button>
                    </div>

                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 mb-2">
                        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
                            <div key={d} className="text-center text-xs font-semibold py-2" style={{ color: "#3a3a3a" }}>{d}</div>
                        ))}
                    </div>

                    {/* Day grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {/* First week offset based on day of week */}
                        {Array.from({ length: (new Date(days[0]).getDay() + 6) % 7 }).map((_, i) => (
                            <div key={`e${i}`} />
                        ))}
                        {days.map(day => {
                            const dayAppts = getMonthAppointments(day);
                            const selected = selectedDay && isSameDay(day, selectedDay);
                            const today = isToday(day);
                            return (
                                <button
                                    key={day.toISOString()}
                                    onClick={() => setSelectedDay(day)}
                                    className="relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all text-sm font-medium"
                                    style={{
                                        background: selected ? "linear-gradient(135deg, #f97316, #dc2626)" : today ? "rgba(249,115,22,0.12)" : "transparent",
                                        border: selected ? "none" : today ? "1px solid rgba(249,115,22,0.3)" : "1px solid transparent",
                                        color: selected ? "#fff" : today ? "#f97316" : isSameMonth(day, currentMonth) ? "#aaa" : "#333",
                                    }}
                                >
                                    {format(day, "d")}
                                    {dayAppts.length > 0 && (
                                        <span
                                            className="absolute bottom-1 text-[9px] font-bold rounded-full px-1"
                                            style={{ background: selected ? "rgba(255,255,255,0.3)" : "#f97316", color: selected ? "#fff" : "#000" }}
                                        >
                                            {dayAppts.length}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Day appointments ── */}
                <div className="rounded-2xl p-5 flex flex-col" style={{ background: "#101010", border: "1px solid #1e1e1e" }}>
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-400" />
                        {selectedDay ? format(selectedDay, "EEEE d MMM", { locale: es }) : "Seleccionar día"}
                    </h3>

                    {dayAppointments.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                            <Calendar className="w-10 h-10 mb-3" style={{ color: "#2a2a2a" }} />
                            <p className="text-sm" style={{ color: "#3a3a3a" }}>Sin turnos para este día</p>
                            <button
                                onClick={() => {
                                    setForm(f => ({ ...f, date: selectedDay ? format(selectedDay, "yyyy-MM-dd") : f.date }));
                                    setIsNewOpen(true);
                                }}
                                className="mt-4 text-xs text-orange-400 hover:text-orange-300 underline underline-offset-2"
                            >
                                + Agregar turno
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3 overflow-y-auto flex-1">
                            {dayAppointments.map(appt => (
                                <div
                                    key={appt.id}
                                    className="rounded-xl p-3 border-l-4"
                                    style={{ background: "#0a0a0a", borderTop: "1px solid #1a1a1a", borderRight: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a", borderColor: `${STATUS_COLORS[appt.status]}40`, borderLeftColor: STATUS_COLORS[appt.status] }}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-white truncate">{appt.title}</p>
                                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px]" style={{ color: "#5a5a5a" }}>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {format(new Date(appt.startAt), "HH:mm")}
                                                </span>
                                                {appt.customer && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" /> {appt.customer.name}
                                                    </span>
                                                )}
                                                {appt.technician && (
                                                    <span className="flex items-center gap-1 text-orange-400">
                                                        <Wrench className="w-3 h-3" /> {appt.technician.name}
                                                    </span>
                                                )}
                                            </div>
                                            <span
                                                className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                style={{ background: `${STATUS_COLORS[appt.status]}20`, color: STATUS_COLORS[appt.status] }}
                                            >
                                                {STATUS_LABELS[appt.status]}
                                            </span>
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                            {appt.status === "PENDING" && (
                                                <button
                                                    onClick={() => handleStatus(appt.id, "CONFIRMED")}
                                                    className="p-1.5 rounded-lg hover:bg-green-500/20 transition-colors"
                                                    title="Confirmar"
                                                >
                                                    <Check className="w-3.5 h-3.5 text-green-400" />
                                                </button>
                                            )}
                                            {appt.status !== "DONE" && appt.status !== "CANCELLED" && (
                                                <button
                                                    onClick={() => handleStatus(appt.id, "DONE")}
                                                    className="p-1.5 rounded-lg hover:bg-blue-500/20 transition-colors"
                                                    title="Marcar como realizado"
                                                >
                                                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(appt.id)}
                                                className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── New appointment modal ── */}
            {isNewOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
                    <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#141414", border: "1px solid #242424" }}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-white">Nuevo Turno</h3>
                            <button onClick={() => setIsNewOpen(false)}>
                                <X className="w-5 h-5" style={{ color: "#5a5a5a" }} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <Field label="Título *">
                                <input
                                    required value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="Ej: Revisión de PC"
                                    className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
                                    style={{ background: "#0a0a0a", border: "1px solid #242424", color: "#e5e5e5" }}
                                />
                            </Field>

                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Fecha">
                                    <input
                                        type="date" value={form.date}
                                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
                                        style={{ background: "#0a0a0a", border: "1px solid #242424", color: "#e5e5e5" }}
                                    />
                                </Field>
                                <Field label="Hora">
                                    <input
                                        type="time" value={form.time}
                                        onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
                                        style={{ background: "#0a0a0a", border: "1px solid #242424", color: "#e5e5e5" }}
                                    />
                                </Field>
                            </div>

                            <Field label="Técnico Asignado (opcional)">
                                <select
                                    value={form.technicianId}
                                    onChange={e => setForm(f => ({ ...f, technicianId: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                                    style={{ background: "#0a0a0a", border: "1px solid #242424", color: "#e5e5e5" }}
                                >
                                    <option value="">Sin técnico asignado</option>
                                    {technicians.map((t: any) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Cliente (opcional)">
                                <select
                                    value={form.customerId}
                                    onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                                    style={{ background: "#0a0a0a", border: "1px solid #242424", color: "#e5e5e5" }}
                                >
                                    <option value="">Sin cliente</option>
                                    {customers.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Descripción (opcional)">
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Notas del turno..."
                                    rows={2}
                                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                                    style={{ background: "#0a0a0a", border: "1px solid #242424", color: "#e5e5e5" }}
                                />
                            </Field>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsNewOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                                    style={{ background: "#1a1a1a", color: "#7a7a7a", border: "1px solid #242424" }}>
                                    Cancelar
                                </button>
                                <button type="submit" disabled={loading === "create"}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                                    style={{ background: "linear-gradient(135deg, #f97316, #dc2626)", boxShadow: "0 4px 16px rgba(249,115,22,0.3)" }}>
                                    {loading === "create" ? "Guardando..." : "Crear Turno"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#5a5a5a" }}>{label}</label>
            {children}
        </div>
    );
}
