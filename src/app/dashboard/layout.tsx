import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/toaster";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: "#0d0d0d" }}>
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 hidden md:flex flex-col">
                <Sidebar
                    user={{
                        name: session.user.name,
                        email: session.user.email,
                        role: session.user.role,
                        tenantName: session.user.tenantName,
                        daysRemaining: session.user.daysRemaining,
                    }}
                />
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto scrollbar-thin" style={{ background: "#0d0d0d" }}>
                <div className="max-w-7xl mx-auto p-6 animate-in">
                    {children}
                </div>
            </main>
            <Toaster />
        </div>
    );
}
