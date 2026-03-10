import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MembresiaClient } from "./membresia-client";

export const metadata: Metadata = { title: "Membresía | SúperAdmin" };

export default async function MembresiaPage() {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") return redirect("/dashboard");

    // Get all tenants with subscriptions
    const tenants = await prisma.tenant.findMany({
        include: { subscription: true },
        orderBy: { name: "asc" },
    });

    return <MembresiaClient tenants={tenants} />;
}
