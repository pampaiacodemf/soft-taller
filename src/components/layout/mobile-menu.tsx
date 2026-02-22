"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";

interface MobileMenuProps {
    user: {
        name?: string | null;
        email?: string | null;
        role: string;
        tenantName: string;
        daysRemaining: number;
    };
}

export function MobileMenu({ user }: MobileMenuProps) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Abrir menú</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r-0">
                <SheetHeader className="sr-only">
                    <SheetTitle>Menú de Navegación</SheetTitle>
                </SheetHeader>
                <Sidebar user={user} isMobile onClose={() => setOpen(false)} />
            </SheetContent>
        </Sheet>
    );
}
