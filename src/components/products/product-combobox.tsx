"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface Product {
    id: string;
    name: string;
    salePrice: number;
    ivaRate: number;
}

interface ProductComboboxProps {
    onSelectProduct: (product: Product) => void;
    products: Product[];
}

export function ProductCombobox({ onSelectProduct, products }: ProductComboboxProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[300px] justify-between font-normal text-left truncate"
                >
                    <span className="truncate text-muted-foreground">
                        + Seleccionar del inventario...
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder="Buscar por repuesto, código o marca..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        <CommandEmpty className="p-4 text-center text-sm">
                            No se encontró el repuesto en Inventario.
                        </CommandEmpty>
                        <CommandGroup>
                            {products.map((p) => (
                                <CommandItem
                                    key={p.id}
                                    value={p.name}
                                    onSelect={() => {
                                        onSelectProduct(p);
                                        setOpen(false);
                                        setSearch("");
                                    }}
                                >
                                    <div className="flex flex-col">
                                        <span>{p.name}</span>
                                        <span className="text-xs text-muted-foreground font-medium">${p.salePrice}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
