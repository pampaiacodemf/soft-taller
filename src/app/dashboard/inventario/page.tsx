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

export const metadata: Metadata = { title: "Inventario" };

import { SearchInput } from "@/components/ui/search-input";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { Prisma } from "@prisma/client";
import { DeleteProductButton } from "./delete-product-button";

export default async function InventarioPage({
    searchParams,
}: {
    searchParams?: { q?: string; category?: string; stock?: string };
}) {
    const session = await auth();
    if (!session) return null;

    const query = searchParams?.q || "";
    const categoryFilter = searchParams?.category || "";
    const stockFilter = searchParams?.stock || "";

    // Build Prisma query
    const whereClause: Prisma.ProductWhereInput = {
        tenantId: session.user.tenantId,
        isActive: true,
    };

    if (categoryFilter) {
        whereClause.categoryId = categoryFilter;
    }

    if (stockFilter === "low") {
        whereClause.stock = { lte: prisma.product.fields.minStock };
    }

    if (query) {
        whereClause.OR = [
            { name: { contains: query } },
            { barcode: { contains: query } },
            { brand: { contains: query } },
            { model: { contains: query } },
            { description: { contains: query } },
        ];
    }

    const [products, categories] = await Promise.all([
        prisma.product.findMany({
            where: whereClause,
            include: { category: true },
            orderBy: { name: "asc" },
            take: 100,
        }),
        prisma.productCategory.findMany({
            where: { tenantId: session.user.tenantId },
            orderBy: { name: "asc" },
        })
    ]);

    const lowStock = products.filter((p) => p.stock <= p.minStock);

    // Map categories for FilterTabs
    const categoryOptions: Record<string, string> = {};
    categories.forEach(c => categoryOptions[c.id] = c.name);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Inventario</h1>
                    <p className="text-muted-foreground mt-1">
                        {products.length} productos · {lowStock.length > 0 && (
                            <span className="text-amber-500 font-medium">{lowStock.length} con stock crítico</span>
                        )}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <SearchInput placeholder="Nombre, código o marca..." className="w-full sm:w-80" />
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" className="flex-1 sm:flex-none" asChild>
                            <Link href="/dashboard/inventario/escanear">
                                <ScanBarcode className="w-4 h-4 mr-2" />
                                Escanear
                            </Link>
                        </Button>
                        <Button className="flex-1 sm:flex-none" asChild>
                            <Link href="/dashboard/inventario/nuevo">
                                <Plus className="w-4 h-4 mr-2" />
                                Nuevo
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 overflow-x-auto scrollbar-hide">
                        <FilterTabs 
                            paramName="category" 
                            options={categoryOptions} 
                            allLabel="Todas las categorías"
                        />
                    </div>
                    <FilterTabs 
                        paramName="stock" 
                        options={{ "low": "Stock Bajo" }}
                        allLabel="Todo el Stock"
                    />
                </div>
            </div>

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
                            {lowStock.map((p: any) => (
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
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/dashboard/inventario/${product.id}`}>
                                                        Editar
                                                    </Link>
                                                </Button>
                                                {["ADMIN", "SUPER_ADMIN"].includes(session.user.role) && (
                                                    <DeleteProductButton id={product.id} name={product.name} />
                                                )}
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
