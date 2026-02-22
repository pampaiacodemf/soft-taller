"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Camera, X, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface BarcodeScannerProps {
    onScan: (code: string) => void;
    open: boolean;
    onClose: () => void;
}

export function BarcodeScanner({ onScan, open, onClose }: BarcodeScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

    const startScanning = useCallback(async (deviceId?: string) => {
        if (!videoRef.current) return;

        try {
            setError(null);
            setScanning(true);

            if (readerRef.current) {
                try {
                    BrowserMultiFormatReader.releaseAllStreams();
                } catch (e) {
                    console.warn("Error releasing streams:", e);
                }
            }

            const reader = new BrowserMultiFormatReader();
            readerRef.current = reader;

            // List available video devices if not already done
            const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
            setDevices(videoInputDevices);

            if (videoInputDevices.length === 0) {
                throw new Error("No se encontraron cámaras disponibles.");
            }

            let deviceToUse = deviceId;

            if (!deviceToUse) {
                // Prefer back camera if available
                const backCamera = videoInputDevices.find(device =>
                    device.label.toLowerCase().includes('back') ||
                    device.label.toLowerCase().includes('trasera') ||
                    device.label.toLowerCase().includes('environment')
                );
                deviceToUse = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId;
                setSelectedDeviceId(deviceToUse);
            }

            await reader.decodeFromVideoDevice(
                deviceToUse,
                videoRef.current,
                (result, err) => {
                    if (result) {
                        const code = result.getText();
                        onScan(code);
                        onClose();
                    }
                }
            );
        } catch (err: any) {
            console.error("Camera Error:", err);
            setError(
                err.message || "No se pudo acceder a la cámara. Verificá los permisos del navegador."
            );
            setScanning(false);
        }
    }, [onScan, onClose]);

    const stopScanning = useCallback(() => {
        if (readerRef.current) {
            try {
                BrowserMultiFormatReader.releaseAllStreams();
            } catch (e) {
                console.warn("Error releasing streams standard:", e);
            }
            readerRef.current = null;
        }
        setScanning(false);
    }, []);

    useEffect(() => {
        if (open) {
            startScanning();
        } else {
            stopScanning();
        }
        return () => stopScanning();
    }, [open, startScanning, stopScanning]);

    const handleDeviceChange = (deviceId: string) => {
        setSelectedDeviceId(deviceId);
        stopScanning();
        setTimeout(() => startScanning(deviceId), 100);
    };

    const handleClose = () => {
        stopScanning();
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="w-5 h-5" />
                        Escanear Código de Barras
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {devices.length > 1 && (
                        <div className="space-y-1.5">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Seleccionar Cámara</p>
                            <Select value={selectedDeviceId} onValueChange={handleDeviceChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Cambiá de cámara..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {devices.map((device) => (
                                        <SelectItem key={device.deviceId} value={device.deviceId}>
                                            {device.label || `Cámara ${device.deviceId.slice(0, 5)}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3]">
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            playsInline
                            muted
                        />
                        {/* Scan guide overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative w-4/5 h-24">
                                {/* Corner brackets */}
                                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-green-400" />
                                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-green-400" />
                                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-green-400" />
                                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-green-400" />
                                {/* Scan line */}
                                {scanning && (
                                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-green-400 shadow-[0_0_8px_2px_rgba(74,222,128,0.4)] animate-bounce" />
                                )}
                            </div>
                        </div>
                        {!scanning && !error && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-6">
                                <div className="text-white text-center">
                                    <ScanLine className="w-8 h-8 mx-auto mb-2 opacity-70 animate-pulse" />
                                    <p className="text-sm font-medium">Iniciando cámara...</p>
                                    <p className="text-[10px] mt-2 opacity-60">
                                        Si esto tarda, asegurate de dar permisos y que no esté en uso por otra app.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                            {error}
                            <p className="mt-1 text-xs text-red-500">
                                Podés ingresar el código manualmente en el campo EAN.
                            </p>
                        </div>
                    )}

                    <p className="text-sm text-muted-foreground text-center">
                        Apuntá la cámara al código de barras del producto
                    </p>

                    <Button variant="outline" onClick={handleClose} className="w-full">
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
