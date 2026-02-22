"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { CustomerForm } from "@/app/dashboard/clientes/customer-form";

interface Customer {
    id: string;
    name: string;
    cuit?: string | null;
}

interface CustomerComboboxProps {
    value: string;
    onChange: (value: string) => void;
    customers: Customer[];
}

export function CustomerCombobox({ value, onChange, customers: initialCustomers }: CustomerComboboxProps) {
    const [open, setOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [customers, setCustomers] = useState(initialCustomers);

    const selectedCustomer = customers.find((c) => c.id === value);

    const handleCustomerSaved = (savedCustomer: any) => {
        // Optimistically add to list and select it
        setCustomers(prev => [...prev, savedCustomer].sort((a, b) => a.name.localeCompare(b.name)));
        onChange(savedCustomer.id);
        setDialogOpen(false);
        setOpen(false);
    };

    return (
        <div className="flex gap-2 w-full">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="flex-1 justify-between font-normal text-left truncate"
                    >
                        <span className="truncate">
                            {selectedCustomer
                                ? `${selectedCustomer.name}${selectedCustomer.cuit ? ` · CUIT: ${selectedCustomer.cuit}` : ""}`
                                : "Buscar o escribir cliente..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Buscar por nombre o número..." />
                        <CommandList>
                            <CommandEmpty className="p-4 text-center text-sm">
                                No se encontró el cliente.
                            </CommandEmpty>
                            <CommandGroup>
                                {customers.map((c) => (
                                    <CommandItem
                                        key={c.id}
                                        value={`${c.name} ${c.cuit || ""}`}
                                        onSelect={() => {
                                            onChange(c.id === value ? "" : c.id);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === c.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {c.name}{c.cuit ? ` · CUIT: ${c.cuit}` : ""}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="secondary" size="icon" title="Cargar Nuevo Cliente al instante">
                        <Plus className="w-4 h-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Nuevo Cliente (Carga Rápida)</DialogTitle>
                    </DialogHeader>
                    {/* Reuse the existing customer form. Pass onSubmit override or let it handle its own server action. 
                        Since the form already redirects on success by default, we'll wrap it or pass a callback. */}
                    <CustomerForm
                        onSuccessCallback={(res: any) => {
                            handleCustomerSaved(res);
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
