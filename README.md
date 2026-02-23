# ERP Gestión de Taller

Sistema integral de gestión para talleres de reparación, facturación y control de stock.

## 🚀 Despliegue (GitHub + Neon + Google Cloud Run)

Este proyecto está preparado para ser desplegado en **Google Cloud Run**, unificándolo con tu ecosistema de Google. Utiliza **Neon** como base de datos PostgreSQL gratuita.

### 1. Configuración de la Base de Datos (Neon.tech)
1. Crea un nuevo proyecto en [Neon.tech](https://neon.tech/).
2. Copia la `DATABASE_URL` (selecciona Prisma en el menú de Neon).

### 2. Despliegue en Google Cloud Run (Gratis/Muy Bajo Costo)

Google Cloud Run tiene un nivel gratuito de hasta 2 millones de peticiones al mes.

#### Paso A: Preparar Google Cloud
1. Entra a la [Consola de Google Cloud](https://console.cloud.google.com/).
2. Crea un nuevo proyecto (ejemplo: `taller-erp`).
3. Habilita la **Cloud Run API** y **Cloud Build API**.

#### Paso B: Desplegar desde GitHub
1. Ve a la sección de **Cloud Run** en tu consola de Google.
2. Haz clic en **"CREATE SERVICE"**.
3. Selecciona **"Continuously deploy from a repository"** y conecta tu GitHub.
4. Selecciona tu repositorio `soft-taller`.
5. En la configuración del build, elige **Dockerfile** (el archivo ya está en la raíz).
6. En **Authentication**, selecciona **"Allow unauthenticated invocations"** (para que la web sea pública).
7. En la pestaña **"Variables & Secrets"**, añade:
   - `DATABASE_URL`: Tu conexión de Neon.
   - `AUTH_SECRET`: `f3f1e9c2b4a5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0c1`
   - `AUTH_TRUST_HOST`: `true`
8. Haz clic en **"CREATE"**.

> [!TIP]
> Google Cloud Run es extremadamente estable y escala a cero cuando no se usa, por lo que el costo será $0 mientras estés dentro del nivel gratuito.

---
Desarrollado con Next.js, Prisma, Tailwind CSS y Lucide React.
