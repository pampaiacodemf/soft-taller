import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        const hash = await bcrypt.hash("admin123", 10);
        const match = await bcrypt.compare("admin123", hash);
        return NextResponse.json({ success: true, match });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
    }
}
