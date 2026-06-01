# Solucion de Problemas (Troubleshooting)

**Sistema Preoperacional Propartes — Version 1.1**

---

## Errores del colaborador en el formulario

### "Ya existe una inspeccion para esta cedula, placa y fecha"

**Causa:** El colaborador ya envio el formulario hoy con esa cedula y placa.  
**Solucion:** Si fue un error (cedula o placa equivocada en el registro previo), contacte al administrador. No es posible eliminar inspecciones desde el panel; se requiere acceso a la base de datos.

---

### "Este dia no es habil, no se pueden registrar inspecciones"

**Causa:** El sistema detecta que hoy es domingo, festivo colombiano, o un festivo agregado manualmente.  
**Solucion:** Si el dia deberia ser habil, el superadmin puede ir a **Festivos** y usar la opcion "Remover festivo" para esa fecha.

---

### "Faltan fotos requeridas: Frontal, Posterior"

**Causa:** Es dia de fotos (primer lunes habil de la semana o primera vez de ese vehiculo) y no se adjuntaron todas las fotos.  
**Solucion:** El colaborador debe tomar y adjuntar todas las fotos requeridas antes de enviar.

---

### "La foto es demasiado pequena (minimo 100 KB)"

**Causa:** La imagen fue comprimida (por ejemplo, al enviarla por WhatsApp o descargarla de una red social).  
**Solucion:** Tomar la foto directamente con la camara del celular en el momento de la inspeccion y seleccionarla desde la galeria sin compresion.

---

### El formulario muestra "tipo de vehiculo no reconocido"

**Causa:** La placa tiene un formato especial que no encaja en los patrones `ABC123` (auto) ni `ABC12D` (moto).  
**Solucion:** El colaborador puede seleccionar manualmente el tipo. Si la placa es incorrecta, editar el colaborador en el panel.

---

## Errores del administrador en el panel

### No llega el magic link al correo

**Causas posibles y soluciones:**

1. El correo no esta registrado como admin activo → verificar en **Usuarios**.
2. El correo cayo en spam → revisar la carpeta de no deseados.
3. La API key de Resend no esta configurada o expirada → verificar `RESEND_API_KEY` en el `.env` y el estado del dominio en el panel de Resend.
4. El dominio remitente no esta verificado en Resend → verificar en [resend.com](https://resend.com).

---

### "Token invalido o expirado"

**Causa:** El magic link tiene validez de 15 minutos y ya expiro, o el enlace fue usado anteriormente.  
**Solucion:** Solicitar un nuevo enlace desde `/admin`.

---

### El dashboard muestra error al cargar

**Causa:** El backend no esta respondiendo o hay un error en la base de datos.  
**Solucion:**  
```bash
docker logs backend_node --tail=50
curl https://preoperacional.sudominio.com/api/v1/health
```

---

## Errores de sistema (para TI)

### El backend no inicia — "PostgreSQL no disponible despues de 30 segundos"

**Causa:** El contenedor de PostgreSQL no esta listo o las credenciales son incorrectas.  
**Solucion:**
```bash
docker logs base_de_datos_postgresql --tail=50
docker-compose -f docker-compose.prod.yml ps
```
Verificar que `DATABASE_URL` en el `.env` coincida con `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_DB`.

---

### El backend no inicia — "Fallo migracion 00X_nombre"

**Causa:** Una migracion fallo. Puede ser por un cambio en el esquema que genera conflicto.  
**Solucion:**
```bash
docker exec -it base_de_datos_postgresql psql \
  -U preoperacional_user -d preoperacional_db \
  -c "SELECT * FROM schema_migrations ORDER BY applied_at DESC LIMIT 5;"
```
Si la migracion fallida necesita revertirse:
```bash
docker exec -it backend_node node src/migrate-cli.js down
```

---

### Los recordatorios de WhatsApp no se envian

**Verificar paso a paso:**

1. Confirmar que el backend esta corriendo:
   ```bash
   docker logs backend_node --tail=20 | grep dailyReminder
   ```
2. Verificar que las variables de WhatsApp estan configuradas:
   ```bash
   docker exec backend_node printenv | grep WHATSAPP
   ```
3. Verificar que el token de WhatsApp es valido:
   ```bash
   curl -G "https://graph.facebook.com/v25.0/me" \
     --data-urlencode "access_token=EAAxxxxxxx"
   ```
4. Verificar que la hora configurada coincide con la hora actual de Bogota:
   ```bash
   docker exec backend_node date
   ```
5. Verificar que hay colaboradores activos con frecuencia `daily` y telefono:
   ```sql
   SELECT COUNT(*) FROM collaborators 
   WHERE is_active = true AND inspection_frequency = 'daily' AND phone IS NOT NULL;
   ```

---

### Las fotos no se guardan / Error al subir fotos

**Verificar:**
```bash
# Ver si el volumen de fotos esta montado
docker exec backend_node ls /app/uploads

# Verificar permisos del directorio
docker exec backend_node stat /app/uploads
```

Si el directorio no existe o no tiene permisos de escritura:
```bash
docker-compose -f docker-compose.prod.yml down
docker volume inspect uploads_data_preoperacional
docker-compose -f docker-compose.prod.yml up -d
```

---

### El reporte diario por correo no llega

**Verificar:**
1. Que hoy es dia habil (si es festivo o domingo, el reporte no se envia).
2. Logs del job:
   ```bash
   docker logs backend_node --tail=100 | grep dailyReport
   ```
3. Que `RESEND_API_KEY` y `RESEND_FROM_EMAIL` esten correctamente configurados.
4. Que el dominio remitente este verificado en Resend.

---

### Error "CORS no permitido" en el navegador

**Causa:** El origen del navegador no coincide con `CORS_ORIGIN` en el `.env`.  
**Solucion:** Verificar que `CORS_ORIGIN` incluye la URL exacta desde donde se accede (con protocolo y sin barra final). Luego reiniciar el backend.

---

### El contenedor de PostgreSQL muestra "out of memory"

**Causa:** El limite de memoria de 512 MB en `docker-compose.prod.yml` se quedo corto.  
**Solucion:** Aumentar el limite en el archivo o asignar mas RAM al servidor. Tambien revisar si hay queries costosas no optimizadas con:
```sql
SELECT * FROM pg_stat_activity WHERE state = 'active';
```
