# Pipeline y Despliegue

**Sistema Preoperacional Propartes — Version 1.1**

---

## Proceso de despliegue (manual)

El proyecto no tiene CI/CD automatizado actualmente. El despliegue se realiza de forma manual siguiendo este proceso:

### 1. Preparar el cambio

```bash
# En la maquina de desarrollo
git add <archivos>
git commit -m "descripcion del cambio"
git push origin main
```

### 2. Aplicar en produccion

```bash
# En el servidor de produccion
cd /ruta/al/proyecto
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build
```

### 3. Verificar el despliegue

```bash
# Ver que todos los contenedores esten sanos
docker-compose -f docker-compose.prod.yml ps

# Ver logs del backend
docker logs backend_node --tail=30

# Health check
curl https://preoperacional.sudominio.com/api/v1/health
```

---

## Build del frontend

El build de produccion del frontend se realiza dentro del contenedor Docker en dos etapas (multi-stage):

**Etapa 1 — build:** `node:20-alpine` ejecuta `npm run build` y genera los archivos estaticos en `/app/dist`.

**Etapa 2 — produccion:** `nginx:alpine` sirve los archivos estaticos y hace proxy de `/api/` al backend.

El build incluye las variables `VITE_*` del `.env` en tiempo de compilacion. Si cambia `VITE_API_URL`, se debe reconstruir el frontend con `--build`.

---

## Versionado

El proyecto usa versionado semantico (semver):

| Tipo de cambio | Version |
|---|---|
| Correcciones de bugs | Patch: 1.1.0 → 1.1.1 |
| Nuevas funcionalidades compatibles | Minor: 1.1.0 → 1.2.0 |
| Cambios de arquitectura o breaking changes | Major: 1.1.0 → 2.0.0 |

La version se registra en el mensaje del commit y en `package.json`.

---

## Configuracion de CI/CD recomendada (futura)

Si se implementa GitHub Actions u otra herramienta de CI/CD, el pipeline sugerido seria:

```yaml
# .github/workflows/deploy.yml (referencia — no implementado aun)

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Lint backend
        run: cd backend && npm install && npm run lint

      - name: Lint frontend
        run: cd frontend && npm install && npm run lint

      - name: Deploy to production
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /ruta/al/proyecto
            git pull origin main
            docker-compose -f docker-compose.prod.yml up -d --build
```

**Variables de entorno del CI** que necesitaria:
- `SERVER_HOST`: IP o dominio del servidor de produccion.
- `SERVER_USER`: Usuario SSH.
- `SERVER_SSH_KEY`: Llave privada SSH del servidor.

---

## Rollback en produccion

Si un despliegue rompe algo:

```bash
# Ver el commit anterior
git log --oneline -5

# Volver al commit anterior
git checkout <hash-del-commit-anterior>

# Reconstruir con la version anterior
docker-compose -f docker-compose.prod.yml up -d --build

# Volver a main cuando este listo el fix
git checkout main
```

> Si la version nueva incluia migraciones, el rollback del codigo NO revierte la base de datos. Las columnas o tablas nuevas quedaran en la DB. Esto generalmente es seguro (las columnas extras no rompen el backend anterior), pero debe evaluarse caso por caso.
