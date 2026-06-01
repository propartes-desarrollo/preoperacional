# Manual de Usuario

**Sistema Preoperacional Propartes — Version 1.1**

---

## Tabla de Contenidos

1. [Para el Colaborador de Campo (PWA)](#1-para-el-colaborador-de-campo-pwa)
   - [Acceder al formulario](#11-acceder-al-formulario)
   - [Verificacion de identidad y vehiculo](#12-verificacion-de-identidad-y-vehiculo)
   - [Completar el formulario de inspeccion](#13-completar-el-formulario-de-inspeccion)
   - [Envio de fotos del vehiculo](#14-envio-de-fotos-del-vehiculo)
   - [Confirmacion y errores](#15-confirmacion-y-errores)
2. [Para el Administrador (Panel Web)](#2-para-el-administrador-panel-web)
   - [Inicio de sesion](#21-inicio-de-sesion)
   - [Dashboard](#22-dashboard)
   - [Gestion de colaboradores](#23-gestion-de-colaboradores)
   - [Revision de inspecciones](#24-revision-de-inspecciones)
   - [Exportacion de reportes](#25-exportacion-de-reportes)
   - [Configuracion de secciones y preguntas](#26-configuracion-de-secciones-y-preguntas)
   - [Configuracion de fotos requeridas](#27-configuracion-de-fotos-requeridas)
   - [Gestion de dias festivos](#28-gestion-de-dias-festivos)
   - [Configuracion del sistema](#29-configuracion-del-sistema)
   - [Gestion de usuarios administradores](#210-gestion-de-usuarios-administradores)

---

## 1. Para el Colaborador de Campo (PWA)

### 1.1 Acceder al formulario

1. Abra el navegador en su celular (Chrome, Safari o Firefox).
2. Ingrese la URL que le proporcionaron, por ejemplo: `https://preoperacional.propartes.com`.
3. No necesita crear cuenta ni contrasena. El sistema lo reconoce por su cedula y placa.

> **Recomendacion:** Agregue el enlace a la pantalla de inicio de su celular para acceder mas rapido. En Chrome: menu (tres puntos) > "Agregar a pantalla de inicio".

---

### 1.2 Verificacion de identidad y vehiculo

Al abrir la aplicacion vera dos campos:

| Campo | Descripcion |
|---|---|
| **Cedula** | Su numero de cedula de ciudadania (solo digitos) |
| **Placa** | Placa del vehiculo que va a inspeccionar (6 caracteres, sin espacios) |

Despues de ingresar estos datos, el sistema verifica:

- Si ya registro una inspeccion hoy para esa cedula y placa: **muestra un mensaje de inspeccion ya realizada**.
- Si el dia de hoy no es dia habil (domingo o festivo): **muestra aviso de dia no habil**.
- Si es el primer lunes habil de la semana o su primera vez registrando ese vehiculo: **le solicitara fotos**.

---

### 1.3 Completar el formulario de inspeccion

El formulario esta dividido en secciones segun el tipo de vehiculo:

**Para motos:**
- Elementos de Proteccion Personal (EPP)
- Estado general del vehiculo
- Estado de llantas y luces

**Para carros:**
- Estado general del vehiculo (mecanica)
- Estado del habitaculo
- Estado de llantas
- Estado de luces y espejos
- Elementos de emergencia

Para cada pregunta debe seleccionar:

| Respuesta | Significado |
|---|---|
| **Bueno** | El elemento se encuentra en buen estado |
| **Malo** | El elemento presenta falla o anomalia |

Si marca **Malo**, aparecera un campo de observacion para describir el problema. En la pregunta "Otro - Cual" puede describir libremente un hallazgo adicional.

---

### 1.4 Envio de fotos del vehiculo

Las fotos se requieren obligatoriamente en dos casos:

1. **Primer lunes habil de cada semana** (o martes si el lunes es festivo).
2. **Primera vez** que registra ese vehiculo (cedula + placa nuevos).

Si ya envio fotos esta semana y no es dia de fotos, el formulario no las pedira.

**Requisitos de las fotos:**
- Formato: JPG, PNG, WebP o HEIC
- Tamano minimo: 100 KB
- Resolucion minima: 640 x 480 pixeles
- Deben tomarse en el momento (se valida metadata EXIF)

**Fotos requeridas por tipo de vehiculo:**

| Vehiculo | Fotos |
|---|---|
| Moto | Costado izquierdo, Costado derecho |
| Carro | Frontal, Posterior, Lateral izquierdo, Lateral derecho |

Para cada foto: toque el area designada, seleccione "Camara" para tomar la foto en el momento, o "Galeria" para subir una existente.

---

### 1.5 Confirmacion y errores

**Envio exitoso:** Vera un mensaje verde de confirmacion con el numero de inspeccion registrado.

**Errores comunes:**

| Mensaje | Causa | Solucion |
|---|---|---|
| "Ya existe una inspeccion para esta cedula, placa y fecha" | Ya registro hoy con esos datos | No se puede duplicar. Contacte a TI si fue un error |
| "Faltan fotos requeridas" | Dia de fotos y no adjunto todas | Adjunte las fotos faltantes y reintente |
| "La foto es demasiado pequena" | Foto menor a 100 KB | Tome la foto con la camara del celular directamente |
| "Dimensiones insuficientes" | Foto de baja resolucion | Use la camara del celular, no fotos de muy baja calidad |
| "Tipo de vehiculo no reconocido" | Placa con formato especial | Seleccione manualmente el tipo: carro o moto |

---

## 2. Para el Administrador (Panel Web)

### 2.1 Inicio de sesion

El panel de administracion es de **uso exclusivo en computador** (pantalla minima de 1024px).

**Pasos para ingresar:**

1. Vaya a `https://preoperacional.propartes.com/admin` desde su navegador.
2. Ingrese su correo electronico registrado en el sistema.
3. Haga clic en **"Enviar enlace de acceso"**.
4. Revise su correo: recibira un enlace con validez de **15 minutos**.
5. Haga clic en el enlace. El sistema lo autenticara automaticamente.
6. La sesion dura 7 dias. Despues debe repetir el proceso.

> El sistema no usa contrasenas. Cada inicio de sesion genera un enlace unico de un solo uso.

---

### 2.2 Dashboard

La pantalla principal muestra el resumen del dia actual:

| Tarjeta | Descripcion |
|---|---|
| **Inspecciones hoy** | Total de formularios recibidos hoy, desglosado por colaboradores de frecuencia diaria y eventual |
| **Colaboradores activos** | Total de colaboradores activos en el sistema, desglosado por frecuencia |
| **Faltan hoy** | Colaboradores que aun no han registrado su inspeccion del dia, desglosados por frecuencia |

Tambien muestra:
- **Grafica de los ultimos 7 dias:** tendencia de inspecciones por fecha.
- **Lista de colaboradores que faltan:** nombre, placa y tipo de frecuencia.
- **Indicadores especiales:** si es dia habil y si es dia de fotos obligatorias.

---

### 2.3 Gestion de colaboradores

**Menu:** Colaboradores

**Funciones disponibles:**

**Buscar y filtrar:**
- Por nombre o cedula (campo de busqueda).
- Por estado: activos / inactivos.
- Por frecuencia: diaria / eventual.

**Crear colaborador manualmente:**
1. Clic en **"Nuevo colaborador"**.
2. Diligencie: cedula, nombre, apellido, telefono (opcional), frecuencia.
3. Agregue uno o mas vehiculos con su placa y tipo.
4. Clic en **"Guardar"**.

**Importar desde CSV:**
1. Clic en **"Importar CSV"**.
2. Descargue la plantilla de ejemplo.
3. Diligencie la plantilla con los datos de sus colaboradores.
4. Cargue el archivo. El sistema validara cada fila y mostrara errores si los hay.

**Formato del CSV:**

| Columna | Requerido | Descripcion |
|---|---|---|
| cedula | Si | Numero de cedula (6-12 digitos) |
| first_name | Si | Nombre |
| last_name | Si | Apellido |
| phone | No | Telefono celular (10 digitos, para WhatsApp) |
| plate | No | Placa del vehiculo (6 caracteres) |
| vehicle_type | No | `auto` o `moto` |
| is_active | No | `true` o `false` (por defecto `true`) |
| inspection_frequency | No | `daily` o `eventual` (por defecto `daily`) |

**Editar colaborador:** Haga clic en el nombre del colaborador, modifique los campos y guarde.

**Desactivar colaborador:** Edite y cambie el estado a "Inactivo". Los colaboradores inactivos no reciben recordatorios ni aparecen en reportes de faltantes.

---

### 2.4 Revision de inspecciones

**Menu:** Inspecciones

Permite consultar todas las inspecciones registradas con filtros:

| Filtro | Descripcion |
|---|---|
| Fecha desde / hasta | Rango de fechas |
| Cedula o placa | Busqueda exacta o parcial |
| Tipo de vehiculo | Auto o moto |

Al hacer clic en una inspeccion vera el detalle completo: todas las respuestas por seccion, observaciones y fotos adjuntas.

---

### 2.5 Exportacion de reportes

**Menu:** Inspecciones > **"Exportar"**

Genera un archivo Excel (.xlsx) con los datos de inspecciones segun los filtros aplicados.

El archivo incluye:
- Datos del colaborador (cedula, nombre)
- Datos del vehiculo (placa, tipo)
- Fecha de inspeccion
- Todas las respuestas con sus observaciones
- Resumen de fotos

Tambien se envia automaticamente un reporte diario por correo a las 8:00 AM en dias habiles, con los datos del dia anterior como adjunto Excel.

---

### 2.6 Configuracion de secciones y preguntas

**Menu:** Secciones / Preguntas

Permite personalizar el formulario que ven los colaboradores.

**Secciones:** Grupos de preguntas (por ejemplo "Estado de Llantas"). Cada seccion pertenece a un tipo de vehiculo (auto o moto).

**Preguntas:** Cada item del formulario. Tiene un texto y pertenece a una seccion.

> **Precaucion:** Desactivar una pregunta no la elimina; deja de mostrarse en formularios nuevos pero los registros historicos la conservan.

---

### 2.7 Configuracion de fotos requeridas

**Menu:** Configuracion de Fotos

Permite agregar, editar o desactivar los tipos de foto requeridos por vehiculo.

Cada configuracion tiene:
- **Etiqueta:** nombre descriptivo (ej: "Frontal", "Costado izquierdo").
- **Obligatoria:** si se exige en los dias de fotos.
- **Orden de visualizacion.**

---

### 2.8 Gestion de dias festivos

**Menu:** Festivos (solo superadmin)

El sistema calcula automaticamente los festivos colombianos (Ley 51 de 1983 y Ley Emiliani). Este panel permite:

- **Agregar un festivo extraordinario:** para dias no previstos por la ley.
- **Remover un festivo:** si un dia calculado como festivo debe tratarse como habil.

---

### 2.9 Configuracion del sistema

**Menu:** Configuracion

| Parametro | Descripcion |
|---|---|
| **Umbral de dias para alerta de inactividad** | Numero de dias habiles consecutivos sin inspeccion para que el sistema envie una alerta por correo a los administradores |
| **Hora de envio del recordatorio WhatsApp** | Hora (formato HH:MM, zona Bogota) en que se envia el recordatorio diario a colaboradores activos con frecuencia diaria |

---

### 2.10 Gestion de usuarios administradores

**Menu:** Usuarios (solo superadmin)

Permite crear, editar y desactivar cuentas de acceso al panel de administracion.

**Roles disponibles:**

| Rol | Permisos |
|---|---|
| **admin** | Acceso a todas las secciones excepto: usuarios, festivos y configuracion avanzada |
| **superadmin** | Acceso total, incluyendo gestion de usuarios, festivos y configuracion |

> Los administradores activos tambien reciben automaticamente las alertas de inactividad por correo.
