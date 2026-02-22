"use client";

import { useState } from "react";
import { Plus, ScanBarcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

interface InventoryControlsProps {
    products: { id: string; barcode: string | null }[];
}

export function InventoryControls({ products }: InventoryControlsProps) {
    const [scannerOpen, setScannerOpen] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleScan = (code: string) => {
        const product = products.find((p) => p.barcode === code);
        if (product) {
            toast({
                title: "Producto encontrado",
                description: `Redirigiendo a edición...`,
            });
            router.push(`/dashboard/inventario/${product.id}`);
        } else {
            toast({
                title: "No encontrado",
                description: `El código ${code} no coincide con ningún producto. ¿Deseás crearlo?`,
                variant: "destructive",
                action: (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/dashboard/inventario/nuevo?barcode=${code}`)}
                    >
                        Crear Nuevo
                    </Button>
                ),
            });
        }
    };

    return (
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => setScannerOpen(true)}>
                <ScanBarcode className="w-4 h-4 mr-2" />
                Escanear
            </Button>
            <Button asChild>
                <Link href="/dashboard/inventario/nuevo">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Producto
                </Link>
            </Button>

            <BarcodeScanner
                open={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onScan={handleScan}
            />
        </div>
    );
}
