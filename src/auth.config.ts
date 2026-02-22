import type { NextAuthConfig } from "next-auth";

export const authConfig = {
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
