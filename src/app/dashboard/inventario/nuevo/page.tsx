import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/products/product-form";
import { redirect } from "next/navigation";

export default async function NewProductPage() {
    const session = await auth();
    if (!session) return redirect("/login");

    const [categories, suppliers] = await Promise.all([
        prisma.productCategory.findMany({
            where: { tenantId: session.user.tenantId },
            orderBy: { name: "asc" },
        }),
        (prisma as any).supplier.findMany({
            where: { tenantId: session.user.tenantId, isActive: true },
            orderBy: { name: "asc" },
        })
    ]);

    return (
        <div className="max-w-4xl mx-auto">
            <ProductForm categories={categories} suppliers={suppliers} />
        </div>
    );
}
