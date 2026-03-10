import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CreditCard, MessageSquare } from "lucide-react";
import Link from "next/link";

export default async function RenovarPage() {
    const session = await auth();
    const days = session?.user?.daysRemaining ?? 0;

    return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
            <Card className="max-w-md w-full shadow-xl">
                <CardHeader className="text-center pb-2">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        {days <= 0 ? "Suscripción Expirada" : "Renovar Suscripción"}
                    </CardTitle>
                    <p className="text-muted-foreground text-sm mt-2">
                        Tu acceso al sistema ERP depende de una suscripción activa.
                    </p>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-center">
                        <p className="text-sm font-medium text-muted-foreground">Te quedan</p>
                        <p className={`text-4xl font-black ${days <= 7 ? "text-red-600" : "text-primary"}`}>
                            {days} Días
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Button className="w-full h-12 text-lg font-bold" asChild>
                            <Link href="#">
                                <CreditCard className="w-5 h-5 mr-2" />
                                Pagar Ahora
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full h-12" asChild>
                            <a href="https://wa.me/5491100000000" target="_blank" rel="noopener noreferrer">
                                <MessageSquare className="w-5 h-5 mr-2" />
                                Contactar Soporte
                            </a>
                        </Button>
                    </div>

                    <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-wider">
                        SaaS ERP Taller v1.0
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
