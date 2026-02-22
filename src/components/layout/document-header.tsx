import { formatDate } from "@/lib/utils";
import { Tenant } from "@prisma/client";

interface DocumentHeaderProps {
    tenant: Tenant;
    title: string;
    number: string;
    date: Date;
}

export function DocumentHeader({ tenant, title, number, date }: DocumentHeaderProps) {
    return (
        <div className="border-b-2 border-primary/20 pb-6 mb-6">
            <div className="flex justify-between items-start gap-6">
                {/* Lado Izquierdo: Datos del Comercio */}
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-primary uppercase leading-none mb-1">
                        {tenant.name}
                    </h1>
                    <div className="text-xs space-y-0.5 text-muted-foreground">
                        {tenant.address && <p>{tenant.address}</p>}
                        {tenant.phone && <p>Tel: {tenant.phone}</p>}
                        {tenant.email && <p>Email: {tenant.email}</p>}
                    </div>
                </div>

                {/* Centro: Tipo de Documento y CUIT */}
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-primary flex items-center justify-center text-2xl font-black mb-2 mx-auto">
                        {title.includes("Factura") ? title.split(" ").pop() : "R"}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                        {tenant.cuit ? `CUIT: ${tenant.cuit}` : "S/CUIT"}
                    </p>
                </div>

                {/* Lado Derecho: Título, Número y Fecha */}
                <div className="flex-1 text-right">
                    <h2 className="text-xl font-bold uppercase text-primary">
                        {title}
                    </h2>
                    <div className="text-sm font-medium">
                        <p>Nro: <span className="font-mono text-base">{number}</span></p>
                        <p>Fecha: <span className="font-mono">{formatDate(date)}</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
