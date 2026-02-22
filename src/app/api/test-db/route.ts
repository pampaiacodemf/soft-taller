import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
    datasources: {
        db: { url: "postgresql://neondb_owner:npg_v82NJhIezyYZ@ep-divine-darkness-acaj5nwm-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true" },
    },
});

export async function GET() {
    try {
        const users = await prisma.user.count();
        return NextResponse.json({ success: true, count: users });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
    }
}
