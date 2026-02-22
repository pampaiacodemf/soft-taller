"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    Monitor,
    LayoutDashboard,
    Package,
    Wrench,
    ShoppingCart,
    FileText,
    Users,
    Wallet,
    BarChart3,
    Settings,
    LogOut,
    ChevronRight,
    DollarSign,
    Receipt,
} from "lucide-react";
import { cn, getSubscriptionBadgeClass } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    roles?: string[];
    badge?: string;
    submenu?: {
        title: string;
        href: string;
        roles?: string[];
    }[];
}

const navItems: NavItem[] = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Clientes",
        href: "/dashboard/clientes",
        icon: Users,
        roles: ["ADMIN", "ADMIN_STAFF", "SALES"],
        submenu: [
            {
                title: "Cuentas Corrientes",
                href: "/dashboard/cuentas",
                roles: ["ADMIN", "ADMIN_STAFF"],
            }
        ]
    },
    {
        title: "Órdenes de Trabajo",
        href: "/dashboard/ordenes",
        icon: Wrench,
    },
    {
        title: "Inventario",
        href: "/dashboard/inventario",
        icon: Package,
        roles: ["ADMIN", "ADMIN_STAFF", "SALES"],
    },
    {
        title: "Diccionario",
        href: "/dashboard/admin/diccionarios",
        icon: Package,
        roles: ["ADMIN", "ADMIN_STAFF"],
        submenu: [
            {
                title: "Equipos",
                href: "/dashboard/admin/diccionarios",
            },
            {
                title: "Categorías",
                href: "/dashboard/admin/categorias",
            }
        ]
    },
    {
        title: "Venta",
        href: "/dashboard/ventas",
        icon: ShoppingCart,
        roles: ["ADMIN", "ADMIN_STAFF", "SALES"],
    },
    {
        title: "Facturación",
        href: "/dashboard/facturacion",
        icon: FileText,
        roles: ["ADMIN", "ADMIN_STAFF"],
    },
    {
        title: "Presupuestos",
        href: "/dashboard/presupuestos",
        icon: FileText,
    },
    {
        title: "Gastos",
        href: "/dashboard/gastos",
        icon: DollarSign,
        roles: ["ADMIN", "ADMIN_STAFF"],
    },
    {
        title: "Recibos",
        href: "/dashboard/recibos",
        icon: Receipt,
        roles: ["ADMIN", "ADMIN_STAFF"],
    },
    {
        title: "Caja",
        href: "/dashboard/caja",
        icon: Wallet,
        roles: ["ADMIN", "ADMIN_STAFF", "SALES"],
    },
    {
        title: "Reportes",
        href: "/dashboard/reportes",
        icon: BarChart3,
        roles: ["ADMIN", "ADMIN_STAFF"],
        submenu: [
            {
                title: "Resumen",
                href: "/dashboard/reportes",
            },
            {
                title: "Gráficos",
                href: "/dashboard/reportes/graficos",
            }
        ]
    },
];

const adminItems: NavItem[] = [
    {
        title: "Usuarios",
        href: "/dashboard/admin/usuarios",
        icon: Users,
        roles: ["ADMIN"],
    },
    {
        title: "Configuración",
        href: "/dashboard/admin/configuracion",
        icon: Settings,
        roles: ["ADMIN"],
    },
];

interface SidebarProps {
    user: {
        name?: string | null;
        email?: string | null;
        role: string;
        tenantName: string;
        daysRemaining: number;
    };
    isMobile?: boolean;
    onClose?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
    ADMIN: "Administrador",
    ADMIN_STAFF: "Administración",
    SALES: "Ventas",
    TECHNICIAN: "Técnico",
};

export function Sidebar({ user, isMobile, onClose }: SidebarProps) {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard";
        return pathname.startsWith(href);
    };

    const canAccess = (item: NavItem) => {
        if (!item.roles) return true;
        return item.roles.includes(user.role);
    };

    const filteredNav = navItems.filter(canAccess);
    const filteredAdmin = adminItems.filter(canAccess);

    return (
        <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
                <div className="flex items-center justify-center w-9 h-9 bg-sidebar-primary rounded-xl shadow-lg">
                    <Monitor className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">SoftTaller</p>
                    <p className="text-xs text-sidebar-foreground/60 truncate">
                        {user.tenantName}
                    </p>
                </div>
            </div>

            {/* Subscription badge */}
            <div className="px-4 py-3 border-b border-sidebar-border">
                <div
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium",
                        getSubscriptionBadgeClass(user.daysRemaining)
                    )}
                >
                    <div className="w-2 h-2 rounded-full bg-current opacity-70" />
                    {user.daysRemaining > 0 ? (
                        <span>{user.daysRemaining} días restantes</span>
                    ) : (
                        <span>Suscripción vencida</span>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-1">
                {filteredNav.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    const hasSubmenu = item.submenu && item.submenu.length > 0;

                    return (
                        <div key={item.href} className="space-y-1">
                            <Link
                                href={item.href}
                                onClick={() => {
                                    if (onClose) onClose();
                                }}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                                    active
                                        ? "bg-sidebar-primary text-white shadow-md"
                                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                )}
                            >
                                <Icon
                                    className={cn(
                                        "w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110",
                                        active ? "text-white" : "text-sidebar-foreground/50"
                                    )}
                                />
                                <span className="flex-1 truncate">{item.title}</span>
                                {active && !hasSubmenu && (
                                    <ChevronRight className="w-3 h-3 text-white/60" />
                                )}
                            </Link>

                            {hasSubmenu && (
                                <div className="ml-9 space-y-1">
                                    {item.submenu!.filter(sub => !sub.roles || sub.roles.includes(user.role)).map((sub) => {
                                        const subActive = pathname === sub.href;
                                        return (
                                            <Link
                                                key={sub.href}
                                                href={sub.href}
                                                onClick={() => {
                                                    if (onClose) onClose();
                                                }}
                                                className={cn(
                                                    "block px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                                                    subActive
                                                        ? "text-white bg-sidebar-accent/50"
                                                        : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
                                                )}
                                            >
                                                {sub.title}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Admin section */}
                {filteredAdmin.length > 0 && (
                    <>
                        <div className="pt-4 pb-2 px-3">
                            <p className="text-xs font-semibold text-sidebar-foreground/30 uppercase tracking-wider">
                                Administración
                            </p>
                        </div>
                        {filteredAdmin.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => {
                                        if (onClose) onClose();
                                    }}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                                        active
                                            ? "bg-sidebar-primary text-white shadow-md"
                                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            "w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110",
                                            active ? "text-white" : "text-sidebar-foreground/50"
                                        )}
                                    />
                                    <span className="flex-1 truncate">{item.title}</span>
                                </Link>
                            );
                        })}
                    </>
                )}
            </nav>

            {/* User footer */}
            <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sidebar-accent text-sidebar-foreground text-sm font-bold uppercase">
                        {user.name?.[0] ?? "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {user.name}
                        </p>
                        <p className="text-xs text-sidebar-foreground/50 truncate">
                            {ROLE_LABELS[user.role] ?? user.role}
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full justify-start gap-3 text-sidebar-foreground/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                </Button>
            </div>
        </div>
    );
}
