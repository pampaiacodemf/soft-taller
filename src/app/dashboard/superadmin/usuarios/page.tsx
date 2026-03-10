import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SuperAdminClient } from "./superadmin-client";

export const metadata: Metadata = { title: "SuperAdmin | Gestión de Usuarios" };

export default async function SuperAdminUsuariosPage() {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") return redirect("/dashboard");
    return <SuperAdminClient />;
}
