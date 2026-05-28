# Preoperacional Propartes - Especificacion Tecnica v2.0

## Resumen del proyecto

Desarrollar una aplicacion web que permita a los usuarios realizar una inspeccion preoperacional diaria de vehiculos (carro o moto). La aplicacion consta de dos partes diferenciadas:

- Una **PWA (Progressive Web App)** instalable en dispositivos moviles, de uso exclusivo para el rol "usuario" (sin registro ni inicio de sesion).
- Un **panel de administracion web** (solo accesible desde navegadores de escritorio, viewport minimo de 1024px) para los roles "administrador" y "superadministrador" con inicio de sesion mediante **magic link** enviado al correo registrado.

Incluye formularios de estado general, secciones parametrizables, gestion de colaboradores, envio de correos diarios con reporte, alertas por WhatsApp Business API (Cloud API), y frontend construido con Mantine UI. Base de datos PostgreSQL. Todo ejecutado en contenedores Docker. API versionada desde `/api/v1/`.

---

## Acceso y autenticacion

### Usuarios (rol "usuario")

- No necesitan registrarse ni iniciar sesion.
- Acceden directamente a la PWA desde su telefono.
- Se identifican unicamente mediante su **cedula**, nombre y la placa del vehiculo en el formulario inicial.
- La sesion no se mantiene; cada diligenciamiento es independiente.
- La **cedula** es el identificador unico del colaborador en todo el sistema. El nombre se usa como dato complementario, pero la unicidad de registros se determina por **cedula + placa + fecha**.

### Administrador y superadministrador

- Requieren autenticacion mediante **magic link**: el admin ingresa su correo registrado, el sistema envia un enlace de un solo uso (token temporal, expira en 15 minutos) al correo usando la API de Resend. Al hacer clic en el enlace, se genera un JWT de sesion.
- No se usan contrasenas en ningun momento.
- Su interfaz de administracion esta optimizada para escritorio y **no sera accesible desde la PWA**.
- La deteccion de dispositivo se realiza por **ancho de viewport** (minimo 1024px), no por user-agent. Si el viewport es menor a 1024px, se muestra un mensaje indicando que debe usarse un computador de escritorio. No se bloquea el acceso de forma dura (un admin podria necesitar acceso de emergencia desde una tablet en modo landscape).
- La PWA solo muestra el formulario correspondiente al usuario, sin menus de administracion ni opciones de gestion.

---

## Roles de usuario

1. **Super administrador**: Control total sobre la aplicacion. Accede al panel de administracion desde escritorio. Gestiona secciones, preguntas, fotos, colaboradores, usuarios administradores, configuracion de festivos (overrides), umbral de alertas WhatsApp. Puede ver todos los datos. Tambien puede diligenciar formularios como usuario desde la PWA (usando su cedula y placa).

2. **Administrador**: Delegado encargado de la administracion. Accede al panel de administracion desde escritorio. Puede agregar/modificar secciones y preguntas, modificar configuracion de fotos, gestionar colaboradores, y tambien diligenciar formularios como usuario desde la PWA.

3. **Usuario (colaborador)**: Persona que llena el formulario preoperacional diariamente. Solo usa la PWA, sin registro ni contrasena. Solo puede diligenciar el formulario.

---

## Gestion de colaboradores

### Tabla maestra de colaboradores

El sistema debe mantener una tabla de colaboradores activos con los siguientes campos:

- Cedula (identificador unico, solo numeros).
- Nombre y apellidos.
- Placa(s) asignada(s) (un colaborador puede tener multiples vehiculos).
- Estado (activo / inactivo).
- Fecha de registro.
- Telefono (opcional, para futuras notificaciones directas).

### Carga y gestion desde el panel de administracion

- CRUD completo de colaboradores desde el panel de administracion.
- **Carga masiva mediante archivo CSV**: el admin puede subir un archivo CSV con las columnas: cedula, nombre, apellidos, placa, estado. El sistema debe validar el formato, detectar duplicados, y mostrar un resumen antes de confirmar la importacion. Debe soportar actualizacion de datos existentes (por cedula).
- Desactivar un colaborador lo excluye de las alertas de WhatsApp por inactividad, pero no elimina sus registros historicos.

