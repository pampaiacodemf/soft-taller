"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DollarSign, LockKeyhole } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
    FormDescription,
} from "@/components/ui/form";
import { closeShift } from "@/lib/actions/cash";
import { formatCurrency } from "@/lib/utils";

const formSchema = z.object({
    finalCash: z.coerce.number().min(0, "Debe ser mayor o igual a 0"),
    notes: z.string().optional(),
});

export function CloseShiftButton({
    shiftId,
    expectedCash
}: {
    shiftId: string;
    expectedCash: number;
}) {
    const { toast } = useToast();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            finalCash: expectedCash,
            notes: "",
        },
    });

    const currentFinal = form.watch("finalCash");
    const difference = currentFinal - expectedCash;

    function onSubmit(values: z.infer<typeof formSchema>) {
        startTransition(async () => {
            try {
                const result = await closeShift(shiftId, values.finalCash, values.notes);
                if (result.error) {
                    toast({
                        title: "Error",
                        description: result.error,
                        variant: "destructive",
                    });
                    return;
                }
                toast({
                    title: "Caja cerrada",
                    description: "El turno ha finalizado con éxito.",
                });
                setOpen(false);
                router.refresh();
            } catch (error: any) {
                toast({
                    title: "Error Inesperado",
                    description: String(error),
                    variant: "destructive",
                });
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="lg" variant="destructive">
                    <LockKeyhole className="w-5 h-5 mr-2" />
                    Cerrar Caja
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cerrar Turno de Caja</DialogTitle>
                    <DialogDescription>
                        Confirmá el recuento físico de billetes. El sistema espera encontrar {formatCurrency(expectedCash)}.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="finalCash"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Efectivo Recontado</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                className="pl-9 font-bold text-lg"
                                                type="number"
                                                step="0.01"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    {difference !== 0 && (
                                        <FormDescription className={difference > 0 ? "text-green-600" : "text-red-600 font-bold"}>
                                            Diferencia: {difference > 0 ? "+" : ""}{formatCurrency(difference)}
                                            {difference < 0 ? " (Faltante)" : " (Sobrante)"}
                                        </FormDescription>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas del Cierre (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder={difference !== 0 ? "Explicación de la diferencia..." : "Notas..."} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending} variant="destructive">
                                {isPending ? "Cerrando..." : "Confirmar Cierre"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
