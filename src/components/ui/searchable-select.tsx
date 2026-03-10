"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
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
import { useToast } from "@/components/ui/use-toast";
import { addDictionaryItem, DictionaryType } from "@/lib/actions/dictionary";

interface SearchableSelectProps {
    type: DictionaryType;
    value: string;
    onChange: (value: string) => void;
    options: { id: string; value: string }[];
    placeholder?: string;
    emptyText?: string;
    disabled?: boolean;
}

export function SearchableSelect({
    type,
    value,
    onChange,
    options: initialOptions,
    placeholder = "Seleccionar...",
    emptyText = "Sin resultados.",
    disabled = false
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState(initialOptions);
    const [search, setSearch] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const { toast } = useToast();

    // Actual selected full name or value
    const selectedText = value || placeholder;

    const handleCreate = async () => {
        if (!search.trim()) return;
        setIsCreating(true);

        try {
            const res = await addDictionaryItem(type, search);
            if (res.error) {
                toast({ title: "Error", description: res.error, variant: "destructive" });
            } else if (res.item) {
                // Instantly append to options
                setOptions(prev => {
                    const exists = prev.find(p => (p.value || "").toLowerCase() === (res.item!.value || "").toLowerCase());
                    if (exists) return prev;
                    return [...prev, { id: res.item!.id, value: res.item!.value }].sort((a, b) => a.value.localeCompare(b.value));
                });
                onChange(res.item.value);
                setSearch("");
                setOpen(false);
                toast({ title: "Agregado al diccionario", description: res.item.value });
            }
        } catch (error) {
            toast({ title: "Error fatal", description: "Falló la creación.", variant: "destructive" });
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal text-left"
                    disabled={disabled}
                >
                    <span className="truncate">{selectedText}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder="Buscar..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        <CommandEmpty className="py-6 text-center text-sm">
                            {emptyText}
                            {search.length > 1 && (
                                <div className="mt-4">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="w-3/4 mx-auto"
                                        onClick={handleCreate}
                                        disabled={isCreating}
                                    >
                                        {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" /> Agregar "{search}"</>}
                                    </Button>
                                </div>
                            )}
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((opt) => (
                                <CommandItem
                                    key={opt.id}
                                    value={opt.value}
                                    onSelect={(currentValue) => {
                                        const valStr = value || "";
                                        onChange(currentValue === valStr.toLowerCase() ? "" : opt.value);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            (value || "").toLowerCase() === (opt.value || "").toLowerCase() ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {opt.value}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
