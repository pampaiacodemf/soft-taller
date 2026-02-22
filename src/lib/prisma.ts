import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        datasources: {
            db: { url: "postgresql://neondb_owner:npg_v82NJhIezyYZ@ep-divine-darkness-acaj5nwm-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true" },
        },
        log:
            process.env.NODE_ENV === "development"
                ? ["query", "error", "warn"]
                : ["error"],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