### Auto-registro desde la PWA

- Si un colaborador diligencia el formulario con una cedula que no existe en la tabla maestra, el sistema crea automaticamente un registro con estado "activo" y asocia la placa ingresada.
- Si la cedula ya existe pero la placa es nueva, se agrega la placa a las asociadas.

---

## Campos iniciales del formulario

Antes de mostrar las secciones tematicas, el sistema debe solicitar obligatoriamente:

- **Nombre y Apellidos** del colaborador (campo de texto).
- **Numero de Cedula** (campo de texto que solo recibe numeros, identificador unico).
- **Placa del vehiculo** (campo de texto de 6 caracteres entre letras y numeros, no permite espacios ni simbolos, se convierte automaticamente a mayusculas).
- **Fecha** (campo inactivo para el usuario, se autocompleta con la fecha y hora actual en zona horaria America/Bogota).

### Deteccion del tipo de vehiculo por placa

Al ingresar la placa, el sistema debe analizar el formato:

- Si la placa tiene el formato `ABC123` (tres letras seguidas de tres numeros): vehiculo **auto**.
- Si la placa tiene el formato `ABC12D` (tres letras, dos numeros, una letra): vehiculo **moto**.

Una vez detectado el tipo, se muestra automaticamente el formulario correspondiente (moto o auto). Si el formato no coincide con ninguno de los dos, debe solicitar seleccionar el tipo de vehiculo (Moto/Auto) y mostrar el formulario correspondiente.

### Endpoint de estado del dia

Antes de mostrar el formulario, la PWA debe consultar el endpoint `GET /api/v1/inspection-status?cedula=X&placa=Y` que retorna:

- `already_submitted`: boolean (si ya diligencio hoy para esa cedula + placa).
- `photos_required`: boolean (si hoy es dia de fotos).
- `photos_pending_from_previous_days`: boolean (si tiene fotos pendientes de dias anteriores de esta semana).
- `photo_config`: array con las fotos requeridas (tipo, descripcion).
- `vehicle_type`: string detectado por la placa (o null si no se detecta).
- `is_first_registration`: boolean (si es la primera vez que esta cedula + placa se registra).

---

## Formulario para MOTO

Si el vehiculo detectado es moto, el formulario debe estar compuesto por las siguientes secciones y preguntas. La ultima pregunta de cada seccion ("Otro - Cual") debe desplegar unicamente un `textarea`. Para las demas preguntas, se deben mostrar dos opciones seleccionables (Bueno / Malo) y un `textarea` para observaciones.

### Seccion: Elementos de Proteccion Personal (EPP'S - MOTO)

1. Guantes, Casco, prendas reflectivas.
2. Proteccion dorsal, rodilleras.
3. Otro - Cual (solo `textarea`).

### Seccion: ESTADO GENERAL DEL VEHICULO - MOTO

1. Mangueras hidraulicas, bateria, frenos y cableado.
2. Suspension (Horquilla, Amortiguadores y eje del manillar).
3. Escape, tapa y tanque de combustible.
4. Kit de arrastre (Pinon, corona y cadena).
5. Carenaje, asiento, guardabarros y soporte de estacionamiento.
6. Otro - Cual (solo `textarea`).

### Seccion: ESTADO GENERAL DEL VEHICULO (LLANTAS, LUCES) - MOTO

1. Delantera y trasera (Rines, pernos completos y ajustados, presion, labrado Min - 1.0 a 1.6 mm).
2. Luces (Altas, bajas, parqueo, freno, direccionales traseras y delanteras).
3. Otro - Cual (solo `textarea`).

---

## Formulario para AUTO

Si el vehiculo detectado es auto, el formulario debe estar compuesto por las siguientes secciones y preguntas, con la misma logica de componentes: picker Bueno/Malo + textarea para observaciones en preguntas regulares, y solo textarea para la opcion "Otro - Cual".

### Seccion: ESTADO GENERAL DEL VEHICULO - AUTO

