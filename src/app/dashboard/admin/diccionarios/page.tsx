import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Plus, Edit, Trash2, Cpu, Tag, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteDictionaryItem } from "@/lib/actions/dictionary";
import { DictionaryRow } from "@/components/admin/dictionary-row";
import { AddDictionaryItemButton } from "@/components/admin/add-dictionary-item-button";

// We'll need a client component approach to handle form states natively,
// but since this is a server page, we will use a mixed approach or separate interactive rows.
// For now, we fetch the data and render it.

export const metadata = { title: "Diccionarios de Inventario" };

export default async function DictionaryAdminPage() {
    const session = await auth();
    if (!session || !["ADMIN", "ADMIN_STAFF"].includes(session.user.role)) {
        return redirect("/dashboard");
    }

    const dictItems = await prisma.deviceDictionary.findMany({
        where: { tenantId: session.user.tenantId },
        orderBy: { value: "asc" },
    });

    const types = dictItems.filter((i: any) => i.type === "TYPE");
    const brands = dictItems.filter((i: any) => i.type === "BRAND");
    const models = dictItems.filter((i: any) => i.type === "MODEL");

    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Diccionarios de Equipos</h1>
                <p className="text-muted-foreground mt-2">
                    Administrá los Tipos de Equipo, Marcas y Modelos que aparecen como sugerencias al crear nuevas órdenes de trabajo.
                </p>
            </div>

            <Tabs defaultValue="tipos" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="tipos" className="flex items-center gap-2">
                        <Cpu className="w-4 h-4" /> Tipos de Equipo
                    </TabsTrigger>
                    <TabsTrigger value="marcas" className="flex items-center gap-2">
                        <Tag className="w-4 h-4" /> Marcas
                    </TabsTrigger>
                    <TabsTrigger value="modelos" className="flex items-center gap-2">
                        <Box className="w-4 h-4" /> Modelos
                    </TabsTrigger>
                </TabsList>

                {/* Tipos Tab */}
                <TabsContent value="tipos">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle>Tipos de Equipo ({types.length})</CardTitle>
                                <CardDescription>
                                    Categorías principales (ej: PC, Notebook, Consola).
                                </CardDescription>
                            </div>
                            <AddDictionaryItemButton type="TYPE" title="Tipo" />
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Valor</TableHead>
                                        <TableHead className="w-[100px]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {types.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-6 text-muted-foreground">
                                                No hay tipos registrados.
                                            </TableCell>
                                        </TableRow>
                                    ) : types.map((item: any) => (
                                        <DictionaryRow key={item.id} item={item} />
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Marcas Tab */}
                <TabsContent value="marcas">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle>Marcas de Hardware ({brands.length})</CardTitle>
                                <CardDescription>
                                    Empresas fabricantes (ej: Apple, Asus, Samsung).
                                </CardDescription>
                            </div>
                            <AddDictionaryItemButton type="BRAND" title="Marca" />
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Valor</TableHead>
                                        <TableHead className="w-[100px]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {brands.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-6 text-muted-foreground">
                                                No hay marcas registradas.
                                            </TableCell>
                                        </TableRow>
                                    ) : brands.map((item: any) => (
                                        <DictionaryRow key={item.id} item={item} />
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Modelos Tab */}
                <TabsContent value="modelos">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle>Modelos Específicos ({models.length})</CardTitle>
                                <CardDescription>
                                    Series numéricas de repuestos y equipos (ej: MacBook Pro M1, Galaxy S21).
                                </CardDescription>
                            </div>
                            <AddDictionaryItemButton type="MODEL" title="Modelo" />
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Valor</TableHead>
                                        <TableHead className="w-[100px]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {models.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-6 text-muted-foreground">
                                                No hay modelos registrados.
                                            </TableCell>
                                        </TableRow>
                                    ) : models.map((item: any) => (
                                        <DictionaryRow key={item.id} item={item} />
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
