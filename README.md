# Spring Air Dashboard MVP

Dashboard en `Next.js + Tailwind CSS` alimentado por un JSON preprocesado desde `vta competencia.xlsx`.

## Scripts

```bash
npm run data:build
npm run data:validate
npm run dev
```

## Flujo de actualización

1. Reemplaza `vta competencia.xlsx` por el archivo más reciente.
2. Ejecuta `npm run data:build`.
3. Ejecuta `npm run data:validate`.
4. Levanta el sitio con `npm run dev` o despliega.

## Notas

- El histórico está visible como placeholder y no usa datos mock.
- El mapa depende de `data/store-coordinates.json`.
- La capa `getDashboardData()` permite cambiar la fuente a una DB después sin rehacer el frontend.
