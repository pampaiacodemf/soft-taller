"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FilterTabsProps {
    paramName: string;
    options: Record<string, string>;
    colors?: Record<string, string>;
    className?: string;
    allLabel?: string;
}

export function FilterTabs({ 
    paramName, 
    options, 
    colors, 
    className,
    allLabel = "Todos"
}: FilterTabsProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentValue = searchParams.get(paramName) || "";

    const handleFilter = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(paramName, value);
        } else {
            params.delete(paramName);
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className={cn("flex flex-wrap gap-2 pb-2", className)}>
            <Button
                variant={currentValue === "" ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilter("")}
                className="rounded-full px-4 h-8 text-xs font-semibold"
            >
                {allLabel}
            </Button>
            {Object.entries(options).map(([val, label]) => {
                const active = currentValue === val;
                return (
                    <Button
                        key={val}
                        variant={active ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFilter(val)}
                        className={cn(
                            "rounded-full px-4 h-8 text-xs font-semibold whitespace-nowrap",
                            !active && colors?.[val] ? `hover:opacity-100 ${colors[val]}` : ""
                        )}
                    >
                        {label}
                    </Button>
                );
            })}
        </div>
    );
}
