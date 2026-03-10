import { getSuppliers } from "@/lib/actions/suppliers";
import { Truck } from "lucide-react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import type { Metadata } from "next";
import { SupplierForm } from "./supplier-form";
import { DeleteSupplierButton } from "./delete-supplier-button";
import { auth } from "@/auth";

export const metadata: Metadata = { title: "Proveedores" };

import { SearchInput } from "@/components/ui/search-input";

export default async function ProveedoresPage({
    searchParams,
}: {
    searchParams?: { q?: string };
}) {
    const session = await auth();
    const search = searchParams?.q || "";
    const suppliers = await getSuppliers(search);
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session?.user.role || "");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Proveedores</h1>
                    <p className="text-muted-foreground mt-1">
                        {suppliers.length} proveedores registrados
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <SearchInput placeholder="Nombre o CUIT..." className="w-full sm:w-80" />
                    <SupplierForm />
                </div>
            </div>

            {/* Suppliers table */}
            <Card>
                <CardContent className="pt-6">
                    {suppliers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <Truck className="w-12 h-12 mb-4 opacity-30" />
                            <p className="font-medium">No hay proveedores aún</p>
                            <p className="text-sm mt-1">Agrega tu primer proveedor para gestionar tus compras</p>
                            <div className="mt-4">
                                <SupplierForm />
                            </div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre / Razón Social</TableHead>
                                    <TableHead>CUIT</TableHead>
                                    <TableHead>Contacto</TableHead>
                                    <TableHead>Dirección</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suppliers.map((supplier: any) => (
                                    <TableRow key={supplier.id} className={supplier.isActive ? "" : "opacity-50"}>
                                        <TableCell>
                                            <p className="font-medium">{supplier.name}</p>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{supplier.cuit || "—"}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {supplier.email && <p>{supplier.email}</p>}
                                                {supplier.phone && <p className="text-muted-foreground">{supplier.phone}</p>}
                                                {!supplier.email && !supplier.phone && <span className="text-muted-foreground">—</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground max-w-[200px] block truncate" title={supplier.address || ""}>
                                                {supplier.address || "—"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <SupplierForm supplier={supplier} />
                                                {supplier.isActive && isAdmin && <DeleteSupplierButton id={supplier.id} />}
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
