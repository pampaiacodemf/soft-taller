"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveTechnicalReport } from "@/lib/actions/reports";
import { useToast } from "@/components/ui/use-toast";
import { ClipboardList, Loader2, Save } from "lucide-react";

export function TechnicalReportForm({ orderId, initialData }: { orderId: string, initialData?: any }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [diagnosis, setDiagnosis] = useState(initialData?.diagnosis || "");
    const [solution, setSolution] = useState(initialData?.solution || "");

    const handleSave = () => {
        if (!diagnosis) return;
        startTransition(async () => {
            try {
                const result = await saveTechnicalReport({ workOrderId: orderId, diagnosis, solution });
                if (result.error) {
                    toast({ title: "Error", description: result.error, variant: "destructive" });
                    return;
                }
                toast({ title: "Informe guardado" });
            } catch (err) {
                toast({ title: "Error Inesperado", description: String(err), variant: "destructive" });
            }
        });
    };

    return (
        <Card className="border-primary/20">
            <CardHeader className="py-4">
                <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    {initialData ? "Editar Informe Técnico" : "Cargar Informe Técnico"}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Diagnóstico Técnico *</Label>
                    <Textarea
                        placeholder="Describite la falla encontrada..."
                        value={diagnosis}
                        onChange={e => setDiagnosis(e.target.value)}
                        rows={4}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Solución Aplicada</Label>
                    <Textarea
                        placeholder="Describite qué se hizo para repararlo..."
                        value={solution}
                        onChange={e => setSolution(e.target.value)}
                        rows={4}
                    />
                </div>
                <Button onClick={handleSave} disabled={isPending || !diagnosis} className="w-full">
                    {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Guardar Informe
                </Button>
            </CardContent>
        </Card>
    );
}
