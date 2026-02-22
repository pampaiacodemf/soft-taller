import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
    interface User {
        role: string;
        tenantId: string;
        tenantName: string;
        daysRemaining: number;
        subscriptionActive: boolean;
    }

    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            role: string;
            tenantId: string;
            tenantName: string;
            daysRemaining: number;
            subscriptionActive: boolean;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: string;
        tenantId: string;
        tenantName: string;
        daysRemaining: number;
        subscriptionActive: boolean;
    }
}
