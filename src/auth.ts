import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { prisma } from "./lib/prisma";

const credentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
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

                // Log login attempt to debug identity bleed
                console.log(`[AUTH] Attempting login for: ${email}`);

                const user = await prisma.user.findFirst({
                    where: { email, isActive: true },
                    include: {
                        tenant: {
                            include: { subscription: true },
                        },
                    },
                });

                if (!user) {
                    console.log(`[AUTH] User not found: ${email}`);
                    return null;
                }

                const passwordMatch = await bcrypt.compare(password, user.password);
                if (!passwordMatch) {
                    console.log(`[AUTH] Password mismatch for: ${email}`);
                    return null;
                }

                const subscription = user.tenant.subscription;
                const daysRemaining = subscription?.daysRemaining ?? 0;

                console.log(`[AUTH] Login successful: ${user.name} (${user.email}) - Tenant: ${user.tenant.name}`);

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
});
