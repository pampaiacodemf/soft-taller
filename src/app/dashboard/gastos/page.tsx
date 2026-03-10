import { auth } from "@/auth";
import { getExpenses, getExpenseCategories } from "@/lib/actions/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Receipt } from "lucide-react";
import { ExpenseForm } from "./expense-form";

import { SearchInput } from "@/components/ui/search-input";
import { FilterTabs } from "@/components/ui/filter-tabs";

export default async function GastosPage({
    searchParams,
}: {
    searchParams?: { q?: string; categoryId?: string };
}) {
    const session = await auth();
    if (!session) return null;

    const query = searchParams?.q || "";
    const categoryId = searchParams?.categoryId || "";

    const [allExpenses, categories] = await Promise.all([
        getExpenses(),
        getExpenseCategories(),
    ]);

    // Apply filtering (ideally this should be moved to the server action)
    let expenses = allExpenses as any[];
    if (query) {
        expenses = expenses.filter(e => 
            e.description.toLowerCase().includes(query.toLowerCase()) ||
            e.category?.name.toLowerCase().includes(query.toLowerCase())
        );
    }
    if (categoryId) {
        expenses = expenses.filter(e => e.categoryId === categoryId);
    }

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    const categoryOptions: Record<string, string> = {};
    (categories as any[]).forEach(c => categoryOptions[c.id] = c.name);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Gastos</h1>
                    <p className="text-muted-foreground mt-1">{expenses.length} registros</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <SearchInput placeholder="Buscar descripción..." className="w-full sm:w-64" />
                    <ExpenseForm categories={categories} />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 overflow-x-auto scrollbar-hide">
                    <FilterTabs 
                        paramName="categoryId" 
                        options={categoryOptions} 
                        allLabel="Todas las categorías"
                    />
                </div>
                <Card className="bg-red-50 border-red-200 flex-shrink-0">
                    <CardContent className="py-2 px-4 text-center">
                        <p className="text-[10px] uppercase font-bold text-red-600">Filtrado Mensual</p>
                        <p className="text-xl font-black text-red-700">{formatCurrency(total)}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">
                                        No hay gastos registrados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                (expenses as any[]).map((e) => (
                                    <TableRow key={e.id}>
                                        <TableCell>{formatDate(e.date)}</TableCell>
                                        <TableCell>
                                            <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold uppercase">
                                                {e.category?.name || "Sin Categoría"}
                                            </span>
                                        </TableCell>
                                        <TableCell>{e.description}</TableCell>
                                        <TableCell className="text-right font-bold text-red-600">
                                            -{formatCurrency(e.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
