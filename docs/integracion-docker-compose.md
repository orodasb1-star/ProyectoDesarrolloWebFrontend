# Integrar el frontend al docker-compose del backend

La idea: el mismo API Gateway (Nginx, puerto 443) sirve el frontend en `/` y la API en `/api/*`.
Así el navegador y la API comparten origen: **no hay problemas de CORS** y la cámara del
escáner funciona porque la página va por HTTPS.

## 1. Copiar la carpeta

Copia la carpeta `irtra-frontend/` dentro de la raíz del backend (`ProyectoFinalDesarrolloWeb/frontend/`).

## 2. Agregar el servicio en `docker-compose.yml`

```yaml
  frontend:
    build:
      context: ./frontend
    container_name: irtra-frontend
    restart: unless-stopped
    networks:
      - irtra_net
```

Y en `api-gateway` → `depends_on`, agrega `- frontend`.

## 3. Cambiar la ruta por defecto del gateway

En `nginx/conf.d/default.conf`, dentro del `server` HTTPS, reemplaza el bloque final:

```nginx
    # Ruta por defecto
    location / {
        default_type application/json;
        return 404 '{"success":false,...}';
    }
```

por:

```nginx
    # Frontend React (SPA)
    location / {
        set $frontend_backend "http://frontend:80";
        proxy_pass $frontend_backend;
    }
```

## 4. Levantar

```powershell
docker compose up -d --build
```

Abre **https://localhost** (acepta el certificado autofirmado).
