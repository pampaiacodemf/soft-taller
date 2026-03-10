"use client";

import { AdminDeleteButton } from "@/components/ui/admin-delete-button";
import { deleteCustomer } from "@/lib/actions/customers";

export function DeleteCustomerButton({ id }: { id: string }) {
    return (
        <AdminDeleteButton
            label="este cliente"
            onDelete={() => deleteCustomer(id)}
            warning="Se eliminará el cliente y todos sus datos. Las órdenes de trabajo asociadas pueden quedar sin referencia."
        />
    );
}
