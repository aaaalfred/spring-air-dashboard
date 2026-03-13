# Spring Air Dashboard

Dashboard comercial para Spring Air en Sears, construido con `Next.js`, alimentado por un JSON preprocesado desde el Excel de ventas.

## Que resuelve

El proyecto concentra una lectura comercial de:

- resumen ejecutivo de ventas, piezas, ticket, share y ranking
- competidores y participacion de mercado
- productos, tiendas y mapa comercial
- analitica de cobertura, oportunidad, surtido, precio y calidad de dato
- historico con capa mock de referencia

## Fuente de datos

La fuente operativa parte del archivo:

- `vta competencia.xlsx`

El frontend no lee el Excel directamente en runtime. Para operar la app se genera antes un archivo:

- `public/dashboard_data.json`

Esto permite desplegar la aplicacion sin cargar el Excel al contenedor de produccion.

## Requisitos

- Node.js 22 recomendado
- npm

## Scripts principales

```bash
npm install
npm run data:build
npm run data:validate
npm run dev
```

Scripts disponibles:

- `npm run dev`: levanta la app en local
- `npm run build`: compila Next para produccion
- `npm run start`: ejecuta la build de produccion
- `npm run lint`: valida el codigo
- `npm run data:build`: regenera `public/dashboard_data.json`
- `npm run data:validate`: valida consistencia basica del JSON generado

## Flujo de actualizacion de datos

Cuando llegue un nuevo corte de ventas:

1. Reemplaza `vta competencia.xlsx` por el archivo actualizado.
2. Ejecuta `npm run data:build`.
3. Ejecuta `npm run data:validate`.
4. Revisa el dashboard en local con `npm run dev`.
5. Si el resultado es correcto, despliega la nueva version.

## Ejecucion local

```bash
npm install
npm run data:build
npm run dev
```

La aplicacion queda disponible por default en:

- [http://localhost:3000](http://localhost:3000)

## Docker

El proyecto ya incluye:

- `Dockerfile`
- `.dockerignore`

La imagen esta preparada para produccion con `Next.js standalone`.

### Build local de Docker

```bash
docker build -t spring-air-dashboard .
```

### Run local de Docker

```bash
docker run --rm -p 3000:3000 spring-air-dashboard
```

La app quedara disponible en:

- [http://localhost:3000](http://localhost:3000)

## Deploy en Dockploy

Configuracion sugerida:

- Build context: raiz del proyecto
- Dockerfile path: `Dockerfile`
- Puerto de la app: `3000`

Notas importantes:

- La app en produccion usa `public/dashboard_data.json`
- El Excel `vta competencia.xlsx` no es necesario dentro del contenedor
- Si cambia el Excel, primero hay que regenerar el JSON y luego volver a desplegar

## Consideraciones de negocio

- La pestana `Analitica` incluye una capa de ayuda explicativa para entender calculos y criterios.
- `Share objetivo por tienda` se construye con el promedio de participacion de las 10 tiendas benchmark con mejor share actual.
- Tambien existe una capa mock de `promotoria supuesta` para apoyar lectura comercial mientras no exista una base real de promotores.
- El detalle de este analisis para usuarios finales esta documentado en:
  - `docs/analitica-share-oportunidad.md`

## Archivos clave

- `app/page.tsx`: entrada principal
- `components/dashboard/dashboard-shell.tsx`: shell general del dashboard
- `components/dashboard/analytics-panel.tsx`: pestaña de analitica
- `lib/dashboard/transform.ts`: transformacion del Excel a estructura de dashboard
- `lib/dashboard/get-dashboard-data.ts`: lectura del JSON para runtime
- `public/dashboard_data.json`: dataset consumido por la app
- `data/store-coordinates.json`: coordenadas del mapa

## Validacion recomendada antes de liberar

```bash
npm run data:build
npm run data:validate
npm run lint
npm run build
```

## Estado de Git para despliegue

Antes de hacer commit o deploy, revisa:

- que `public/dashboard_data.json` corresponda al ultimo corte aprobado
- que no se suba un Excel incorrecto o temporal
- que los cambios mock de negocio esten claramente identificados si aun no hay dato real