1. Mangueras hidraulicas y aire, bateria, correas y cableado.
2. Caja de cambios, freno de mano, pedales freno, acelerador y embrague.
3. Latoneria y pintura, tapa del tanque de combustible y tubo de escape.
4. Sistema de distribucion, sistema de direccion y sistema de suspension.
5. Nivel de agua, lubricante, combustible, liquido de freno, aceite, refrigerante.
6. Indicadores de presion de aceite, velocidad, nivel de bateria, combustible, temperatura, Indicador de luces (altas, direccionales y parqueo).
7. Otro - Cual (solo `textarea`).

### Seccion: ESTADO GENERAL DEL VEHICULO - CARRO

1. Aire acondicionado, asientos, bocina o pito, vidrios, luces de cabina, piso y puertas.
2. Cinturones de seguridad y Airbag.
3. Otro - Cual (solo `textarea`).

### Seccion: ESTADO GENERAL DEL VEHICULO - CARRO - LLANTAS

1. Delantera izquierda y derecha (Rines, pernos completos y ajustados, presion, labrado Min - 3 mm).
2. Trasera izquierda y derecha (Rines, pernos completos y ajustados, presion, labrado Min 1.6 a 3 mm).
3. Llanta de repuesto (Rin, pernos completos y ajustados, presion, labrado Min - 3 mm).
4. Otro - Cual (solo `textarea`).

### Seccion: ESTADO GENERAL DEL VEHICULO - CARRO - LUCES Y ESPEJOS

1. Luces (Altas, bajas, cocuyos, parqueo delanteras y traseras, direccionales traseras y delanteras, freno, exploradoras y tercer stop).
2. Espejo retrovisor y espejos laterales, panoramico, vidrios traseros y laterales, limpia parabrisas delantero y trasero.
3. Otro - Cual (solo `textarea`).

### Seccion: ESTADO GENERAL DEL VEHICULO - CARRO - EMERGENCIAS

1. Botiquin, extintor, linterna, senales de carretera (Kit de derrames si aplica).
2. Cables de arranque, cruceta, gato elevador y kit de herramientas basicas.
3. Otro - Cual (solo `textarea`).

---

## Fotos del vehiculo

### Regla general

- La solicitud de fotos se realiza unicamente los **lunes habiles** (segun el calendario de dias festivos de Colombia). Si el lunes es festivo o feriado, esta peticion se traslada automaticamente al siguiente dia habil (martes).
- En ese dia, el sistema debe exigir al usuario subir fotografias actuales del vehiculo antes de completar el formulario. No se permitira enviar el formulario sin las fotos requeridas.

### Fotos requeridas por defecto

- Si el vehiculo es **moto**: dos fotos (costado izquierdo y costado derecho).
- Si el vehiculo es **auto**: cuatro fotos (frontal, posterior, lateral izquierdo y lateral derecho).

### Bloqueo por fotos pendientes

- El bloqueo opera por combinacion **cedula + placa**.
- Si no se enviaron las fotos requeridas el dia que correspondia (lunes habil o martes si lunes fue festivo), el formulario queda bloqueado los dias siguientes de esa semana (martes, miercoles, jueves, viernes) hasta que se envien las fotos junto con el formulario.
- **Primera vez de un colaborador**: cuando una combinacion cedula + placa se registra por primera vez (sin importar el dia de la semana), el sistema debe exigir fotos en ese primer registro. A partir de ahi, la siguiente solicitud de fotos sera el proximo lunes habil (o dia habil siguiente si ese lunes es festivo).

### Validacion de fotos

- Validar que el archivo sea una imagen real (MIME type: image/jpeg, image/png, image/heic, image/webp).
- Dimensiones minimas: 640x480 pixeles.
- Tamano minimo: 100 KB (para evitar imagenes vacias o capturas de pantalla de baja calidad).
- **Validacion de metadatos EXIF**: extraer y almacenar fecha de captura y coordenadas GPS de los metadatos EXIF de la imagen. Si los metadatos EXIF no estan disponibles (algunos dispositivos los eliminan), registrar esta ausencia pero no bloquear el envio. Los metadatos se almacenan junto con la foto para auditoria.

### Configuracion de fotos desde el panel de administracion

