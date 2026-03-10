"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    LayoutDashboard, Package, Wrench, ShoppingCart, FileText,
    Users, Wallet, BarChart3, Settings, LogOut, ChevronRight,
    DollarSign, Receipt, Flame, Zap, Database, Crown, Calendar,
} from "lucide-react";
import { cn, getSubscriptionBadgeClass } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    roles?: string[];
    badge?: string;
    submenu?: { title: string; href: string; roles?: string[] }[];
}

const navItems: NavItem[] = [
    { title: "Dashboard",          href: "/dashboard",                   icon: LayoutDashboard },
    {
        title: "Clientes",         href: "/dashboard/clientes",          icon: Users,
        roles: ["ADMIN", "ADMIN_STAFF", "SALES"],
        submenu: [{ title: "Cuentas Corrientes", href: "/dashboard/cuentas", roles: ["ADMIN", "ADMIN_STAFF"] }],
    },
    { title: "Órdenes de Trabajo", href: "/dashboard/ordenes",           icon: Wrench },
    { title: "Turnos",             href: "/dashboard/turnos",            icon: Calendar },
    { title: "Presupuestos",       href: "/dashboard/presupuestos",      icon: FileText },
    { title: "Inventario",         href: "/dashboard/inventario",        icon: Package,      roles: ["ADMIN", "ADMIN_STAFF", "SALES", "TECHNICIAN"] },
    { title: "Diccionarios",       href: "/dashboard/admin/diccionarios",icon: Package,      roles: ["ADMIN", "ADMIN_STAFF"] },
    { title: "Proveedores",        href: "/dashboard/proveedores",       icon: ShoppingCart, roles: ["ADMIN", "ADMIN_STAFF"] },
    { title: "Venta",              href: "/dashboard/ventas",            icon: ShoppingCart, roles: ["ADMIN", "ADMIN_STAFF", "SALES"] },
    { title: "Gastos",             href: "/dashboard/gastos",            icon: DollarSign,   roles: ["ADMIN", "ADMIN_STAFF"] },
    { title: "Recibos",            href: "/dashboard/recibos",           icon: Receipt,      roles: ["ADMIN", "ADMIN_STAFF"] },
    { title: "Facturación",        href: "/dashboard/facturacion",       icon: FileText,     roles: ["ADMIN", "ADMIN_STAFF"] },
    { title: "Caja",               href: "/dashboard/caja",              icon: Wallet,       roles: ["ADMIN", "ADMIN_STAFF", "SALES"] },
    { title: "Reportes",           href: "/dashboard/reportes",          icon: BarChart3,    roles: ["ADMIN", "ADMIN_STAFF"] },
];

const adminItems: NavItem[] = [
    { title: "Usuarios",      href: "/dashboard/admin/usuarios",      icon: Users,    roles: ["ADMIN", "SUPER_ADMIN"] },
    { title: "Configuración", href: "/dashboard/admin/configuracion", icon: Settings, roles: ["ADMIN", "SUPER_ADMIN"] },
];

// SuperAdmin exclusive items — invisible to all other roles
const superAdminItems = [
    { title: "Perfil SúperAdmin",      href: "/dashboard/superadmin/perfil",     icon: Crown },
    { title: "Gestión de Usuarios",   href: "/dashboard/admin/usuarios",         icon: Users },
    { title: "Membresía",             href: "/dashboard/superadmin/membresia",   icon: Zap },
    { title: "Backup / Restaurar",    href: "/dashboard/superadmin/backup",     icon: Database },
];

interface SidebarProps {
    user: {
        name?: string | null;
        email?: string | null;
        role: string;
        tenantName: string;
        daysRemaining: number;
    };
}

