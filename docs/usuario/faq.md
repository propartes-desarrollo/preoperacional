# Preguntas Frecuentes (FAQ)

**Sistema Preoperacional Propartes — Version 1.1**

---

## Preguntas del colaborador de campo

**¿Tengo que crear una cuenta o contrasena?**  
No. Solo necesita su cedula y la placa del vehiculo. El sistema lo identifica con esos datos.

**¿Puedo registrar la inspeccion desde mi computador?**  
Si, pero la aplicacion esta disenada y optimizada para celular. Funciona en cualquier navegador moderno.

**¿Que pasa si me equivoque al seleccionar una respuesta?**  
Puede corregirla antes de enviar el formulario. Una vez enviado, no es posible modificarla desde la aplicacion; contacte al administrador.

**¿Por que no me deja enviar el formulario hoy?**  
Puede ser porque: (1) ya registro una inspeccion hoy con esa cedula y placa, (2) hoy es domingo o festivo y el sistema esta configurado para no aceptar envios ese dia, o (3) tiene fotos pendientes de esta semana que aun no ha enviado.

**¿Que hago si la foto no pasa la validacion?**  
Tome la foto directamente con la camara de su celular en el momento de la inspeccion. Evite subir fotos enviadas por WhatsApp o de muy baja calidad. La foto debe pesar al menos 100 KB y tener resolucion minima de 640x480.

**¿Tengo que enviar fotos todos los dias?**  
No. Las fotos solo se exigen el primer lunes habil de cada semana y la primera vez que registra un vehiculo. Los demas dias solo completa el formulario.

**¿Que significa el mensaje de recordatorio que me llega por WhatsApp?**  
Es un recordatorio automatico que el sistema envia cada dia habil para que no olvide registrar su inspeccion. El mensaje incluye el enlace directo al formulario.

**¿Puedo registrar varios vehiculos?**  
Si. Cada vehiculo (cedula + placa) es un registro independiente. Debe llenar un formulario separado por cada vehiculo que opere en el dia.

**¿Que pasa si no tengo internet?**  
La aplicacion no funciona sin conexion a internet. Si no tiene senial, espere a tener conexion y envie el formulario. Si el dia ya termino, contacte al administrador.

---

## Preguntas del administrador

**¿Por que no me llego el enlace de acceso?**  
Revise la carpeta de spam o correos no deseados. El enlace llega desde el dominio de correo configurado en el sistema. Si no llega en 5 minutos, intente nuevamente. Si persiste, contacte a TI.

**¿Cuanto dura la sesion del panel de administracion?**  
7 dias. Pasado ese tiempo debera solicitar un nuevo enlace de acceso.

**¿Puedo agregar un administrador adicional?**  
Si, si tiene rol de superadmin. Vaya a "Usuarios" y cree el nuevo administrador con su correo. El nuevo administrador recibira las alertas de inactividad automaticamente.

**¿Como agrego un festivo que no esta en el calendario?**  
Vaya a "Festivos" (solo superadmin) y use la opcion "Agregar festivo". Esa fecha se tratara como no habil para todos los efectos del sistema.

**¿Por que el reporte de correo no llego?**  
El reporte se envia solo en dias habiles a las 8:00 AM. Si el dia anterior no fue habil o si no hubo inspecciones, igualmente se envia. Si no llego, verifique que su correo este registrado como admin activo en "Usuarios".

**¿Puedo cambiar la hora del recordatorio WhatsApp?**  
Si. En "Configuracion" modifique el campo "Hora de envio del recordatorio" y guarde. El cambio surte efecto en menos de un minuto sin necesidad de reiniciar el sistema.

**¿Que significa "Eventual" en la frecuencia de un colaborador?**  
Un colaborador de frecuencia "Eventual" no recibe recordatorios diarios de WhatsApp y no cuenta en los calculos de inactividad. Se usa para personal que no opera vehiculos todos los dias.

**¿Cuanto tiempo se guardan las fotos?**  
90 dias por defecto. Despues de ese periodo se eliminan automaticamente. Este valor es configurable por TI en las variables de entorno.

**¿Como exporto todas las inspecciones de un mes?**  
En "Inspecciones", filtre por el rango de fechas deseado y haga clic en "Exportar". Descargara un archivo Excel con todos los registros del periodo.

**¿Puedo desactivar un colaborador que ya no trabaja?**  
Si. Edite el colaborador y cambielo a "Inactivo". Dejara de aparecer en reportes de faltantes y no recibira recordatorios, pero sus inspecciones historicas se conservan.
