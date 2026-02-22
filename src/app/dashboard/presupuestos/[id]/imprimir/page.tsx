"use client";

import { useEffect } from "react";

export default function PrintBudgetPage() {
    useEffect(() => {
        // Just trigger print and go back or close
        window.print();
        setTimeout(() => {
            window.history.back();
        }, 500);
    }, []);

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-white text-black p-4">
            <h1 className="text-xl font-bold animate-pulse">Preparando documento para imprimir...</h1>
        </div>
    );
}
