import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

// Routes accessible without subscription (expired tenants)
const PUBLIC_ROUTES = ["/login", "/renovar", "/api/auth", "/api/test-db", "/api/test-bcrypt"];

// Role-based route access
const ROLE_ROUTES: Record<string, string[]> = {
    "/dashboard/admin": ["ADMIN"],
    "/dashboard/finanzas": ["ADMIN", "ADMIN_STAFF"],
    "/dashboard/gastos": ["ADMIN", "ADMIN_STAFF"],
    "/dashboard/cuentas": ["ADMIN", "ADMIN_STAFF"],
    "/dashboard/facturacion": ["ADMIN", "ADMIN_STAFF"],
    "/dashboard/reportes": ["ADMIN", "ADMIN_STAFF"],
};

export default auth((req) => {
    const { pathname } = req.nextUrl;

    // Allow public routes always
    if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // If not authenticated or user data missing, redirect to login
    const session = req.auth;
    if (!session || !session.user) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    const user = session.user as any;
    const role = user.role;
    const daysRemaining = user.daysRemaining;
    const subscriptionActive = user.subscriptionActive;

    // Block expired subscriptions
    if (
        pathname.startsWith("/dashboard") &&
        (!subscriptionActive || daysRemaining <= 0)
    ) {
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
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|public).*)",
    ],
};
