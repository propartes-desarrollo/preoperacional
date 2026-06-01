# Glosario de Terminos

**Sistema Preoperacional Propartes — Version 1.1**

---

| Termino | Definicion |
|---|---|
| **Cedula** | Numero de cedula de ciudadania colombiana. Es el identificador unico de cada colaborador en el sistema. Nunca se usa el nombre como identificador. |
| **Colaborador** | Persona registrada en el sistema que opera uno o mas vehiculos de la empresa. |
| **Colaborador activo** | Colaborador que actualmente opera vehiculos y debe registrar inspecciones. Recibe recordatorios y aparece en reportes. |
| **Colaborador inactivo** | Colaborador que ya no opera vehiculos. Sus datos historicos se conservan pero no genera alertas ni aparece en reportes de faltantes. |
| **Dia habil** | Dia en que se esperan inspecciones. Corresponde a lunes a sabado, excluyendo festivos colombianos y domingos. |
| **Dia de fotos** | Primer lunes habil de cada semana (o martes si el lunes es festivo). En este dia todos los colaboradores deben adjuntar fotos del vehiculo ademas del formulario. |
| **Festivo** | Dia no habil segun la ley colombiana (Ley 51 de 1983 y Ley Emiliani) o segun adicion manual del administrador. |
| **Frecuencia diaria (daily)** | Tipo de colaborador que debe registrar inspeccion todos los dias habiles. Recibe recordatorios por WhatsApp. |
| **Frecuencia eventual** | Tipo de colaborador que no opera vehiculos todos los dias. No recibe recordatorios y no se cuenta en calculos de inactividad. |
| **Inspeccion preoperacional** | Revision del estado del vehiculo que el colaborador realiza antes de operar el vehiculo cada dia. Se registra a traves del formulario digital. |
| **Inspeccion duplicada** | Intento de registrar una segunda inspeccion para la misma cedula, placa y fecha. El sistema lo rechaza. |
| **Magic link** | Enlace de acceso unico enviado por correo electronico para autenticar administradores sin necesidad de contrasena. Tiene validez de 15 minutos. |
| **Panel de administracion** | Interfaz web exclusiva para personal administrativo. Accesible desde computador en `/admin`. |
| **Placa** | Identificador alfanumerico de 6 caracteres del vehiculo. Junto con la cedula, forma el identificador unico de cada inspeccion. |
| **PWA** | Progressive Web App. Aplicacion web instalable en el celular como si fuera una app nativa. Es la interfaz que usan los colaboradores de campo. |
| **Recordatorio WhatsApp** | Mensaje automatico enviado diariamente a colaboradores activos de frecuencia diaria para recordarles que registren su inspeccion. |
| **Reporte diario** | Correo electronico enviado automaticamente a las 8:00 AM en dias habiles a todos los administradores activos, con las inspecciones del dia anterior en formato Excel. |
| **Rol admin** | Nivel de acceso al panel con permisos para consultar, crear y editar colaboradores, inspecciones, secciones y fotos. |
| **Rol superadmin** | Nivel de acceso maximo. Incluye todo lo de admin mas gestion de usuarios administradores, festivos y configuracion del sistema. |
| **Seccion** | Grupo tematico de preguntas del formulario (ej: "Estado de Llantas"). Cada seccion pertenece a un tipo de vehiculo. |
| **Tipo de vehiculo** | Clasificacion del vehiculo: `auto` (carro) o `moto`. Determina que secciones y fotos se exigen. El sistema lo detecta automaticamente por el formato de la placa. |
| **Token JWT** | Credencial digital que el sistema genera tras autenticar al administrador. Se almacena en el navegador y autoriza las peticiones al panel por 7 dias. |
| **Umbral de inactividad** | Numero de dias habiles consecutivos sin inspeccion a partir del cual el sistema envia una alerta de inactividad a los administradores. Configurable en el panel. |
| **Validacion EXIF** | Extraccion de los metadatos de la foto (fecha, coordenadas GPS) para verificar que fue tomada en el momento de la inspeccion. |