- El superadmin y el admin pueden modificar, desde el panel de administracion, la cantidad y el tipo de fotos (agregar fotos de las ruedas, del casco, del reflectivo, kit de carretera, etc.).
- La configuracion es por tipo de vehiculo (moto / auto).
- Esta configuracion afectara a todos los formularios futuros (no retroactivos).

### Politica de retencion de fotos

- Las fotos se conservan en el servidor durante **3 meses** (90 dias).
- Cada semana, al cargarse las nuevas fotos de un colaborador para un vehiculo, las fotos anteriores a 3 meses se eliminan automaticamente mediante un job programado (cron).
- El job de limpieza se ejecuta una vez al dia en horario de baja actividad (ej. 2:00 AM America/Bogota).

---

## Gestion de feriados y festivos

### Calculo algoritmico

Los dias festivos de Colombia se calculan algoritmicamente segun la Ley 51 de 1983 (Ley Emiliani):

- **Fiestas fijas**: 1 de enero, 1 de mayo, 20 de julio, 7 de agosto, 8 de diciembre, 25 de diciembre.
- **Fiestas fijas religiosas**: Jueves y Viernes Santos (calculados a partir del algoritmo de Pascua/Computus).
- **Fiestas trasladadas al lunes siguiente** (Ley Emiliani): 6 de enero, 19 de marzo, 29 de junio, 15 de agosto, 12 de octubre, 1 de noviembre, 11 de noviembre. Ademas: Ascension del Senor (Pascua + 43 dias, trasladado al lunes), Corpus Christi (Pascua + 64 dias, trasladado al lunes), Sagrado Corazon de Jesus (Pascua + 71 dias, trasladado al lunes).

El backend debe implementar una funcion que calcule todos los festivos para cualquier ano dado.

### Tabla de overrides

Ademas del calculo algoritmico, el sistema mantiene una tabla `holiday_overrides` editable desde el panel de administracion (solo superadmin) que permite:

- **Agregar festivos** no contemplados por la ley (ej. un dia decretado por el gobierno como festivo extraordinario).
- **Remover festivos** calculados (en caso de que la ley cambie y un dia deje de ser festivo).

El sistema siempre consulta primero los overrides y luego el calculo algoritmico. Los overrides tienen prioridad.

### Uso de los festivos

- Determinar los dias habiles en los que el diligenciamiento es obligatorio (lunes a sabado, excluyendo festivos).
- Desplazar la solicitud de fotos cuando el lunes sea festivo (al siguiente dia habil).
- Calcular dias sin diligenciar para alertas de WhatsApp (solo dias habiles cuentan como dias de incumplimiento).

**Nota sobre dias habiles**: para efectos de esta aplicacion, los dias habiles son de **lunes a sabado**, excluyendo festivos. Los domingos no son habiles.

---

## Base de datos

Se usara PostgreSQL para almacenar toda la informacion. El esquema debe ser flexible para permitir la parametrizacion de secciones y preguntas por parte de los administradores.

### Tablas principales

- `admin_users`: id, email, role (superadmin/admin), name, is_active, created_at, updated_at.
- `collaborators`: id, cedula (unique), first_name, last_name, phone, is_active, created_at, updated_at.
- `collaborator_vehicles`: id, collaborator_id (FK), plate, vehicle_type (auto/moto/null), created_at.
- `sections`: id, vehicle_type (auto/moto), name, display_order, is_active, created_at, updated_at.
- `questions`: id, section_id (FK), text, is_other (boolean, para "Otro - Cual"), display_order, is_active, created_at, updated_at.
- `photo_configs`: id, vehicle_type (auto/moto), label (ej. "Frontal", "Lateral izquierdo"), is_required, display_order, is_active, created_at, updated_at.
- `inspections`: id, collaborator_id (FK), plate, vehicle_type, inspection_date (date, zona America/Bogota), created_at (timestamp UTC). Constraint UNIQUE(collaborator_id, plate, inspection_date).
- `inspection_answers`: id, inspection_id (FK), question_id (FK), answer (bueno/malo/null), observations (text), created_at.
- `inspection_photos`: id, inspection_id (FK), photo_config_id (FK), file_path, original_filename, mime_type, file_size_bytes, exif_date (timestamp nullable), exif_lat (decimal nullable), exif_lng (decimal nullable), exif_available (boolean), created_at.
- `holiday_overrides`: id, date (date, unique), action (add/remove), description, created_by (FK admin_users), created_at.
- `app_settings`: key (PK), value (text), updated_at, updated_by (FK admin_users). Claves: whatsapp_alert_threshold (default "6"), admin_report_email, whatsapp_admin_phone, etc.

