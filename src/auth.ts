import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const prisma = new PrismaClient();

const credentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsed = credentialsSchema.safeParse(credentials);
                if (!parsed.success) return null;

                const { email, password } = parsed.data;

                const user = await prisma.user.findFirst({
                    where: { email, isActive: true },
                    include: {
                        tenant: {
                            include: { subscription: true },
                        },
                    },
                });

                if (!user) return null;

                const passwordMatch = await bcrypt.compare(password, user.password);
                if (!passwordMatch) return null;

                const subscription = user.tenant.subscription;
                const daysRemaining = subscription?.daysRemaining ?? 0;

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    tenantId: user.tenantId,
                    tenantName: user.tenant.name,
                    daysRemaining,
                    subscriptionActive: subscription?.isActive ?? false,
                };
            },
        }),
    ],
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
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 8 * 60 * 60, // 8 hours
    },
});