const ROLE_LABELS: Record<string, string> = {
    ADMIN:       "Administrador",
    ADMIN_STAFF: "Administración",
    SALES:       "Ventas",
    TECHNICIAN:  "Técnico",
    SUPER_ADMIN: "SúperAdmin",
};

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard";
        return pathname.startsWith(href);
    };

    const canAccess = (item: NavItem) => {
        if (user.role === "SUPER_ADMIN") return true;
        if (!item.roles) return true;
        return item.roles.includes(user.role);
    };

    const filteredNav = navItems.filter(canAccess);
    const filteredAdmin = adminItems.filter(canAccess);

    return (
        <div
            className="flex flex-col h-full text-sidebar-foreground"
            style={{
                background: "linear-gradient(180deg, #080808 0%, #0d0d0d 100%)",
                borderRight: "1px solid #1a1a1a",
            }}
        >
            {/* ── Logo / Brand ── */}
            <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: "1px solid #1a1a1a" }}>
                <div
                    className="flex items-center justify-center w-10 h-10 rounded-xl shadow-fire"
                    style={{ background: "linear-gradient(135deg, #f97316, #dc2626)" }}
                >
                    <Flame className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p
                        className="text-sm font-bold truncate"
                        style={{
                            background: "linear-gradient(90deg, #f97316, #fb923c)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            letterSpacing: "0.05em",
                        }}
                    >
                        SOFTTALLER
                    </p>
                    <p className="text-xs truncate" style={{ color: "#4a4a4a" }}>
                        {user.tenantName}
                    </p>
                </div>
            </div>

            {/* ── Subscription badge ── */}
            <div className="px-3 py-2.5" style={{ borderBottom: "1px solid #1a1a1a" }}>
                <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
                    style={
                        user.daysRemaining > 10
                            ? { background: "rgba(249,115,22,0.1)", color: "#f97316", border: "1px solid rgba(249,115,22,0.2)" }
                            : user.daysRemaining > 0
                                ? { background: "rgba(220,38,38,0.1)", color: "#f87171", border: "1px solid rgba(220,38,38,0.25)" }
                                : { background: "rgba(127,29,29,0.2)", color: "#ef4444", border: "1px solid rgba(127,29,29,0.4)" }
                    }
                >
                    <Zap className="w-3 h-3 flex-shrink-0" />
                    {user.daysRemaining > 0 ? (
                        <span>{user.daysRemaining} días restantes</span>
                    ) : (
                        <span>Suscripción vencida</span>
                    )}
                </div>
            </div>

            {/* ── Navigation ── */}
            <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-4 space-y-0.5">
                {filteredNav.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    const hasSubmenu = item.submenu && item.submenu.length > 0;

                    return (
                        <div key={item.href} className="space-y-0.5">
                            <Link
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative",
                                    active
                                        ? "text-white"
                                        : "hover:text-orange-400"
                                )}
                                style={active ? {
                                    background: "linear-gradient(90deg, rgba(249,115,22,0.18) 0%, rgba(249,115,22,0.05) 100%)",
                                    borderLeft: "2px solid #f97316",
                                    paddingLeft: "10px",
                                    color: "#f97316",
                                } : {
                                    color: "#5a5a5a",
                                    borderLeft: "2px solid transparent",
                                }}
                            >
                                <Icon
                                    className={cn(
                                        "w-4 h-4 flex-shrink-0 transition-all duration-150",
                                        active ? "text-orange-400" : "text-zinc-600 group-hover:text-orange-500 group-hover:scale-110"
                                    )}
                                />
                                <span className={cn("flex-1 truncate", active ? "text-orange-300" : "group-hover:text-orange-300")}>{item.title}</span>
                                {active && !hasSubmenu && (
                                    <ChevronRight className="w-3 h-3 text-orange-500/60 flex-shrink-0" />
                                )}
                            </Link>

                            {hasSubmenu && (
                                <div className="ml-8 space-y-0.5">
                                    {item.submenu!.filter(sub => !sub.roles || sub.roles.includes(user.role)).map((sub) => {
                                        const subActive = pathname === sub.href;
                                        return (
                                            <Link
                                                key={sub.href}
                                                href={sub.href}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all relative"
                                                style={subActive ? {
                                                    color: "#f97316",
                                                    background: "rgba(249,115,22,0.08)",
                                                    borderLeft: "2px solid rgba(249,115,22,0.5)",
                                                } : {
                                                    color: "#4a4a4a",
                                                    borderLeft: "2px solid transparent",
                                                }}
                                            >
                                                <div
                                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                    style={{ background: subActive ? "#f97316" : "#333" }}
                                                />
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
                        <div className="pt-5 pb-2 px-3">
                            <p
                                className="text-[10px] font-bold uppercase tracking-widest"
                                style={{ color: "#2f2f2f" }}
                            >
                                ── Admin
                            </p>
                        </div>
                        {filteredAdmin.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group"
                                    style={active ? {
                                        background: "linear-gradient(90deg, rgba(220,38,38,0.15) 0%, rgba(220,38,38,0.04) 100%)",
                                        borderLeft: "2px solid #dc2626",
                                        paddingLeft: "10px",
                                        color: "#f87171",
                                    } : {
                                        color: "#4a4a4a",
                                        borderLeft: "2px solid transparent",
                                    }}
                                >
                                    <Icon
                                        className={cn(
                                            "w-4 h-4 flex-shrink-0 transition-all duration-150",
                                            active ? "text-red-400" : "text-zinc-700 group-hover:text-red-400 group-hover:scale-110"
                                        )}
                                    />
                                    <span className={cn("flex-1 truncate", active ? "text-red-300" : "group-hover:text-red-300")}>{item.title}</span>
                                </Link>
                            );
                        })}
                    </>
                )}
                {/* ── SUPER ADMIN exclusive section — invisible to all other roles ── */}
                {user.role === "SUPER_ADMIN" && (
                    <>
                        <div className="pt-5 pb-2 px-3">
                            <p
                                className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"
                                style={{ color: "#a855f7" }}
                            >
                                <Crown className="w-3 h-3" /> SúperAdmin
                            </p>
                        </div>
                        {superAdminItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group"
                                    style={active ? {
                                        background: "linear-gradient(90deg, rgba(168,85,247,0.18) 0%, rgba(168,85,247,0.04) 100%)",
                                        borderLeft: "2px solid #a855f7",
                                        paddingLeft: "10px",
                                        color: "#d8b4fe",
                                    } : {
                                        color: "#5a5a5a",
                                        borderLeft: "2px solid transparent",
                                    }}
                                >
                                    <Icon className={`w-4 h-4 flex-shrink-0 transition-all duration-150 ${
                                        active ? "text-purple-400" : "text-zinc-700 group-hover:text-purple-400 group-hover:scale-110"
                                    }`} />
                                    <span className={`flex-1 truncate ${
                                        active ? "text-purple-300" : "group-hover:text-purple-300"
                                    }`}>{item.title}</span>
                                </Link>
                            );
                        })}
                    </>
                )}
            </nav>

            {/* ── User footer ── */}
            <div className="px-3 py-4 space-y-2" style={{ borderTop: "1px solid #1a1a1a" }}>
                <div className="flex items-center gap-3 px-3 py-2">
                    <div
                        className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-black uppercase text-white flex-shrink-0 shadow-fire"
                        style={{ background: "linear-gradient(135deg, #f97316, #dc2626)" }}
                    >
                        {user.name?.[0] ?? "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                            {user.name}
                        </p>
                        <p className="text-xs truncate" style={{ color: "#4a4a4a" }}>
                            {ROLE_LABELS[user.role] ?? user.role}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group"
                    style={{ color: "#3a3a3a" }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.08)";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color = "#3a3a3a";
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );
}
