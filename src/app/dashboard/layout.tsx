import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileMenu } from "@/components/layout/mobile-menu";
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
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 hidden md:flex flex-col border-r border-border/50">
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
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 w-full">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg shadow-sm">
                            <span className="text-white font-bold text-sm">S</span>
                        </div>
                        <span className="font-semibold truncate">SoftTaller</span>
                    </div>
                    <MobileMenu
                        user={{
                            name: session.user.name,
                            email: session.user.email,
                            role: session.user.role,
                            tenantName: session.user.tenantName,
                            daysRemaining: session.user.daysRemaining,
                        }}
                    />
                </header>

                <div className="flex-1 overflow-y-auto scrollbar-thin">
                    <div className="max-w-7xl mx-auto p-4 md:p-6 animate-in">
                        {children}
                    </div>
                </div>
            </main>
            <Toaster />
        </div>
    );
}
