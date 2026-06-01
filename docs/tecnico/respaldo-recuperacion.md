# Procedimientos de Respaldo y Recuperacion

**Sistema Preoperacional Propartes — Version 1.1**

---

## Que se debe respaldar

| Componente | Metodo | Frecuencia recomendada |
|---|---|---|
| Base de datos PostgreSQL | `pg_dump` | Diario |
| Fotos de inspecciones | Copia del volumen Docker | Semanal |
| Archivo `.env` | Copia segura (no en Git) | Cada cambio |

---

## Respaldo de la base de datos

### Respaldo completo

```bash
# Crear un dump comprimido de la base de datos
docker exec base_de_datos_postgresql pg_dump \
  -U preoperacional_user \
  -d preoperacional_db \
  -Fc \
  > backup_$(date +%Y%m%d_%H%M%S).dump
```

El archivo `.dump` contiene todos los datos y el esquema.

### Script de respaldo automatico (crontab del servidor host)

Agregue esta linea al crontab del usuario root o del sistema:

```bash
# Ejecute: crontab -e
# Respaldo diario a las 3:00 AM
0 3 * * * docker exec base_de_datos_postgresql pg_dump -U preoperacional_user -d preoperacional_db -Fc > /backups/preoperacional_$(date +\%Y\%m\%d).dump 2>> /var/log/backup_preoperacional.log
```

Asegurese de que el directorio `/backups/` exista y tenga espacio suficiente.

### Rotacion de backups

Para conservar solo los ultimos 30 dias:

```bash
find /backups/ -name "preoperacional_*.dump" -mtime +30 -delete
```

---

## Respaldo de fotos

Las fotos se almacenan en el volumen Docker `uploads_data_preoperacional`, que corresponde al directorio `/app/uploads` dentro del contenedor `backend_node`.

```bash
# Crear archivo tar del volumen
docker run --rm \
  -v uploads_data_preoperacional:/data \
  -v /backups:/backup \
  alpine tar czf /backup/uploads_$(date +%Y%m%d).tar.gz -C /data .
```

---

## Restaurar la base de datos

### Desde un dump existente

```bash
# 1. Detener el backend para evitar escrituras durante la restauracion
docker-compose -f docker-compose.prod.yml stop backend_node

# 2. Restaurar el dump
docker exec -i base_de_datos_postgresql pg_restore \
  -U preoperacional_user \
  -d preoperacional_db \
  --clean \
  --if-exists \
  < /backups/preoperacional_20260601.dump

# 3. Reiniciar el backend
docker-compose -f docker-compose.prod.yml start backend_node
```

> El flag `--clean` elimina los objetos existentes antes de restaurar. Use con cuidado: borrara los datos actuales.

### Restaurar en un servidor nuevo

```bash
# 1. Crear la base de datos vacia (se crea automaticamente al iniciar Docker)
docker-compose -f docker-compose.prod.yml up -d base_de_datos_postgresql

# 2. Esperar que PostgreSQL este listo
sleep 10

# 3. Restaurar
docker exec -i base_de_datos_postgresql pg_restore \
  -U preoperacional_user \
  -d preoperacional_db \
  < /backups/preoperacional_20260601.dump

# 4. Iniciar el resto de servicios
docker-compose -f docker-compose.prod.yml up -d
```

---

## Restaurar fotos

```bash
# Detener el backend
docker-compose -f docker-compose.prod.yml stop backend_node

# Restaurar el volumen de fotos
docker run --rm \
  -v uploads_data_preoperacional:/data \
  -v /backups:/backup \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/uploads_20260601.tar.gz -C /data"

# Reiniciar el backend
docker-compose -f docker-compose.prod.yml start backend_node
```

---

## Escenarios de fallo y recuperacion

### Fallo: contenedor PostgreSQL no inicia

```bash
# Ver logs del contenedor
docker logs base_de_datos_postgresql --tail=100

# Si los datos estan corruptos, restaurar desde backup
docker-compose -f docker-compose.prod.yml down
docker volume rm postgres_data_preoperacional
docker-compose -f docker-compose.prod.yml up -d base_de_datos_postgresql
# Luego restaurar el dump
```

### Fallo: backend no inicia por error de migracion

```bash
# Ver logs
docker logs backend_node --tail=100

# Si hay una migracion fallida, revisar cual
docker exec -it base_de_datos_postgresql psql \
  -U preoperacional_user -d preoperacional_db \
  -c "SELECT * FROM schema_migrations ORDER BY name DESC LIMIT 5;"

# Revertir ultima migracion manualmente si es necesario
docker exec -it backend_node node src/migrate-cli.js down
```

### Fallo: servidor completo caido (VM o servidor fisico)

1. Restaurar o levantar el servidor con el mismo SO.
2. Instalar Docker y Docker Compose.
3. Clonar el repositorio.
4. Copiar el archivo `.env` desde su respaldo seguro.
5. Restaurar el volumen de base de datos desde el ultimo dump.
6. Restaurar el volumen de fotos si es necesario.
7. Ejecutar `docker-compose -f docker-compose.prod.yml up -d --build`.

---

## Verificacion post-recuperacion

```bash
# Health check
curl https://preoperacional.sudominio.com/api/v1/health

# Verificar conteo de datos
docker exec -it base_de_datos_postgresql psql \
  -U preoperacional_user -d preoperacional_db \
  -c "SELECT COUNT(*) FROM inspections; SELECT COUNT(*) FROM collaborators;"
```
