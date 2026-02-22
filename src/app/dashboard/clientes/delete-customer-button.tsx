"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteCustomer } from "@/lib/actions/customers";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export function DeleteCustomerButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    const handleDelete = () => {
        if (!confirm("¿Seguro que deseas eliminar este cliente?")) return;

        startTransition(async () => {
            try {
                await deleteCustomer(id);
                toast({ title: "Cliente eliminado" });
                router.refresh();
            } catch (err) {
                toast({ title: "Error", description: String(err), variant: "destructive" });
            }
        });
    };

    return (
        <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isPending}>
            <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
    );
}
