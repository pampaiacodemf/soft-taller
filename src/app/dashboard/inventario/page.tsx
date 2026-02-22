import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import { Plus, ScanBarcode, AlertTriangle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, getStockStatusClass } from "@/lib/utils";
import type { Metadata } from "next";
import { InventoryControls } from "@/components/products/inventory-controls";
import { InventoryFilters } from "@/components/products/inventory-filters";

export const metadata: Metadata = { title: "Inventario" };

interface InventarioPageProps {
    searchParams: {
        query?: string;
        categoryId?: string;
    };
}

export default async function InventarioPage({ searchParams }: InventarioPageProps) {
    const session = await auth();
    if (!session) return null;

    const query = searchParams.query || "";
    const categoryId = searchParams.categoryId === "all" ? undefined : searchParams.categoryId;

    const products = await prisma.product.findMany({
        where: {
            tenantId: session.user.tenantId,
            isActive: true,
            AND: [
                categoryId ? { categoryId } : {},
                query ? {
                    OR: [
                        { name: { contains: query } },
                        { brand: { contains: query } },
                        { model: { contains: query } },
                        { barcode: { contains: query } },
                    ]
                } : {}
            ]
        },
        include: { category: true },
        orderBy: { name: "asc" },
    });

    const categories = await prisma.productCategory.findMany({
        where: { tenantId: session.user.tenantId },
        orderBy: { name: "asc" },
    });

    const lowStock = products.filter((p) => p.stock <= p.minStock);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Inventario</h1>
                    <p className="text-muted-foreground mt-1">
                        {products.length} productos {query && `encontrados para "${query}"`} · {lowStock.length > 0 && (
                            <span className="text-amber-500 font-medium">{lowStock.length} con stock crítico</span>
                        )}
                    </p>
                </div>
                <InventoryControls products={products} />
            </div>

            <InventoryFilters categories={categories} />

            {/* Low stock alert */}
            {lowStock.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Alertas de Stock Crítico ({lowStock.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {lowStock.map((p) => (
                                <Badge key={p.id} variant="warning" className="gap-1">
                                    {p.name} — {p.stock} {p.unit}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Products table */}
            <Card>
                <CardContent className="pt-6">
                    {products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <Package className="w-12 h-12 mb-4 opacity-30" />
                            <p className="font-medium">No hay productos aún</p>
                            <p className="text-sm mt-1">Agregá tu primer producto para empezar</p>
                            <Button className="mt-4" asChild>
                                <Link href="/dashboard/inventario/nuevo">
                                    <Plus className="w-4 h-4 mr-2" /> Agregar Producto
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Código EAN</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead className="text-right">Costo</TableHead>
                                    <TableHead className="text-right">Precio Venta</TableHead>
                                    <TableHead className="text-center">IVA</TableHead>
                                    <TableHead className="text-center">Stock</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{product.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {[product.brand, product.model].filter(Boolean).join(" · ")}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {product.barcode ?? "—"}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {product.category?.name ?? "—"}
                                        </TableCell>
                                        <TableCell className="text-right text-sm">
                                            {formatCurrency(product.costPrice.toString())}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(product.salePrice.toString())}
                                        </TableCell>
                                        <TableCell className="text-center text-sm">
                                            {Number(product.ivaRate)}%
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStockStatusClass(product.stock, product.minStock)}`}
                                            >
                                                {product.stock} {product.unit}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/dashboard/inventario/${product.id}`}>
                                                    Editar
                                                </Link>
                                            </Button>
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
