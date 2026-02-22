import { getTenant } from "@/lib/actions/admin";
import { TenantSettingsForm } from "./tenant-settings-form";
import { Card, CardContent } from "@/components/ui/card";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Configuración" };

export default async function ConfiguracionPage() {
    const tenant = await getTenant();

    if (!tenant) {
        redirect("/login");
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Configuración</h1>
                    <p className="text-muted-foreground mt-1">
                        Ajustes básicos del negocio y sucursal
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <TenantSettingsForm tenant={tenant} />
                </CardContent>
            </Card>
        </div>
    );
}
