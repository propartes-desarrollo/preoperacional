# Gestion de Usuarios y Roles

**Sistema Preoperacional Propartes — Version 1.1**

---

## Roles del sistema

### admin

Tiene acceso completo de lectura y escritura excepto las funciones criticas reservadas al superadmin.

**Puede:**
- Ver y navegar el dashboard.
- Crear, editar y desactivar colaboradores.
- Importar colaboradores por CSV.
- Consultar y filtrar inspecciones.
- Exportar inspecciones a Excel.
- Gestionar secciones, preguntas y configuracion de fotos.
- Recibir alertas de inactividad por correo (si esta activo).

**No puede:**
- Gestionar usuarios administradores.
- Agregar o quitar festivos extraordinarios.
- Ver o modificar la configuracion del sistema (`app_settings`).

---

### superadmin

Tiene acceso total al sistema.

**Ademas de todo lo de admin, puede:**
- Crear, editar y desactivar usuarios administradores.
- Asignar roles (admin o superadmin).
- Agregar y eliminar festivos extraordinarios.
- Modificar la configuracion del sistema (umbral de inactividad, hora de recordatorio).

---

## Crear un usuario administrador

> Requiere rol **superadmin**.

1. En el panel de administracion, ir a **Usuarios**.
2. Hacer clic en **"Nuevo usuario"**.
3. Completar:
   - **Correo electronico** (debe ser valido, es la direccion donde llegan los magic links y las alertas).
   - **Nombre completo**.
   - **Rol:** `admin` o `superadmin`.
4. Hacer clic en **"Guardar"**.

El usuario puede iniciar sesion de inmediato usando el flujo de magic link con el correo registrado.

---

## Editar un usuario administrador

1. En **Usuarios**, hacer clic en el nombre del usuario.
2. Modificar los campos necesarios.
3. Guardar.

> No es posible cambiar el correo electronico de un usuario existente. Si el correo cambia, debe desactivar el usuario actual y crear uno nuevo.

---

## Desactivar un usuario administrador

1. Editar el usuario.
2. Cambiar estado a **"Inactivo"**.
3. Guardar.

Un usuario inactivo:
- No puede iniciar sesion (aunque tenga un token JWT activo, el middleware lo rechaza).
- No recibe alertas de inactividad por correo.
- Sus registros historicos de accion se conservan.

---

## Comportamiento de las alertas por correo

Las alertas de inactividad se envian automaticamente a **todos los administradores activos** (sin importar el rol). No hay una configuracion separada de destinatarios: cualquier admin activo en la tabla `admin_users` recibe las alertas.

Para agregar un nuevo destinatario de alertas: cree un usuario admin activo.  
Para quitar un destinatario: desactive el usuario admin correspondiente.

---

## Primer acceso al sistema (seed inicial)

El primer superadmin se crea automaticamente durante el seed inicial, usando las variables de entorno:

```env
INITIAL_SUPERADMIN_EMAIL=admin@sudominio.com
INITIAL_SUPERADMIN_NAME=Nombre Administrador
```

El seed solo se ejecuta si la tabla `admin_users` esta vacia. No crea usuarios duplicados en instalaciones existentes.

---

## Recuperacion de acceso

Si un administrador no puede acceder:

1. Verificar que el correo sea el correcto y este activo en **Usuarios**.
2. Verificar que el correo de magic link no haya caido en spam.
3. Si el enlace expiro (15 minutos), solicitar uno nuevo desde `/admin`.
4. Si el usuario fue desactivado por error, reactivarlo desde otro superadmin.

Si el unico superadmin perdio acceso, contacte al equipo de TI para reactivarlo directamente en la base de datos:

```sql
UPDATE admin_users SET is_active = true WHERE email = 'admin@sudominio.com';
```
