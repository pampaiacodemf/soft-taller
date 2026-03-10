import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { NewBudgetForm } from "./new-budget-form";

export const metadata = { title: "Nuevo Presupuesto" };

export default async function NewBudgetPage({
    searchParams,
}: {
    searchParams: { orderId?: string; customerId?: string };
}) {
    const session = await auth();
    if (!session) return redirect("/login");

    let defaultCustomerName = "";
    let defaultCustomerEmail = "";
    let techReportText = "";

    if (searchParams.customerId) {
        const customer = await prisma.customer.findUnique({
            where: { id: searchParams.customerId },
        });
        if (customer) {
            defaultCustomerName = customer.name;
            defaultCustomerEmail = customer.email || "";
        }
    }

    if (searchParams.orderId) {
        const order = await prisma.workOrder.findUnique({
            where: { id: searchParams.orderId },
            include: {
                technicalReport: { include: { technician: true } },
            },
        });
        if (order?.technicalReport) {
            techReportText = `[Informe Técnico]
Diagnóstico: ${order.technicalReport.diagnosis}
Solución sugerida: ${order.technicalReport.solution || "N/A"}
Técnico Asignado: ${order.technicalReport.technician?.name || "No asignado"}
---\n`;
        }
    }

    const products = await prisma.product.findMany({
        where: { tenantId: session.user.tenantId, isActive: true },
        select: { id: true, name: true, salePrice: true, ivaRate: true },
        orderBy: { name: "asc" }
    });

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
            <NewBudgetForm
                defaultCustomerName={defaultCustomerName}
                defaultCustomerEmail={defaultCustomerEmail}
                orderId={searchParams.orderId}
                customerId={searchParams.customerId}
                techReportText={techReportText}
                products={products}
            />
        </div>
    );
}
