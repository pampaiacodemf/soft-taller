import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { BackupClient } from "./backup-client";

export const metadata: Metadata = { title: "Backup / Restaurar | SúperAdmin" };

export default async function BackupPage() {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") return redirect("/dashboard");
    return <BackupClient />;
}
