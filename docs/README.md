# Documentacion del Sistema Preoperacional Propartes

**Version:** 1.1  
**Fecha:** Junio 2026  
**Aplicacion:** Sistema de Inspecciones Preoperacionales de Vehiculos

---

## Tabla de Contenidos

### 1. Documentacion para el Usuario Final
- [Manual de Usuario](./usuario/manual-de-usuario.md)
- [Guia de Inicio Rapido](./usuario/inicio-rapido.md)
- [Preguntas Frecuentes (FAQ)](./usuario/faq.md)
- [Glosario de Terminos](./usuario/glosario.md)

### 2. Documentacion Tecnica para TI
- [Arquitectura del Sistema](./tecnico/arquitectura.md)
- [Requisitos de Infraestructura](./tecnico/requisitos-infraestructura.md)
- [Guia de Instalacion y Configuracion](./tecnico/instalacion.md)
- [Procedimientos de Respaldo y Recuperacion](./tecnico/respaldo-recuperacion.md)
- [Mantenimiento y Monitoreo](./tecnico/mantenimiento.md)
- [Referencia de API](./tecnico/api.md)
- [Base de Datos](./tecnico/base-de-datos.md)

### 3. Documentacion de Administracion y Soporte
- [Gestion de Usuarios y Roles](./admin/usuarios-roles.md)
- [Configuracion Avanzada](./admin/configuracion-avanzada.md)
- [Solucion de Problemas](./admin/troubleshooting.md)
- [Registros (Logs)](./admin/logs.md)

### 4. Documentacion para Desarrolladores
- [Guia de Desarrollo](./dev/guia-desarrollo.md)
- [Estandares de Codificacion](./dev/estandares.md)
- [Pipeline y Despliegue](./dev/pipeline.md)

---

## Descripcion General del Sistema

El **Sistema Preoperacional Propartes** es una aplicacion web para el registro diario de inspecciones preoperacionales de vehiculos (carros y motos) de los colaboradores de Propartes.

### Dos interfaces

| Interfaz | Destinatario | Acceso |
|---|---|---|
| PWA (aplicacion movil web) | Colaboradores de campo | Sin login, acceso directo por URL |
| Panel de Administracion | Personal administrativo y TI | Magic link por correo electronico |

### Stack tecnologico

| Capa | Tecnologia |
|---|---|
| Frontend | React 19 + Vite + Mantine UI |
| Backend | Node.js + Express 5 |
| Base de datos | PostgreSQL 16 |
| Orquestacion | Docker Compose |
| Correo | Resend API |
| WhatsApp | Meta Cloud API v25.0 |
