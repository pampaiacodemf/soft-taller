"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DollarSign, DoorOpen } from "lucide-react";
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
} from "@/components/ui/form";
import { openShift } from "@/lib/actions/cash";
import { useState } from "react";

const formSchema = z.object({
    initialCash: z.coerce.number().min(0, "Debe ser mayor o igual a 0"),
    notes: z.string().optional(),
});

export function OpenShiftButton({ previousCash }: { previousCash: number }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            initialCash: previousCash,
            notes: "",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        startTransition(async () => {
            try {
                const result = await openShift(values.initialCash, values.notes);
                if (result.error) {
                    toast({
                        title: "Error",
                        description: result.error,
                        variant: "destructive",
                    });
                    return;
                }
                toast({
                    title: "Caja abierta",
                    description: "El turno ha comenzado con éxito.",
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
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                    <DoorOpen className="w-5 h-5 mr-2" />
                    Abrir Caja
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Abrir Turno de Caja</DialogTitle>
                    <DialogDescription>
                        Ingresá el saldo inicial en efectivo para comenzar a registrar movimientos.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="initialCash"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Efectivo Inicial</FormLabel>
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
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas u Observaciones (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Cambio en billetes chicos" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700">
                                {isPending ? "Abriendo..." : "Confirmar Apertura"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
