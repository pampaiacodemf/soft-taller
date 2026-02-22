import { getCustomers } from "@/lib/actions/customers";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import type { Metadata } from "next";
import { CustomerForm } from "./customer-form";
import { DeleteCustomerButton } from "./delete-customer-button";

import { CustomerFilters } from "@/components/customers/customer-filters";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage({
    searchParams,
}: {
    searchParams?: { q?: string };
}) {
    const search = searchParams?.q || "";
    const customers = await getCustomers(search);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Clientes</h1>
                    <p className="text-muted-foreground mt-1">
                        {customers.length} clientes registrados {search && `encontrados para "${search}"`}
                    </p>
                </div>
                <div className="flex gap-2">
                    <CustomerForm />
                </div>
            </div>

            <CustomerFilters />

            {/* Customers table */}
            <Card>
                <CardContent className="pt-6">
                    {customers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <Users className="w-12 h-12 mb-4 opacity-30" />
                            <p className="font-medium">No hay clientes aún</p>
                            <p className="text-sm mt-1">Agrega tu primer cliente para empezar</p>
                            <div className="mt-4">
                                <CustomerForm />
                            </div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Identificación</TableHead>
                                    <TableHead>Contacto</TableHead>
                                    <TableHead>Condición IVA</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.map((customer) => (
                                    <TableRow key={customer.id}>
                                        <TableCell>
                                            <p className="font-medium">{customer.name}</p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {customer.cuit && <p>CUIT: {customer.cuit}</p>}
                                                {customer.dni && <p className="text-muted-foreground">DNI: {customer.dni}</p>}
                                                {!customer.cuit && !customer.dni && <span className="text-muted-foreground">—</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {customer.email && <p>{customer.email}</p>}
                                                {customer.phone && <p className="text-muted-foreground">{customer.phone}</p>}
                                                {!customer.email && !customer.phone && <span className="text-muted-foreground">—</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">
                                                {customer.ivaCondition.replace(/_/g, " ")}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <CustomerForm customer={customer} />
                                                <DeleteCustomerButton id={customer.id} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
