# ERP Gestión de Taller

Sistema integral de gestión para talleres de reparación, facturación y control de stock.

## 🚀 Despliegue (GitHub + Supabase + Vercel)

Este proyecto está preparado para ser desplegado en Vercel utilizando Supabase como base de datos PostgreSQL.

### 1. Configuración de la Base de Datos (Supabase)
1. Crea un nuevo proyecto en [Supabase](https://supabase.com/).
2. Ve a **Project Settings > Database**.
3. Copia la **Connection String** (URI) para:
   - **Transaction (Pooler)**: Úsala para `DATABASE_URL` (Puerto 6543).
   - **Session (Direct)**: Úsala para `DIRECT_URL` (Puerto 5432).

### 2. Configuración de Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto (o configúralas en Vercel) siguiendo el formato de `.env.example`:

```env
DATABASE_URL="tu_url_de_pooler"
DIRECT_URL="tu_url_directa"
NEXTAUTH_SECRET="un_secreto_aleatorio"
NEXTAUTH_URL="https://tu-dominio.vercel.app"
```

### 3. Migración de Base de Datos
Una vez configurado el `.env`, ejecuta el siguiente comando para crear las tablas en Supabase:

```bash
npx prisma migrate deploy
```

### 4. Subir a GitHub
1. Inicializa un repositorio Git (si no está ya).
2. Usa GitHub Desktop o la terminal para subir el código.
   ```bash
   git add .
   git commit -m "Preparado para producción"
   git push origin main
   ```

### 5. Despliegue en Vercel
1. Conecta tu repositorio de GitHub a [Vercel](https://vercel.com/).
2. Asegúrate de añadir todas las variables de entorno del paso 2 en la configuración del proyecto en Vercel.
3. Vercel detectará automáticamente Next.js y ejecutará `npm run build` y `prisma generate` durante el despliegue.

---
Desarrollado con Next.js, Prisma, Tailwind CSS y Lucide React.
