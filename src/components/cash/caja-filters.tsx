"use client";

import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/use-debounce";

export function CajaFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [method, setMethod] = useState(searchParams.get("method") || "all");
    const [type, setType] = useState(searchParams.get("type") || "all");

    const createQueryString = useCallback(
        (params: Record<string, string | null>) => {
            const newSearchParams = new URLSearchParams(searchParams.toString());

            Object.entries(params).forEach(([key, value]) => {
                if (value === null || value === "all" || value === "") {
                    newSearchParams.delete(key);
                } else {
                    newSearchParams.set(key, value);
                }
            });

            return newSearchParams.toString();
        },
        [searchParams]
    );

    const handleMethodChange = (value: string) => {
        setMethod(value);
        const query = createQueryString({ method: value });
        router.push(`${pathname}?${query}`);
    };

    const handleTypeChange = (value: string) => {
        setType(value);
        const query = createQueryString({ type: value });
        router.push(`${pathname}?${query}`);
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="w-full sm:w-[200px]">
                <Select value={type} onValueChange={handleTypeChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Tipo de Movimiento" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        <SelectItem value="IN">Ingresos</SelectItem>
                        <SelectItem value="OUT">Egresos</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="w-full sm:w-[200px]">
                <Select value={method} onValueChange={handleMethodChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Método de Pago" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los métodos</SelectItem>
                        <SelectItem value="CASH">Efectivo</SelectItem>
                        <SelectItem value="DEBIT">Débito</SelectItem>
                        <SelectItem value="CREDIT">Crédito</SelectItem>
                        <SelectItem value="TRANSFER">Transferencia</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
