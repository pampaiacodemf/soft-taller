"use client";

import { AdminDeleteButton } from "@/components/ui/admin-delete-button";
import { deleteSupplier } from "@/lib/actions/suppliers";

export function DeleteSupplierButton({ id }: { id: string }) {
    return (
        <AdminDeleteButton
            label="este proveedor"
            onDelete={() => deleteSupplier(id)}
            warning="Se desactivará el proveedor. Los pedidos históricos se conservan."
        />
    );
}
