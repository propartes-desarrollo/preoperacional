# Estandares de Codificacion

**Sistema Preoperacional Propartes — Version 1.1**

---

## General

- **ES Modules:** Todo el codigo usa `import/export`. No se usa `require()`.
- **Sin emojis:** Prohibido en codigo, logs, UI, comentarios y mensajes. Es una regla de negocio, no estetica.
- **Sin contrasenas en el codigo:** Todas las credenciales van en `.env`. El `.env` nunca se commitea.
- **Sin `node_modules/` en el repositorio:** Las dependencias se instalan dentro del contenedor Docker.

---

## Backend

### Logger

Usar `pino` en lugar de `console.log`. Importar el logger configurado:

```js
import logger from '../utils/logger.js';

// Correcto
logger.info({ component: 'miServicio', userId: 5 }, 'Operacion completada.');
logger.warn({ component: 'miServicio', plate: 'ABC123' }, 'Advertencia detectada.');
logger.error({ component: 'miServicio', err: err.message }, 'Error en operacion.');

// Incorrecto
console.log('Operacion completada');
```

El campo `component` identifica el modulo origen. Siempre incluirlo.

### Manejo de errores en rutas

Usar `next(err)` para propagar errores al middleware de error global. No envolver en try/catch innecesarios:

```js
router.get('/', async (req, res, next) => {
  try {
    const result = await someAsyncOperation();
    res.json(result);
  } catch (err) {
    next(err);
  }
});
```

### Rutas

- Prefijo obligatorio: `/api/v1/`.
- Nombres en kebab-case: `/inspection-status`, no `/inspectionStatus`.
- Recursos en plural: `/collaborators`, `/inspections`.
- Documentar con `@openapi` JSDoc para que aparezca en Swagger.

### Base de datos

- Usar el pool `pool` para consultas simples.
- Usar transacciones con `client = await pool.connect()` para operaciones multiples.
- Siempre liberar el cliente con `client.release()` en `finally`.
- Los valores de fecha se calculan en zona Bogota antes de insertar en la columna `DATE`.
- No usar ORM. SQL directo con el driver `pg`.

### Validacion

- Validar en el backend siempre, incluso si ya se valida en el frontend.
- Usar Zod para schemas complejos (`backend/src/utils/validators.js`).
- Para endpoints admin, validar campos obligatorios antes de tocar la DB.

---

## Frontend

### Componentes UI

- Usar exclusivamente componentes de **Mantine UI** (`@mantine/core`).
- Nunca usar elementos HTML nativos para formularios, tablas o inputs donde exista equivalente en Mantine.
- Notificaciones con `notifications.show()` de `@mantine/notifications`.

### Llamadas al API

- Todas las llamadas al backend van en `frontend/src/api/adminApi.js`.
- Usar `axios` configurado en ese archivo.
- Manejar errores con `err.response?.data?.error` para mostrar el mensaje del backend.

### Deteccion de viewport para admin

- Usar CSS/JS con `window.innerWidth` o media queries para detectar pantalla pequena.
- Nunca usar `navigator.userAgent`.
- Mostrar advertencia en pantalla pequena pero no bloquear completamente el acceso.

### Estado de la aplicacion

- Estado local con `useState` y `useEffect`. No se usa Redux ni Context en este proyecto.
- Formularios con estado controlado (controlled components).

---

## Convenciones de nombres

| Tipo | Convencion | Ejemplo |
|---|---|---|
| Archivos de rutas backend | camelCase | `collaborators.js` |
| Archivos de servicios | camelCase | `emailService.js` |
| Archivos de migraciones | snake_case con prefijo numerico | `015_add_inspection_frequency.js` |
| Componentes React | PascalCase | `DashboardPage.jsx` |
| Funciones | camelCase | `findOrCreateCollaborator` |
| Constantes globales | SCREAMING_SNAKE_CASE | `BOGOTA_TZ`, `MIN_SIZE_BYTES` |
| Tablas PostgreSQL | snake_case | `inspection_photos` |
| Columnas PostgreSQL | snake_case | `inspection_date`, `first_name` |

---

## Git

- Commits en español, descripcion clara de que cambia y por que.
- Una rama por feature o fix. No trabajar directamente en `main` para cambios grandes.
- El archivo `.env` esta en `.gitignore` y nunca debe ser commitado.
- El archivo `.env.example` siempre debe estar actualizado cuando se agrega una variable nueva.

---

## Seguridad

- Nunca construir queries SQL con interpolacion de strings. Usar parametros (`$1`, `$2`).
- Nunca exponer el `JWT_SECRET` ni las API keys en logs o respuestas.
- Validar MIME type de archivos en el servidor (no confiar en la extension).
- Rate limiting aplicado globalmente. No crear endpoints que lo omitan.
- El campo `ENABLE_DEBUG_ENDPOINTS` solo debe ser `true` en desarrollo.
