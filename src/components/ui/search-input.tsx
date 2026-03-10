"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps {
    placeholder?: string;
    className?: string;
}

export function SearchInput({ placeholder = "Buscar...", className }: SearchInputProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [value, setValue] = useState(searchParams.get("q") || "");

    useEffect(() => {
        const timeout = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set("q", value);
            } else {
                params.delete("q");
            }

            startTransition(() => {
                router.replace(`${pathname}?${params.toString()}`);
            });
        }, 500);

        return () => clearTimeout(timeout);
    }, [value, pathname, router, searchParams]);

    return (
        <div className={cn("relative w-full max-w-sm", className)}>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                    <Search className="h-4 w-4" />
                )}
            </div>
            <Input
                placeholder={placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="pl-9 pr-9"
            />
            {value && (
                <button
                    onClick={() => setValue("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
