# ERP Gestión de Taller

Sistema integral de gestión para talleres de reparación, facturación y control de stock.

## 🚀 Despliegue (GitHub + Neon + Netlify)

Este proyecto está preparado para ser desplegado en Netlify utilizando Neon como base de datos PostgreSQL.

### 1. Configuración de la Base de Datos (Neon.tech)
1. Crea un nuevo proyecto en [Neon.tech](https://neon.tech/).
2. En el **Dashboard**, busca **Connection Details**.
3. Selecciona **Prisma** en el menú desplegable.
4. Copia la `DATABASE_URL` provista.

### 2. Configuración de Variables de Envío
Crea un archivo `.env` en la raíz del proyecto (o configúralas en Netlify) siguiendo el formato de `.env.example`:

```env
DATABASE_URL="tu_url_de_neon_con_prisma"
NEXTAUTH_SECRET="un_secreto_aleatorio"
NEXTAUTH_URL="https://tu-sitio.netlify.app"
```

### 3. Migración de Base de Datos
Una vez configurado el `.env`, ejecuta el siguiente comando para cargar las tablas:

```bash
npx prisma migrate deploy
```

### 4. Subir a GitHub
Usa GitHub Desktop o la terminal para subir los últimos cambios:
```bash
git add .
git commit -m "Configurado para Neon y Netlify"
git push origin master
```

### 5. Despliegue en Netlify
1. Entra a [Netlify](https://www.netlify.com/) y dale a **"Add new site" > "Import an existing project"**.
2. Conecta tu repositorio de GitHub.
3. Configuración de Build:
   - **Build Command**: `npx prisma generate && next build`
   - **Publish directory**: `.next`
4. En **Environment Variables** (dentro de Netlify), añade:
   - `DATABASE_URL`: Tu conexión de Neon
   - `AUTH_SECRET`: `f3f1e9c2b4a5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0c1`
   - `AUTH_TRUST_HOST`: `true`
5. Dale a **Deploy**.

---
Desarrollado con Next.js, Prisma, Tailwind CSS y Lucide React.
