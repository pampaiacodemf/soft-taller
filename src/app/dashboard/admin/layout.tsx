import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // Strict check: only ADMIN role can access any route within /dashboard/admin
    if (!session || session.user.role !== "ADMIN") {
        redirect("/dashboard");
    }

    return (
        <div className="flex-1 w-full h-full">
            {children}
        </div>
    );
}
