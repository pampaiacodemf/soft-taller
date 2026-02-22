import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";

// HARDCODED URL FOR NETLIFY TO BYPASS MISSING ENVIRONMENT VARIABLES
const prisma = new PrismaClient({
    datasources: {
        db: { url: "postgresql://neondb_owner:npg_v82NJhIezyYZ@ep-divine-darkness-acaj5nwm-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true" },
    },
});

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
});
