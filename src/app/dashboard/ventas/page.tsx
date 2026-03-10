import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { POS } from "./pos";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ventas / POS" };

export default async function VentasPage() {
    const session = await auth();
    if (!session) return redirect("/login");

    const [products, customers] = await Promise.all([
        prisma.product.findMany({
            where: {
                tenantId: session.user.tenantId,
                isActive: true,
            },
            orderBy: { name: "asc" },
        }),
        prisma.customer.findMany({
            where: {
                tenantId: session.user.tenantId,
            },
            orderBy: { name: "asc" },
        }),
    ]);

    return <POS products={products} customers={customers} />;
}