### Timezone

- Todas las timestamps se almacenan en UTC en PostgreSQL.
- La conversion a America/Bogota (UTC-5) se realiza en la capa de aplicacion (backend).
- La columna `inspection_date` es de tipo `DATE` y se calcula al momento del envio usando la fecha local en America/Bogota.

---

## Frontend

### Tecnologias

- **Mantine UI** obligatorio para todos los componentes, tanto en la PWA como en el panel de administracion.
- React como framework de frontend.
- React Router para enrutamiento.

### PWA (Progressive Web App) - exclusiva para rol "usuario"

- Archivo `manifest.json` configurado con nombre corto ("Preoperacional"), nombre completo ("Preoperacional Propartes"), iconos en distintos tamanos (192x192, 512x512), start_url: "/", display: standalone, theme_color, background_color.
- Service Worker registrado para cacheo de recursos estaticos y posibilidad de funcionamiento offline basico (almacenamiento temporal del formulario en IndexedDB y sincronizacion al reconectar). La funcionalidad offline es recomendada pero opcional en la primera version.
- Debe permitir la instalacion en la pantalla de inicio de dispositivos moviles (Android e iOS) mediante el evento `beforeinstallprompt` o un boton personalizado.
- La PWA **no incluye** ninguna interfaz de administracion, solo el formulario de preoperacional. Si alguien intenta acceder a rutas de administracion desde la PWA (viewport < 1024px), debe redirigir a la pagina del formulario o mostrar un mensaje de "Acceso no permitido desde este dispositivo".

### Panel de administracion (solo escritorio)

- Login para administradores y superadministradores mediante **magic link** (email sin contrasena).
- Deteccion por **viewport**: si el ancho de pantalla es menor a 1024px, mostrar mensaje indicando que use un equipo de escritorio. No bloquear de forma dura.
- Secciones del panel:

  **Dashboard**: resumen del dia (formularios diligenciados, pendientes, alertas activas).

  **Registros**: vista de filtro por colaborador (cedula, nombre), placa y/o rango de fechas, mostrando registros diligenciados con detalle expandible. Exportacion a Excel/CSV.

  **Colaboradores**: CRUD completo. Carga masiva via CSV. Ver historial de cada colaborador. Activar/desactivar.

  **Secciones y preguntas**: CRUD para ambos tipos de vehiculo (moto/auto). Reordenar secciones y preguntas. Activar/desactivar.

  **Configuracion de fotos**: cantidad, descripciones, obligatoriedad, por tipo de vehiculo.

  **Usuarios administradores**: crear, desactivar, eliminar, modificar (solo superadmin puede gestionar otros admins).

  **Festivos**: vista de calendario con los festivos calculados y los overrides. Agregar/remover overrides (solo superadmin).

  **Configuracion general**: umbral de dias sin diligenciar para alerta WhatsApp (por defecto 6 dias habiles), email destinatario del reporte diario, telefono WhatsApp del admin.

---

## Backend y logica

### Tecnologias

- API REST construida con Node.js (Express), dentro de la carpeta `backend/`.
- Todas las rutas bajo el prefijo `/api/v1/`.
- Documentacion Swagger/OpenAPI accesible en `/api/v1/docs`.

### Endpoints publicos (PWA, sin autenticacion)

- `GET /api/v1/inspection-status?cedula=X&placa=Y` - Estado del dia para la combinacion cedula + placa.
- `GET /api/v1/sections?vehicle_type=auto|moto` - Secciones y preguntas activas para el tipo de vehiculo.
- `GET /api/v1/photo-config?vehicle_type=auto|moto` - Configuracion de fotos requeridas.
- `POST /api/v1/inspections` - Envio del formulario con respuestas y fotos (multipart/form-data).
- `GET /api/v1/holidays?year=YYYY` - Festivos del ano (para que la PWA pueda determinar si es dia habil).

