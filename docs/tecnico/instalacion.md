# Guia de Instalacion y Configuracion

**Sistema Preoperacional Propartes — Version 1.1**

---

## Requisitos previos

- Ubuntu 22.04 LTS (o equivalente)
- Docker Engine 24+ y Docker Compose 2+ instalados
- Git instalado
- Acceso al repositorio del proyecto
- Credenciales de Resend y Meta Cloud API disponibles

---

## Paso 1 — Clonar el repositorio

```bash
git clone <url-del-repositorio> preoperacional_propartes
cd preoperacional_propartes
```

---

## Paso 2 — Crear el archivo de variables de entorno

```bash
cp .env.example .env
nano .env
```

Complete todos los valores requeridos. Los mas importantes:

```env
# Base de datos
POSTGRES_USER=preoperacional_user
POSTGRES_PASSWORD=una_contrasena_segura_aqui
POSTGRES_DB=preoperacional_db
DATABASE_URL=postgresql://preoperacional_user:una_contrasena_segura_aqui@base_de_datos_postgresql:5432/preoperacional_db

# JWT — genere con: openssl rand -hex 32
JWT_SECRET=resultado_del_comando_openssl

# URL publica de la aplicacion
APP_URL=https://preoperacional.sudominio.com
CORS_ORIGIN=https://preoperacional.sudominio.com

# URL del backend que el navegador usa
VITE_API_URL=https://preoperacional.sudominio.com/api/v1

# Correo (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=no-reply@sudominio.com

# WhatsApp (Meta Cloud API)
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxx
WHATSAPP_REMINDER_TEMPLATE_NAME=recordatorio_preoperacional

# Superadmin inicial
INITIAL_SUPERADMIN_EMAIL=admin@sudominio.com
INITIAL_SUPERADMIN_NAME=Nombre Administrador
```

---

## Paso 3 — Construir e iniciar los contenedores

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

Esto:
1. Construye las imagenes de backend y frontend.
2. Inicia PostgreSQL y espera a que este disponible.
3. El backend ejecuta automaticamente las migraciones y el seed inicial.
4. El frontend compila el build estatico y lo sirve por Nginx en el puerto 80.

---

## Paso 4 — Verificar que el sistema esta funcionando

```bash
# Ver estado de los contenedores
docker-compose -f docker-compose.prod.yml ps

# Ver logs del backend
docker logs backend_node --tail=50

# Verificar health check
curl http://localhost/api/v1/health
```

Respuesta esperada del health check:
```json
{ "status": "ok", "db": "connected" }
```

---

## Paso 5 — Configurar SSL/TLS (recomendado para produccion)

El sistema no gestiona SSL directamente. Use un reverse proxy externo.

### Opcion A: Caddy (recomendado, automatico)

Instale Caddy en el servidor host y cree `/etc/caddy/Caddyfile`:

```
preoperacional.sudominio.com {
    reverse_proxy localhost:80
}
```

Caddy gestiona el certificado Let's Encrypt automaticamente.

### Opcion B: Nginx externo + Certbot

```nginx
server {
    listen 443 ssl;
    server_name preoperacional.sudominio.com;

    ssl_certificate /etc/letsencrypt/live/preoperacional.sudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/preoperacional.sudominio.com/privkey.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Paso 6 — Verificar el acceso al panel de administracion

1. Abra `https://preoperacional.sudominio.com/admin` en el navegador.
2. Ingrese el correo configurado en `INITIAL_SUPERADMIN_EMAIL`.
3. Revise el correo y haga clic en el enlace de acceso.
4. Si el enlace funciona, la instalacion esta completa.

---

## Actualizacion del sistema

```bash
# Obtener cambios del repositorio
git pull origin main

# Reconstruir e reiniciar los contenedores
docker-compose -f docker-compose.prod.yml up -d --build
```

Las migraciones nuevas se aplican automaticamente al iniciar el backend.

---

## Rollback a una version anterior

```bash
# Ver versiones disponibles
git log --oneline -10

# Volver a una version especifica
git checkout <commit-hash>

# Reconstruir
docker-compose -f docker-compose.prod.yml up -d --build
```

> Si la version anterior tenia menos migraciones, las migraciones nuevas NO se revierten automaticamente. Si es necesario revertir una migracion:
> ```bash
> docker exec -it backend_node node src/migrate-cli.js down
> ```

---

## Configuracion inicial de WhatsApp

Para que los recordatorios de WhatsApp funcionen, la plantilla `recordatorio_preoperacional` debe estar aprobada en Meta Business Manager.

**Estructura requerida de la plantilla:**
- **Nombre:** `recordatorio_preoperacional`
- **Idioma:** Spanish (Colombia) — `es_CO`
- **Cuerpo:** Texto con una variable `{{1}}` que recibe el nombre del colaborador
- **Boton CTA:** URL fija con el enlace al formulario

**Token de acceso:** Se recomienda usar un token permanente de sistema (sin expiracion):
1. Ir a Meta Business Suite > Configuracion del negocio > Usuarios del sistema.
2. Crear usuario del sistema con rol de administrador.
3. Asignar la app de WhatsApp.
4. Generar token con permiso `whatsapp_business_messaging`.
5. Copiar el token en `WHATSAPP_ACCESS_TOKEN` en el `.env`.
