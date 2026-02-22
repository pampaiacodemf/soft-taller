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

export function GastosFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get("query") || "");
    const [category, setCategory] = useState(searchParams.get("category") || "all");

    const debouncedSearch = useDebounce(search, 400);

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

    useEffect(() => {
        const query = createQueryString({ query: debouncedSearch });
        router.push(`${pathname}?${query}`);
    }, [debouncedSearch, pathname, router, createQueryString]);

    const handleCategoryChange = (value: string) => {
        setCategory(value);
        const query = createQueryString({ category: value });
        router.push(`${pathname}?${query}`);
    };

    const clearSearch = () => {
        setSearch("");
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar en descripción..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-9"
                />
                {search && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="w-full sm:w-[200px]">
                <Select value={category} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las categorías</SelectItem>
                        <SelectItem value="ALQUILER">Alquiler</SelectItem>
                        <SelectItem value="MERCADERIA">Mercadería</SelectItem>
                        <SelectItem value="SERVICIOS">Servicios</SelectItem>
                        <SelectItem value="PERSONAL">Personal</SelectItem>
                        <SelectItem value="LIMPIEZA">Limpieza</SelectItem>
                        <SelectItem value="OTROS">Otros</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
