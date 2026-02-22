import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(num);
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getStockStatusClass(stock: number, minStock: number) {
  if (stock <= 0) return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
  if (stock <= minStock) return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
  return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
}

export function getSubscriptionBadgeClass(daysRemaining: number) {
  if (daysRemaining <= 0) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  if (daysRemaining <= 7) return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
}

export const WORK_ORDER_STATUS_LABELS: Record<string, string> = {
  "INGRESADO": "Ingresado",
  "EN_REVISION": "En Revisión",
  "PRESUPUESTADO": "Presupuestado",
  "APROBADO": "Aprobado",
  "RECHAZADO": "Rechazado",
  "EN_REPARACION": "En Reparación",
  "REPARADO": "Reparado",
  "SIN_SOLUCION": "Sin Solución",
  "DEVOLUCION_PENDIENTE": "Devolución Pendiente",
  "ENTREGADO": "Entregado"
};

export const WORK_ORDER_STATUS_COLORS: Record<string, string> = {
  "INGRESADO": "bg-blue-100 text-blue-800",
  "EN_REVISION": "bg-indigo-100 text-indigo-800",
  "PRESUPUESTADO": "bg-purple-100 text-purple-800",
  "APROBADO": "bg-green-100 text-green-800",
  "RECHAZADO": "bg-red-100 text-red-800",
  "EN_REPARACION": "bg-yellow-100 text-yellow-800",
  "REPARADO": "bg-emerald-100 text-emerald-800",
  "SIN_SOLUCION": "bg-gray-100 text-gray-800",
  "DEVOLUCION_PENDIENTE": "bg-orange-100 text-orange-800",
  "ENTREGADO": "bg-slate-100 text-slate-800"
};

export function handleEnterKey(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
  }
}
