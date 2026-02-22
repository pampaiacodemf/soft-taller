/**
 * AFIP/ARCA Web Services Stub
 *
 * This file provides the interface and stub implementation for AFIP
 * Web Services. In production, replace the stub methods with actual
 * SOAP calls using your CUIT and digital certificates.
 *
 * WSFE (Web Service de Facturación Electrónica) endpoint:
 * - Testing: https://wswhomo.afip.gov.ar/wsfev1/service.asmx
 * - Production: https://servicios1.afip.gov.ar/wsfev1/service.asmx
 */

export type TipoComprobante = 1 | 6 | 11; // Factura A=1, B=6, C=11
export type TipoDocumento = 80 | 86 | 96 | 99; // CUIT=80, CUIL=86, DNI=96, Sin Doc=99

export interface AfipItem {
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    bonificacion: number;
    subtotal: number;
    alicuotaIva: 3 | 4 | 5 | 6 | 8 | 9; // 3=0%, 4=10.5%, 5=21%
    ivaImporte: number;
}

export interface SolicitarCaeInput {
    cuit: string;
    puntoVenta: number;
    tipoComprobante: TipoComprobante;
    numeroComprobante: number;
    fechaComprobante: string; // YYYYMMDD
    tipoDocumento: TipoDocumento;
    nroDocumento: string;
    importeNoGravado: number;
    importeGravado: number;
    importeExento: number;
    importeIva: number;
    importeTotal: number;
    items: AfipItem[];
}

export interface AfipCaeResult {
    success: boolean;
    cae?: string;
    caeFechaVto?: string; // YYYYMMDD
    resultado?: string;
    observaciones?: string;
    errors?: string[];
    rawResponse?: unknown;
}

/**
 * Solicita el CAE a ARCA/AFIP para un comprobante.
 * En producción, reemplazar con la llamada SOAP real usando
 * el certificado digital y la clave privada de la empresa.
 */
export async function solicitarCAE(
    input: SolicitarCaeInput
): Promise<AfipCaeResult> {
    // Stub implementation - simulates a successful response
    // In production, implement the actual WSFE SOAP call here

    console.log("[AFIP STUB] Soliciting CAE for:", input);

    // Simulate processing time
    await new Promise((r) => setTimeout(r, 500));

    // Return a stub successful response
    const fakeCAE = `${Math.floor(Math.random() * 90000000000000) + 10000000000000}`;
    const vtoDate = new Date();
    vtoDate.setDate(vtoDate.getDate() + 10);
    const caeFechaVto = vtoDate
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");

    return {
        success: true,
        cae: fakeCAE,
        caeFechaVto,
        resultado: "A", // Aprobado
        rawResponse: { stub: true, input },
    };
}

/**
 * Consulta el último número de comprobante autorizado para un punto de venta y tipo.
 */
export async function consultarUltimoComprobante(
    cuit: string,
    puntoVenta: number,
    tipoComprobante: TipoComprobante
): Promise<number> {
    // Stub: return 0 (no previous invoices)
    console.log(
        `[AFIP STUB] Consulting last voucher for PV ${puntoVenta}, tipo ${tipoComprobante}`
    );
    return 0;
}

/**
 * Maps InvoiceType enum to AFIP comprobante type number
 */
export function invoiceTypeToAfip(
    type: "A" | "B" | "C"
): TipoComprobante {
    const map: Record<string, TipoComprobante> = {
        A: 1,
        B: 6,
        C: 11,
    };
    return map[type];
}

/**
 * Maps IVA percentage to AFIP alicuota code
 */
export function ivaRateToAfipCode(rate: number): AfipItem["alicuotaIva"] {
    if (rate === 0) return 3;
    if (rate === 10.5) return 4;
    return 5; // 21%
}
