import { auth } from "@/auth";
import { getExpenses } from "@/lib/actions/reports";
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

import { GastosFilters } from "@/components/reports/gastos-filters";

interface GastosPageProps {
    searchParams: {
        query?: string;
        category?: string;
    };
}

export default async function GastosPage({ searchParams }: GastosPageProps) {
    const session = await auth();
    if (!session) return null;

    const query = searchParams.query || "";
    const filterCategory = searchParams.category === "all" ? undefined : searchParams.category;

    const allExpenses = await getExpenses();

    // Filter in-memory
    const expenses = allExpenses.filter(e => {
        const matchesQuery = !query || e.description.toLowerCase().includes(query.toLowerCase());
        const matchesCategory = !filterCategory || e.category === filterCategory;
        return matchesQuery && matchesCategory;
    });

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gastos</h1>
                    <p className="text-muted-foreground mt-1">
                        {expenses.length} gastos registrados {query && `encontrados para "${query}"`}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Card className="bg-red-50 border-red-200">
                        <CardContent className="py-2 px-4 text-center">
                            <p className="text-[10px] uppercase font-bold text-red-600">Total Seleccionado</p>
                            <p className="text-xl font-black text-red-700">{formatCurrency(total)}</p>
                        </CardContent>
                    </Card>
                    <ExpenseForm />
                </div>
            </div>

            <GastosFilters />

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
                                expenses.map((e) => (
                                    <TableRow key={e.id}>
                                        <TableCell>{formatDate(e.date)}</TableCell>
                                        <TableCell>
                                            <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold uppercase">
                                                {e.category}
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
