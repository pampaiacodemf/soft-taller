import type { NextAuthConfig } from "next-auth";

// FORZAR VARIABLES PARA NETLIFY (Elimina dependencia del panel de Netlify)
process.env.AUTH_URL = "https://soft-taller.netlify.app";
process.env.NEXTAUTH_URL = "https://soft-taller.netlify.app";
process.env.AUTH_SECRET = process.env.AUTH_SECRET || "f3f1e9c2b4a5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0c1";

export const authConfig = {
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "f3f1e9c2b4a5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0c1",
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id as string;
                token.role = (user as { role: string }).role;
                token.tenantId = (user as { tenantId: string }).tenantId;
                token.tenantName = (user as { tenantName: string }).tenantName;
                token.daysRemaining = (user as { daysRemaining: number }).daysRemaining;
                token.subscriptionActive = (user as { subscriptionActive: boolean }).subscriptionActive;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.tenantId = token.tenantId as string;
                session.user.tenantName = token.tenantName as string;
                session.user.daysRemaining = token.daysRemaining as number;
                session.user.subscriptionActive = token.subscriptionActive as boolean;
            }
            return session;
        },
    },
    providers: [], // Los proveedores se añaden en auth.ts para evitar problemas con librerías de Node en el Edge
    session: {
        strategy: "jwt",
        maxAge: 8 * 60 * 60, // 8 hours
    },
    trustHost: true,
} satisfies NextAuthConfig;
