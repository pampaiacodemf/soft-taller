import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/renovar", "/api/auth"];

// SUPER_ADMIN bypasses all role restrictions
const SUPER_ADMIN_ROLE = "SUPER_ADMIN";

const ROLE_ROUTES: Record<string, string[]> = {
    "/dashboard/superadmin": [SUPER_ADMIN_ROLE],
    "/dashboard/admin":      ["ADMIN", SUPER_ADMIN_ROLE],
    "/dashboard/gastos":     ["ADMIN", "ADMIN_STAFF", SUPER_ADMIN_ROLE],
    "/dashboard/cuentas":    ["ADMIN", "ADMIN_STAFF", SUPER_ADMIN_ROLE],
    "/dashboard/facturacion":["ADMIN", "ADMIN_STAFF", SUPER_ADMIN_ROLE],
    "/dashboard/reportes":   ["ADMIN", "ADMIN_STAFF", SUPER_ADMIN_ROLE],
};

export default auth((req) => {
    const { pathname } = req.nextUrl;

    // Allow public routes always
    if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // If not authenticated, redirect to login
    if (!req.auth) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    const { role, daysRemaining, subscriptionActive } = req.auth.user as {
        role: string;
        daysRemaining: number;
        subscriptionActive: boolean;
    };

    // SUPER_ADMIN bypasses subscription check and all role restrictions
    if (role === SUPER_ADMIN_ROLE) {
        return NextResponse.next();
    }

    // Block expired subscriptions
    if (pathname.startsWith("/dashboard") && (!subscriptionActive || daysRemaining <= 0)) {
        return NextResponse.redirect(new URL("/renovar", req.url));
    }

    // Check role-based access
    for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
        if (pathname.startsWith(route) && !allowedRoles.includes(role)) {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
