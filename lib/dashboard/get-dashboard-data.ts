import { promises as fs } from "fs";
import path from "path";

import { historicalFixture } from "@/data/historical-fixture";
import type { DashboardData, HistoricalData, HistoricalMonth, ProductRow, StoreRow } from "@/lib/dashboard/types";

function toHistoricalTopProducts(products: ProductRow[]) {
  return products.slice(0, 5).map((product) => ({
    nombre: product.descripcion,
    venta: Number(product.ventas.toFixed(2)),
    piezas: product.piezas,
  }));
}

function toHistoricalTopStores(stores: StoreRow[]) {
  return stores.slice(0, 5).map((store) => ({
    nombre: store.tienda,
    venta: Number(store.ventas.toFixed(2)),
    piezas: store.piezas,
  }));
}

function buildHybridHistorical(parsed: DashboardData): HistoricalData {
  const januaryEntry: HistoricalMonth = {
    mes: `${parsed.metadata.dateRange.year}-${String(parsed.metadata.dateRange.month).padStart(2, "0")}`,
    mesNombre: `${parsed.metadata.dateRange.monthLabel} ${parsed.metadata.dateRange.year}`,
    ventas: Number(parsed.resumen.ventas.toFixed(2)),
    piezas: parsed.resumen.piezas,
    marketShare: Number(parsed.resumen.marketShare.toFixed(4)),
    ticketPromedio: Number(parsed.resumen.ticketPromedio.toFixed(2)),
    skusActivos: parsed.resumen.skusActivos,
    tiendasActivas: parsed.resumen.tiendasActivas,
    topProductos: toHistoricalTopProducts(parsed.productos),
    topTiendas: toHistoricalTopStores(parsed.tiendas),
  };

  const entries = historicalFixture.entries.map((entry) =>
    entry.mes === januaryEntry.mes ? januaryEntry : entry,
  );

  const first = entries[0];
  const last = entries[entries.length - 1];
  const totalVentas = entries.reduce((sum, entry) => sum + entry.ventas, 0);
  const totalPiezas = entries.reduce((sum, entry) => sum + entry.piezas, 0);
  const avgShare = entries.reduce((sum, entry) => sum + entry.marketShare, 0) / entries.length;
  const growth = first.ventas > 0 ? ((last.ventas - first.ventas) / first.ventas) * 100 : 0;

  return {
    ...historicalFixture,
    description:
      "Historico hibrido: agosto a diciembre siguen como referencia mock y enero 2026 ya refleja los datos reales del Excel actual.",
    generatedAt: parsed.metadata.generatedAt,
    entries,
    metrics: {
      crecimientoVentas: Number(growth.toFixed(2)),
      promedioMensualVentas: Number((totalVentas / entries.length).toFixed(2)),
      promedioMensualPiezas: Number((totalPiezas / entries.length).toFixed(1)),
      marketSharePromedio: Number(avgShare.toFixed(4)),
    },
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const filePath = path.join(process.cwd(), "public", "dashboard_data.json");
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as DashboardData;

  return {
    ...parsed,
    historico: buildHybridHistorical(parsed),
  };
}
