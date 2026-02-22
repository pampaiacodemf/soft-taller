import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/products/product-form";
import { redirect, notFound } from "next/navigation";

export default async function EditProductPage({
    params,
}: {
    params: { id: string };
}) {
    const session = await auth();
    if (!session) return redirect("/login");

    const [product, categories] = await Promise.all([
        prisma.product.findUnique({
            where: { id: params.id, tenantId: session.user.tenantId },
        }),
        prisma.productCategory.findMany({
            where: { tenantId: session.user.tenantId },
            orderBy: { name: "asc" },
        }),
    ]);

    if (!product) return notFound();

    return (
        <div className="max-w-4xl mx-auto">
            <ProductForm initialData={product} categories={categories} />
        </div>
    );
}
