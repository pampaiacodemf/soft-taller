import { getUsers } from "@/lib/actions/admin";
import { Users, Shield } from "lucide-react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserForm } from "./user-form";
import { DeleteUserButton } from "./delete-user-button";
import { auth } from "@/auth";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestión de Usuarios" };

const ROLE_LABELS: Record<string, string> = {
    ADMIN: "Administrador",
    ADMIN_STAFF: "Staff Administrativo",
    SALES: "Ventas",
    TECHNICIAN: "Técnico",
};

export default async function UsuariosPage({
    searchParams,
}: {
    searchParams?: { q?: string };
}) {
    const session = await auth();
    const search = searchParams?.q || "";
    const users = await getUsers(search);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Shield className="w-8 h-8 text-primary" />
                        Gestión de Usuarios
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Administra el acceso de tu personal al sistema
                    </p>
                </div>
                <UserForm />
            </div>

            <Card>
                <CardContent className="pt-6">
                    {users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <Users className="w-12 h-12 mb-4 opacity-30" />
                            <p className="font-medium">No hay usuarios registrados</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            {user.name}
                                            {user.id === session?.user.id && (
                                                <Badge variant="secondary" className="ml-2 text-[10px]">TÚ</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {ROLE_LABELS[user.role] || user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <UserForm
                                                    isEdit
                                                    buttonVariant="ghost"
                                                    userData={{
                                                        id: user.id,
                                                        name: user.name || "",
                                                        email: user.email,
                                                        role: user.role as any,
                                                    }}
                                                />
                                                {user.id !== session?.user.id && (
                                                    <DeleteUserButton userId={user.id} userName={user.name || "Usuario"} />
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
