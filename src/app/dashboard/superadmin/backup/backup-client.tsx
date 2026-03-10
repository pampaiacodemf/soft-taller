"use client";

import { useState, useRef } from "react";
import { Download, Upload, Database, Shield, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function BackupClient() {
    const { toast } = useToast();
    const [isDownloading, setIsDownloading] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const res = await fetch("/api/superadmin/backup");
            if (!res.ok) throw new Error("Error al generar el backup");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `softtaller-backup-${new Date().toISOString().split("T")[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast({ title: "✅ Backup descargado", description: "El archivo JSON fue descargado exitosamente." });
        } catch (e: any) {
            toast({ variant: "destructive", title: "Error", description: e.message });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!confirm("⚠️ Restaurar sobreescribirá los datos actuales del sistema. ¿Continuar?")) {
            e.target.value = "";
            return;
        }
        setIsRestoring(true);
        try {
            const text = await file.text();
            JSON.parse(text); // validate it's valid JSON
            const res = await fetch("/api/superadmin/restore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: text,
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Error al restaurar");
            }
            toast({ title: "✅ Sistema restaurado", description: "Los datos fueron restaurados exitosamente desde el archivo." });
        } catch (e: any) {
            toast({ variant: "destructive", title: "Error al restaurar", description: e.message });
        } finally {
            setIsRestoring(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)" }}>
                    <Database className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Administrar Sistema</h1>
                    <p className="text-sm" style={{ color: "#5a5a5a" }}>Backup y restauración de datos 100% en la nube.</p>
                </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Backup */}
                <div
                    className="rounded-2xl p-6 flex flex-col items-center text-center gap-5"
                    style={{ background: "#101010", border: "1px solid #1e1e1e" }}
                >
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.2)" }}>
                        <Download className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-white mb-1">Copia de Seguridad</p>
                        <p className="text-xs" style={{ color: "#4a4a4a" }}>
                            Descargue todos los datos del sistema directamente desde los servidores cloud (Supabase) a un archivo JSON seguro.
                        </p>
                    </div>
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all"
                        style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", boxShadow: "0 4px 20px rgba(59,130,246,0.3)" }}
                    >
                        {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {isDownloading ? "Generando..." : "Descargar Backup"}
                    </button>
                </div>

                {/* Restore */}
                <div
                    className="rounded-2xl p-6 flex flex-col items-center text-center gap-5"
                    style={{ background: "#101010", border: "1px solid #1e1e1e" }}
                >
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.2)" }}>
                        <Upload className="w-8 h-8 text-orange-400" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-white mb-1">Restaurar Sistema</p>
                        <p className="text-xs" style={{ color: "#4a4a4a" }}>
                            Suba un archivo de backup previamente descargado para restaurar los datos en los servidores cloud del sistema.
                        </p>
                    </div>
                    <button
                        onClick={() => fileRef.current?.click()}
                        disabled={isRestoring}
                        className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all"
                        style={{ background: "linear-gradient(135deg, #f97316, #c2410c)", boxShadow: "0 4px 20px rgba(249,115,22,0.3)" }}
                    >
                        {isRestoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {isRestoring ? "Restaurando..." : "Subir archivo y Restaurar"}
                    </button>
                    <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleRestore} />
                </div>
            </div>

            {/* Security notice */}
            <div
                className="rounded-2xl p-4 flex gap-3"
                style={{ background: "#0c0c10", border: "1px solid #1e1e2a" }}
            >
                <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-white mb-1">Aviso de Seguridad</p>
                    <p className="text-xs" style={{ color: "#4a4a4a" }}>
                        Todos los datos se manejan directamente desde los servidores (Supabase). Los backups contienen información sensible — almacénelos en un lugar seguro. La restauración sincroniza los datos en la nube para todos los dispositivos.
                    </p>
                </div>
            </div>
        </div>
    );
}