### Validaciones en endpoints publicos

- Formato de placa (6 caracteres alfanumericos, sin espacios ni simbolos).
- Unicidad por dia: no puede existir otro registro para la misma **cedula + placa + fecha** (inspection_date).
- Si es dia de fotos (o tiene fotos pendientes de la semana), no permite envio sin fotos.
- Validacion de fotos: MIME type, dimensiones minimas, tamano minimo, extraccion de metadatos EXIF.
- La fecha del formulario (inspection_date) se registra automaticamente con la fecha actual en America/Bogota.

### Endpoints privados (panel de administracion, autenticacion JWT)

- `POST /api/v1/auth/magic-link` - Envia magic link al correo del admin.
- `POST /api/v1/auth/verify` - Verifica el token del magic link y retorna JWT.
- `GET /api/v1/auth/me` - Retorna datos del admin autenticado.
- CRUD para: colaboradores, secciones, preguntas, photo_configs, admin_users, holiday_overrides, app_settings.
- `GET /api/v1/admin/inspections` - Listado con filtros (cedula, placa, fecha_desde, fecha_hasta) y paginacion.
- `GET /api/v1/admin/inspections/export` - Exportacion a Excel/CSV con los mismos filtros.
- `POST /api/v1/admin/collaborators/import-csv` - Importacion masiva de colaboradores.
- `GET /api/v1/admin/dashboard` - Datos resumidos para el dashboard.
- `GET /api/v1/admin/alerts` - Colaboradores con dias habiles sin diligenciar por encima del umbral.

---

## Envio de correo diario (Resend)

- Usar la API de Resend para enviar un correo electronico al administrador (direccion configurable en `app_settings`).
- El correo se envia **todos los dias habiles (lunes a sabado, excluyendo festivos) a las 8:00 AM** (hora de Colombia, America/Bogota).
- El correo contiene el **reporte completo del dia habil anterior** (todas las inspecciones registradas entre las 00:00:00 y las 23:59:59 del dia anterior).
- El reporte se adjunta como archivo Excel (.xlsx) con las columnas: nombre del colaborador, cedula, placa, tipo de vehiculo, fecha, seccion, pregunta, respuesta (Bueno/Malo), observaciones, enlace a las fotos (si las hay).
- Adicionalmente, el correo incluye un resumen en el cuerpo: total de formularios recibidos, lista de colaboradores activos que no diligenciaron, y alertas de fotos pendientes.
- La tarea de envio se programa con `node-cron` respetando la zona horaria America/Bogota.
- **Sin emojis** en ningun elemento del correo (asunto, cuerpo, adjunto).

---

## Alerta por WhatsApp Business API (Cloud API)

### Integracion directa

Dado que ya se cuenta con la cuenta de WhatsApp Business verificada y el numero aprobado, la integracion se realiza directamente con la **Meta Cloud API** (no como modulo desacoplado).

### Plantilla de mensaje

Se debe crear una plantilla de mensaje en Meta Business Manager con el siguiente contenido (sin emojis):

- **Nombre de plantilla**: `alerta_inspeccion_pendiente`
- **Categoria**: UTILITY
- **Idioma**: es
- **Cuerpo**: `Alerta de inspeccion preoperacional: El colaborador {{1}} (Cedula: {{2}}) lleva {{3}} dias habiles consecutivos sin diligenciar el formulario preoperacional para el vehiculo con placa {{4}}. Se requiere atencion inmediata.`

### Logica de alertas

- La verificacion se ejecuta diariamente a las **11:00 AM** (America/Bogota) mediante un job programado (cron).
- Solo se ejecuta en dias habiles (lunes a sabado, excluyendo festivos).
- Para cada colaborador **activo** con al menos un vehiculo asignado, se calcula la cantidad de dias habiles consecutivos sin registro (contando hacia atras desde el dia actual).
- Si la cantidad supera el umbral configurado (por defecto **6 dias habiles**), se envia la alerta al numero de WhatsApp del administrador configurado en `app_settings`.
- La alerta se envia **una vez** cuando se supera el umbral. No se reenvia diariamente para el mismo colaborador a menos que el conteo aumente en un multiplo del umbral (ej. si el umbral es 6, se alerta a los 6, 12, 18 dias, etc.).
- Se lleva un registro en base de datos de las alertas enviadas para evitar duplicados.

