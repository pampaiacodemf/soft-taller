"use client";

import { useRef, useState, useCallback } from "react";
import { Camera, X, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface CapturedPhoto {
    id: string;
    url: string; // object URL for preview
    base64: string;
    mimeType: string;
}

interface CameraCaptureProps {
    maxPhotos?: number;
    onPhotosChange: (photos: CapturedPhoto[]) => void;
    label?: string;
}

export function CameraCapture({
    maxPhotos = 4,
    onPhotosChange,
    label = "Fotos",
}: CameraCaptureProps) {
    const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const startCamera = useCallback(async () => {
        try {
            // First try with environment facing mode
            let mediaStream: MediaStream;
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" },
                    audio: false,
                });
            } catch (e) {
                // Fallback to any available video device
                console.warn("Environment camera failed, trying default:", e);
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false,
                });
            }

            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play();
            }
        } catch (err) {
            console.error("Camera Capture Error:", err);
            // Fallback to file input if camera completely unavailable
            setCameraOpen(false);
            fileInputRef.current?.click();
        }
    }, []);

    const stopCamera = useCallback(() => {
        stream?.getTracks().forEach((t) => t.stop());
        setStream(null);
    }, [stream]);

    const handleOpenCamera = () => {
        if (photos.length >= maxPhotos) return;
        setCameraOpen(true);
        setTimeout(startCamera, 100);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0);

        const base64 = canvas.toDataURL("image/jpeg", 0.85);
        const newPhoto: CapturedPhoto = {
            id: Math.random().toString(36).slice(2),
            url: base64,
            base64,
            mimeType: "image/jpeg",
        };

        const updated = [...photos, newPhoto];
        setPhotos(updated);
        onPhotosChange(updated);

        stopCamera();
        setCameraOpen(false);
    };

    const removePhoto = (id: string) => {
        const updated = photos.filter((p) => p.id !== id);
        setPhotos(updated);
        onPhotosChange(updated);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        files.slice(0, maxPhotos - photos.length).forEach((file) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const base64 = ev.target?.result as string;
                const newPhoto: CapturedPhoto = {
                    id: Math.random().toString(36).slice(2),
                    url: base64,
                    base64,
                    mimeType: file.type,
                };
                setPhotos((prev) => {
                    const updated = [...prev, newPhoto];
                    onPhotosChange(updated);
                    return updated;
                });
            };
            reader.readAsDataURL(file);
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="space-y-3">
            <p className="text-sm font-medium">
                {label}{" "}
                <span className="text-muted-foreground">
                    ({photos.length}/{maxPhotos})
                </span>
            </p>

            <div className="grid grid-cols-4 gap-2">
                {photos.map((photo) => (
                    <div key={photo.id} className="relative group aspect-square">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={photo.url}
                            alt="Foto"
                            className="w-full h-full object-cover rounded-lg border"
                        />
                        <button
                            type="button"
                            onClick={() => removePhoto(photo.id)}
                            className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                ))}

                {photos.length < maxPhotos && (
                    <button
                        type="button"
                        onClick={handleOpenCamera}
                        className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                        <ImagePlus className="w-5 h-5" />
                        <span className="text-xs">Agregar</span>
                    </button>
                )}
            </div>

            {/* Hidden file input fallback */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Camera dialog */}
            <Dialog
                open={cameraOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        stopCamera();
                        setCameraOpen(false);
                    }
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Camera className="w-5 h-5" />
                            Capturar Foto
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                playsInline
                                muted
                                autoPlay
                            />
                        </div>

                        <canvas ref={canvasRef} className="hidden" />

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                onClick={capturePhoto}
                                className="flex-1"
                            >
                                <Camera className="w-4 h-4 mr-2" />
                                Capturar
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    stopCamera();
                                    setCameraOpen(false);
                                }}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
