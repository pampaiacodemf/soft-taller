"use client";

import { AdminDeleteButton } from "@/components/ui/admin-delete-button";
import { deleteProduct } from "@/lib/actions/products";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
    return (
        <AdminDeleteButton
            label={name}
            onDelete={() => deleteProduct(id)}
            warning="Se desactivará el producto del inventario. Los movimientos de stock históricos se conservan."
        />
    );
}