### Variables de entorno requeridas

- `WHATSAPP_PHONE_NUMBER_ID`: ID del numero de telefono en Meta.
- `WHATSAPP_ACCESS_TOKEN`: Token de acceso permanente de la API.
- `WHATSAPP_TEMPLATE_NAME`: Nombre de la plantilla (default: `alerta_inspeccion_pendiente`).

---

## Restricciones y reglas innegociables

1. **Totalmente prohibido usar emojis** en toda la aplicacion: interfaz, correos, mensajes de WhatsApp, notificaciones, logs, etc.

2. **Estructura del proyecto obligatoria:**

```
mi-app/
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── src/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
├── docker-compose.yml          # desarrollo local
├── docker-compose.prod.yml     # produccion
├── .env.example                # plantilla de variables (SIN valores reales)
├── .gitignore
└── README.md
```

3. Todo el codigo va en `frontend/` y `backend/`, nunca en la raiz.
4. Debe existir un archivo `docker-compose.prod.yml` listo para produccion con: healthchecks, restart policies (`restart: unless-stopped`), limites de memoria, volumenes nombrados para PostgreSQL y uploads, red interna para comunicacion backend-db.
5. Debe existir un archivo `.env.example` con todas las variables de entorno necesarias, con valores de ejemplo o descripcion, nunca con secretos reales.
6. El `.gitignore` debe excluir como minimo: `.env`, `node_modules/`, `dist/`, `uploads/`, `*.log`.
7. No se aceptan dependencias fuera del contenedor. Si la aplicacion requiere `sharp`, `exiftool` u otro binario, debe instalarse en el Dockerfile correspondiente. (`sharp` se necesitara para validacion de imagenes y extraccion EXIF).
8. No se deben subir `node_modules/` al repositorio. El `npm install` se ejecuta dentro del contenedor durante el build.
9. **Versionamiento de API**: todas las rutas bajo `/api/v1/`. Preparado para futura v2 sin romper clientes existentes.
10. **Zona horaria**: todas las timestamps en UTC en base de datos. Conversion a America/Bogota en la capa de aplicacion. El campo `inspection_date` es tipo DATE calculado con la fecha local.

---

## Notas adicionales para el desarrollo

- La PWA y el panel de administracion estan en la misma aplicacion frontend, con enrutamiento que discrimine por viewport y rol. Proteger las rutas `/admin/*` con verificacion de JWT y ancho de viewport minimo.
- La aplicacion es multiusuario; cada colaborador solo ve sus propios formularios (si se implementa historial en PWA). El admin/superadmin puede ver todos.
- El formulario guarda un registro historico completo, sin sobrescribir envios anteriores.
- Las fotos se almacenan en un volumen montado (`./uploads:/app/uploads`) con estructura de directorios: `uploads/{year}/{month}/{cedula}_{placa}/{filename}`. Configurable para S3 compatible mediante variables de entorno (futuro).
- Toda la interfaz de administracion usa Mantine UI para consistencia visual.
- Validaciones tanto en frontend como en backend (formato de placa, campos obligatorios, fotos, fechas).
- La API esta documentada con Swagger/OpenAPI accesible en `/api/v1/docs`.
- La base de datos PostgreSQL se levanta como un servicio mas en `docker-compose.yml` y `docker-compose.prod.yml`.

---

## Entregables

El proyecto debe cumplir con todos los puntos anteriores, ser completamente funcional y desplegable mediante los archivos `docker-compose.yml` (desarrollo) y `docker-compose.prod.yml` (produccion). Se debe incluir un archivo `README.md` con instrucciones claras sobre:

- Como levantar el proyecto por primera vez.
- Como ejecutar migraciones de base de datos.
- Como configurar las variables de entorno a partir de `.env.example`.
- Como crear el primer superadministrador (seed o comando).
- Como crear la plantilla de WhatsApp en Meta Business Manager.
- Estructura del proyecto y descripcion de cada servicio.
