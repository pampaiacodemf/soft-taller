import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CategoryRow } from "@/components/admin/category-row";
import { AddCategoryButton } from "@/components/admin/add-category-button";
import { Package } from "lucide-react";

export const metadata = { title: "Categorías de Productos" };

export default async function CategoriasAdminPage() {
    const session = await auth();
    if (!session || !["ADMIN", "ADMIN_STAFF"].includes(session.user.role)) {
        return redirect("/dashboard");
    }

    const categories = await prisma.productCategory.findMany({
        where: { tenantId: session.user.tenantId },
        orderBy: { name: "asc" },
    });

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Categorías de Productos</h1>
                    <p className="text-muted-foreground mt-2">
                        Gestioná las categorías para clasificar tus insumos y repuestos (ej: Conectividad, Periféricos).
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle>Listado de Categorías ({categories.length})</CardTitle>
                        <CardDescription>
                            Podés agregar, editar o eliminar categorías que no tengan productos asociados.
                        </CardDescription>
                    </div>
                    <AddCategoryButton />
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center py-12 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <Package className="w-8 h-8 opacity-20" />
                                            <p>No hay categorías registradas.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                categories.map((cat) => (
                                    <CategoryRow key={cat.id} category={cat} />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
