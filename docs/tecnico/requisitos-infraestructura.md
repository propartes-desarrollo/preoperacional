# Requisitos de Infraestructura

**Sistema Preoperacional Propartes — Version 1.1**

---

## Servidor de produccion (minimo recomendado)

| Recurso | Minimo | Recomendado |
|---|---|---|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 2 GB | 4 GB |
| Disco | 20 GB SSD | 50 GB SSD |
| Sistema operativo | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| Arquitectura | x86_64 (amd64) | x86_64 (amd64) |

> El disco debe contemplar el crecimiento de fotos. Con 90 dias de retencion y volumenes medios, calcule ~500 MB a 2 GB por mes dependiendo del numero de colaboradores y la calidad de las fotos.

---

## Software requerido en el servidor

| Software | Version minima | Uso |
|---|---|---|
| Docker Engine | 24.x | Ejecucion de contenedores |
| Docker Compose | 2.x (plugin) | Orquestacion de servicios |
| Git | 2.x | Clonacion y actualizaciones del repositorio |

> No se requiere instalar Node.js, PostgreSQL ni Nginx directamente en el servidor. Todos corren dentro de contenedores Docker.

---

## Imagenes Docker utilizadas

| Servicio | Imagen base | Version |
|---|---|---|
| Base de datos | `postgres:16-alpine` | PostgreSQL 16 |
| Backend | `node:20-alpine` (Dockerfile propio) | Node.js 20 LTS |
| Frontend | `node:20-alpine` (build) + `nginx:alpine` (prod) | Nginx estable |

---

## Limites de memoria (produccion)

Definidos en `docker-compose.prod.yml`:

| Contenedor | Limite de RAM |
|---|---|
| `base_de_datos_postgresql` | 512 MB |
| `backend_node` | 512 MB |
| `frontend_nginx` | 128 MB |
| **Total** | ~1.2 GB |

---

## Red y puertos

| Puerto expuesto | Servicio | Notas |
|---|---|---|
| `80` | frontend_nginx | Trafico HTTP. Configurar SSL/TLS con reverse proxy (Nginx externo o Caddy) |
| `443` | Reverse proxy (externo) | Recomendado para produccion |
| `5432` | PostgreSQL | Solo en desarrollo. En produccion NO exponer. |
| `3006` | backend_node | Solo en desarrollo. En produccion, el backend no expone puertos. |

En produccion, la comunicacion entre contenedores ocurre en la red Docker interna `preoperacional_network`. Solo el puerto 80 del frontend debe ser accesible desde internet.

---

## Servicios externos requeridos

| Servicio | Proveedor | Para que |
|---|---|---|
| Correo transaccional | [Resend](https://resend.com) | Magic links de admin, reporte diario, alertas de inactividad |
| WhatsApp Business | [Meta Cloud API](https://developers.facebook.com/docs/whatsapp) | Recordatorios diarios a colaboradores |
| Dominio DNS | Cualquier proveedor | URL de la aplicacion |
| SSL/TLS | Let's Encrypt (recomendado) | Cifrado HTTPS |

---

## Dependencias del backend (npm)

Las principales dependencias instaladas dentro del contenedor:

| Paquete | Version | Uso |
|---|---|---|
| express | 5.x | Framework HTTP |
| pg | 8.x | Cliente PostgreSQL |
| jsonwebtoken | 9.x | JWT para sesiones admin |
| multer | 1.x | Procesamiento de archivos multipart |
| sharp | 0.x | Validacion de dimensiones de imagenes |
| exiftool-vendored | latest | Extraccion de metadata EXIF |
| node-cron | 3.x | Jobs programados |
| date-fns-tz | 3.x | Conversion de zonas horarias |
| pino | 9.x | Logger estructurado |
| helmet | 7.x | Headers de seguridad HTTP |
| express-rate-limit | 7.x | Rate limiting |
| zod | 3.x | Validacion de esquemas |
| resend | latest | SDK de Resend para correos |
| swagger-ui-express | 5.x | Documentacion interactiva de API |

---

## Dependencias del frontend (npm)

| Paquete | Version | Uso |
|---|---|---|
| react | 19.x | Framework UI |
| vite | 5.x | Bundler y servidor de desarrollo |
| @mantine/core | 7.x | Componentes UI |
| axios | 1.x | Cliente HTTP |
| recharts | 2.x | Graficas del dashboard |
| vite-plugin-pwa | latest | Soporte PWA |

---

## Variables de entorno requeridas

Ver el archivo `.env.example` en la raiz del proyecto para la lista completa con descripciones.

Variables minimas criticas para produccion:

```
DATABASE_URL
JWT_SECRET
RESEND_API_KEY
RESEND_FROM_EMAIL
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_ACCESS_TOKEN
APP_URL
CORS_ORIGIN
INITIAL_SUPERADMIN_EMAIL
INITIAL_SUPERADMIN_NAME
```
