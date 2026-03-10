import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

export const metadata: Metadata = {
    title: {
        template: "%s | SoftTaller",
        default: "SoftTaller — Sistema de Gestión de Talleres",
    },
    description:
        "Sistema ERP para talleres de reparación y venta de equipos informáticos.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es" suppressHydrationWarning className="dark">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
            </head>
            <body className={`${inter.variable} font-sans antialiased`}>
                {children}
                <Toaster />
            </body>
        </html>
    );
}
