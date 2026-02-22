"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// === USER MANAGEMENT ===

export async function getUsers(search?: string) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("No autorizado");
    }

    return prisma.user.findMany({
        where: {
            tenantId: session.user.tenantId,
            ...(search ? {
                OR: [
                    { name: { contains: search } },
                    { email: { contains: search } },
                ]
            } : {}),
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function createUser(data: {
    name: string;
    email: string;
    role: "ADMIN" | "ADMIN_STAFF" | "TECHNICIAN" | "SALES";
    password?: string;
}) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("No autorizado");
    }

    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : undefined;

    const user = await prisma.user.create({
        data: {
            tenantId: session.user.tenantId,
            name: data.name,
            email: data.email,
            role: data.role,
            password: hashedPassword || "",
        },
    });

    revalidatePath("/dashboard/admin/usuarios");
    return { success: true, user };
}

export async function updateUser(id: string, data: {
    name?: string;
    email?: string;
    role?: "ADMIN" | "ADMIN_STAFF" | "TECHNICIAN" | "SALES";
    password?: string;
}) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("No autorizado");
    }

    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : undefined;

    const user = await prisma.user.update({
        where: { id, tenantId: session.user.tenantId },
        data: {
            ...(data.name ? { name: data.name } : {}),
            ...(data.email ? { email: data.email } : {}),
            ...(data.role ? { role: data.role } : {}),
            ...(hashedPassword ? { password: hashedPassword } : {}),
        },
    });

    revalidatePath("/dashboard/admin/usuarios");
    return { success: true, user };
}

export async function deleteUser(id: string) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("No autorizado");
    }

    if (id === session.user.id) {
        throw new Error("No puedes eliminar tu propia cuenta de administrador");
    }

    await prisma.user.delete({
        where: { id, tenantId: session.user.tenantId },
    });

    revalidatePath("/dashboard/admin/usuarios");
    return { success: true };
}

// === TENANT CONFIG ===

export async function getTenant() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("No autorizado");
    }

    return prisma.tenant.findUnique({
        where: { id: session.user.tenantId }
    });
}

export async function updateTenantSettings(data: {
    name: string;
    cuit?: string;
    address?: string;
    phone?: string;
    email?: string;
}) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("No autorizado");
    }

    const tenant = await prisma.tenant.update({
        where: { id: session.user.tenantId },
        data: {
            name: data.name,
            cuit: data.cuit || null,
            address: data.address || null,
            phone: data.phone || null,
            email: data.email || null,
        },
    });

    revalidatePath("/dashboard/admin/configuracion");
    revalidatePath("/dashboard"); // To update sidebar if name changes
    return { success: true, tenant };
}
