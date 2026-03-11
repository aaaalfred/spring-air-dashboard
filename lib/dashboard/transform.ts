import { readFileSync } from "fs";
import path from "path";

import * as XLSX from "xlsx";

import type {
  CompetitorRow,
  ConcentrationStats,
  DailyPoint,
  DashboardData,
  Insight,
  MapStore,
  MarketSkuRow,
  ProductRow,
  StoreRow,
} from "@/lib/dashboard/types";

type CellValue = string | number | boolean | null | undefined;

interface BaseRecord {
  proveedorId: number | null;
  proveedor: string;
  tiendaId: number | null;
  tienda: string;
  interno: number | null;
  descripcion: string;
  ventas: number;
  piezas: number;
  dailySales: number[];
  dailyPieces: number[];
}

interface CoordinateRow {
  tienda: string;
  lat: number;
  lon: number;
}

const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const SALES_DAY_ORDER = Array.from({ length: 31 }, (_, index) => index + 1);
const SALES_COLUMN_INDEXES = Array.from({ length: 31 }, (_, index) => 35 + index);
const PIECES_COLUMN_INDEXES = Array.from({ length: 31 }, (_, index) => 4 + index);
const TOTAL_PIECES_INDEX = 66;
const TOTAL_SALES_INDEX = 67;
const BASE_COLUMNS = 68;
const SPRING_NAME_MATCHER = /SPRING AIR/i;
const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

function asText(value: CellValue) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function asNumber(value: CellValue) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "boolean" || value === null || value === undefined) return 0;
  const normalized = String(value).replace(/,/g, "").trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseEntity(value: string) {
  const match = value.match(/^(\d+)\s+(.*)$/);
  if (!match) {
    return {
      id: null,
      name: value.trim(),
    };
  }

  return {
    id: Number(match[1]),
    name: match[2].trim(),
  };
}

function parseSheetPeriod(sheetName: string, headerRows: CellValue[][]) {
  const [startRaw, endRaw, monthRaw] = sheetName.split("-").map((chunk) => Number(chunk));
  const month = Number.isFinite(monthRaw) && monthRaw >= 1 && monthRaw <= 12 ? monthRaw : 1;
  const startDay = Number.isFinite(startRaw) ? startRaw : 1;
  const endDay = Number.isFinite(endRaw) ? endRaw : 31;
  const headerText = headerRows
    .flat()
    .map(asText)
    .join(" ");
  const yearMatch = headerText.match(
    /\b(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)\s+(\d{2,4})\b/i,
  );
  const yearRaw = yearMatch?.[2] ? Number(yearMatch[2]) : new Date().getFullYear();
  const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
  const monthLabel = MONTHS_ES[month - 1] ?? MONTHS_ES[0];

  return {
    startDay,
    endDay,
    month,
    monthLabel,
    year,
    totalDays: endDay - startDay + 1,
    label: `${startDay}-${endDay} ${monthLabel} ${year}`,
  };
}

function getFamilyName(description: string) {
  const text = description.toUpperCase();
  for (const family of [
    "THERAPY",
    "HARLEM",
    "ASTON",
    "EVERTON",
    "PALMER",
    "PERSONALITY",
    "SKY",
    "FOSTER",
    "GRAFF",
    "DINASTY",
    "BILBAO",
    "PURPLE",
    "DREAMTECH",
    "CELEBRATION",
  ]) {
    if (text.includes(family)) return family;
  }

  return "OTROS";
}

function topShare<T>(rows: T[], take: number, getValue: (row: T) => number, denominator: number) {
  if (!denominator || rows.length === 0) return 0;
  const total = rows.slice(0, take).reduce((sum, row) => sum + getValue(row), 0);
  return total / denominator;
}

function buildInsights(
  products: ProductRow[],
  stores: StoreRow[],
  concentration: ConcentrationStats,
  marketShare: number,
) {
  const insights: Insight[] = [];
  const topProduct = products[0];
  const topStore = stores[0];
  const strongestStore = [...stores].sort((left, right) => right.shareDentroTienda - left.shareDentroTienda)[0];
  const weakestStore = [...stores]
    .filter((store) => store.ventas > 0)
    .sort((left, right) => left.shareDentroTienda - right.shareDentroTienda)[0];

  if (topProduct) {
    insights.push({
      tone: "success",
      title: `Producto estrella: ${topProduct.descripcion}`,
      body: `Genera ${money.format(topProduct.ventas)} con ${topProduct.piezas.toLocaleString(
        "es-MX",
      )} piezas y aporta ${(topProduct.participacionSpring * 100).toFixed(1)}% de Spring Air.`,
    });
  }

  if (concentration.top20PctSkusShare >= 0.5) {
    insights.push({
      tone: "warning",
      title: "Alta concentración en pocos SKUs",
      body: `El top 20% del portafolio concentra ${(concentration.top20PctSkusShare * 100).toFixed(
        1,
      )}% de la venta Spring Air. Conviene revisar profundidad y cobertura del resto del surtido.`,
    });
  }

  if (marketShare < 0.15) {
    insights.push({
      tone: "info",
      title: "Hay espacio para crecer participación",
      body: `Spring Air hoy representa ${(marketShare * 100).toFixed(
        1,
      )}% del mercado analizado. El potencial inmediato está en tiendas donde la categoría ya mueve volumen, pero la marca aún participa poco.`,
    });
  }

  if (topStore) {
    insights.push({
      tone: "info",
      title: `Tienda ancla: ${topStore.tienda}`,
      body: `Es la plaza más relevante para Spring Air con ${money.format(
        topStore.ventas,
      )} en ventas. Vale la pena replicar ese mix comercial en otras plazas comparables.`,
    });
  }

  if (strongestStore && weakestStore) {
    insights.push({
      tone: "warning",
      title: "Contraste fuerte entre plazas",
      body: `${strongestStore.tienda} aporta ${(strongestStore.shareDentroTienda * 100).toFixed(
        1,
      )}% de su tienda, mientras ${weakestStore.tienda} apenas llega a ${(
        weakestStore.shareDentroTienda * 100
      ).toFixed(1)}%. Hay oportunidad clara de corregir cobertura o ejecución comercial.`,
    });
  }

  return insights.slice(0, 5);
}

function buildDailySeries(records: BaseRecord[]): DailyPoint[] {
  return SALES_DAY_ORDER.map((day, index) => {
    const ventas = records.reduce((sum, record) => sum + record.dailySales[index], 0);
    const piezas = records.reduce((sum, record) => sum + record.dailyPieces[index], 0);
    return {
      dia: day,
      ventas,
      piezas,
      ticketPromedio: piezas > 0 ? ventas / piezas : 0,
    };
  });
}

function loadCoordinates() {
  const filePath = path.join(process.cwd(), "data", "store-coordinates.json");
  const raw = readFileSync(filePath, "utf8");
  return JSON.parse(raw) as CoordinateRow[];
}

export function buildDashboardData(excelFilePath: string): DashboardData {
  const workbook = XLSX.readFile(excelFilePath);
  const sourceSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sourceSheet];

  if (!sheet) {
    throw new Error("No se encontró la hoja principal del Excel.");
  }

  const rows = XLSX.utils.sheet_to_json<CellValue[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
  });

  const headerRows = rows.slice(0, 5);
  const rawRows = rows.slice(5).map((row) => row.slice(0, BASE_COLUMNS));
  const period = parseSheetPeriod(sourceSheet, headerRows);
  const records: BaseRecord[] = [];

  for (const row of rawRows) {
    const proveedorRaw = asText(row[0]);
    if (!proveedorRaw) continue;
    if (proveedorRaw.toLowerCase() === "total general") break;

    const proveedor = parseEntity(proveedorRaw);
    const tienda = parseEntity(asText(row[1]));

    records.push({
      proveedorId: proveedor.id,
      proveedor: proveedor.name,
      tiendaId: tienda.id,
      tienda: tienda.name,
      interno: row[2] ? asNumber(row[2]) : null,
      descripcion: asText(row[3]),
      dailyPieces: PIECES_COLUMN_INDEXES.map((index) => asNumber(row[index])),
      dailySales: SALES_COLUMN_INDEXES.map((index) => asNumber(row[index])),
      piezas: asNumber(row[TOTAL_PIECES_INDEX]),
      ventas: asNumber(row[TOTAL_SALES_INDEX]),
    });
  }

  const marketSales = records.reduce((sum, record) => sum + record.ventas, 0);
  const marketUnits = records.reduce((sum, record) => sum + record.piezas, 0);

  const supplierMap = new Map<string, CompetitorRow>();
  const supplierStores = new Map<string, Set<string>>();
  const supplierSkus = new Map<string, Set<number>>();

  for (const record of records) {
    const key = `${record.proveedorId ?? "na"}-${record.proveedor}`;
    const current = supplierMap.get(key) ?? {
      proveedorId: record.proveedorId,
      proveedor: record.proveedor,
      ventas: 0,
      piezas: 0,
      marketShare: 0,
      ticketPromedio: 0,
      tiendasActivas: 0,
      skus: 0,
    };

    current.ventas += record.ventas;
    current.piezas += record.piezas;
    supplierMap.set(key, current);

    if (record.ventas > 0 && record.tienda) {
      const stores = supplierStores.get(key) ?? new Set<string>();
      stores.add(record.tienda);
      supplierStores.set(key, stores);
    }
    if (record.ventas > 0 && record.interno !== null) {
      const skus = supplierSkus.get(key) ?? new Set<number>();
      skus.add(record.interno);
      supplierSkus.set(key, skus);
    }
  }

  const competencia = [...supplierMap.entries()]
    .map(([key, supplier]) => {
      const stores = supplierStores.get(key) ?? new Set<string>();
      const skus = supplierSkus.get(key) ?? new Set<number>();
      return {
        ...supplier,
        marketShare: marketSales > 0 ? supplier.ventas / marketSales : 0,
        ticketPromedio: supplier.piezas > 0 ? supplier.ventas / supplier.piezas : 0,
        tiendasActivas: stores.size,
        skus: skus.size,
      };
    })
    .sort((left, right) => right.ventas - left.ventas);

  const springRank = competencia.findIndex((supplier) => SPRING_NAME_MATCHER.test(supplier.proveedor)) + 1;
  const springRecords = records.filter((record) => SPRING_NAME_MATCHER.test(record.proveedor));
  const springSales = springRecords.reduce((sum, record) => sum + record.ventas, 0);
  const springUnits = springRecords.reduce((sum, record) => sum + record.piezas, 0);

  const productMap = new Map<string, ProductRow>();
  const productStores = new Map<string, Set<string>>();
  const marketSkuMap = new Map<string, MarketSkuRow>();
  const marketSkuStores = new Map<string, Set<string>>();

  for (const record of records) {
    const key = `${record.proveedorId ?? "na"}-${record.proveedor}-${record.interno ?? "na"}-${record.descripcion}`;
    const current = marketSkuMap.get(key) ?? {
      proveedorId: record.proveedorId,
      proveedor: record.proveedor,
      interno: record.interno,
      descripcion: record.descripcion,
      ventas: 0,
      piezas: 0,
      tiendas: 0,
      ticketPromedio: 0,
      participacionMercado: 0,
    };

    current.ventas += record.ventas;
    current.piezas += record.piezas;
    marketSkuMap.set(key, current);

    if (record.ventas > 0 && record.tienda) {
      const stores = marketSkuStores.get(key) ?? new Set<string>();
      stores.add(record.tienda);
      marketSkuStores.set(key, stores);
    }
  }

  for (const record of springRecords) {
    const key = `${record.interno ?? "na"}-${record.descripcion}`;
    const current = productMap.get(key) ?? {
      interno: record.interno,
      descripcion: record.descripcion,
      ventas: 0,
      piezas: 0,
      tiendas: 0,
      ticketPromedio: 0,
      participacionSpring: 0,
    };
    current.ventas += record.ventas;
    current.piezas += record.piezas;
    productMap.set(key, current);

    if (record.ventas > 0 && record.tienda) {
      const stores = productStores.get(key) ?? new Set<string>();
      stores.add(record.tienda);
      productStores.set(key, stores);
    }
  }

  const productos = [...productMap.entries()]
    .map(([key, product]) => {
      const stores = productStores.get(key) ?? new Set<string>();
      return {
        ...product,
        tiendas: stores.size,
        ticketPromedio: product.piezas > 0 ? product.ventas / product.piezas : 0,
        participacionSpring: springSales > 0 ? product.ventas / springSales : 0,
      };
    })
    .sort((left, right) => right.ventas - left.ventas);

  const skus = [...marketSkuMap.entries()]
    .map(([key, sku]) => {
      const stores = marketSkuStores.get(key) ?? new Set<string>();
      return {
        ...sku,
        tiendas: stores.size,
        ticketPromedio: sku.piezas > 0 ? sku.ventas / sku.piezas : 0,
        participacionMercado: marketSales > 0 ? sku.ventas / marketSales : 0,
      };
    })
    .sort((left, right) => right.ventas - left.ventas);

  const storeMarketSales = new Map<string, number>();
  const storeMap = new Map<string, StoreRow>();
  const storeSkuSets = new Map<string, Set<number>>();

  for (const record of records) {
    storeMarketSales.set(record.tienda, (storeMarketSales.get(record.tienda) ?? 0) + record.ventas);
  }

  for (const record of springRecords) {
    const current = storeMap.get(record.tienda) ?? {
      tiendaId: record.tiendaId,
      tienda: record.tienda,
      ventas: 0,
      piezas: 0,
      skus: 0,
      ticketPromedio: 0,
      shareDentroTienda: 0,
      participacionSpring: 0,
    };
    current.ventas += record.ventas;
    current.piezas += record.piezas;
    storeMap.set(record.tienda, current);

    if (record.ventas > 0 && record.interno !== null) {
      const skus = storeSkuSets.get(record.tienda) ?? new Set<number>();
      skus.add(record.interno);
      storeSkuSets.set(record.tienda, skus);
    }
  }

  const tiendas = [...storeMap.values()]
    .map((store) => {
      const marketStoreSales = storeMarketSales.get(store.tienda) ?? 0;
      const skus = storeSkuSets.get(store.tienda) ?? new Set<number>();
      return {
        ...store,
        skus: skus.size,
        ticketPromedio: store.piezas > 0 ? store.ventas / store.piezas : 0,
        shareDentroTienda: marketStoreSales > 0 ? store.ventas / marketStoreSales : 0,
        participacionSpring: springSales > 0 ? store.ventas / springSales : 0,
      };
    })
    .sort((left, right) => right.ventas - left.ventas);

  const activeSpringSkuCount = new Set(
    springRecords.filter((record) => record.ventas > 0 && record.interno !== null).map((record) => record.interno as number),
  ).size;
  const activeSpringStoreCount = new Set(
    springRecords.filter((record) => record.ventas > 0).map((record) => record.tienda),
  ).size;

  const topSkuCount = Math.max(1, Math.ceil(productos.length * 0.2));
  const concentracion: ConcentrationStats = {
    top20PctSkusShare: topShare(productos, topSkuCount, (row) => row.ventas, springSales),
    top10SkusShare: topShare(productos, 10, (row) => row.ventas, springSales),
    top5TiendasShare: topShare(tiendas, 5, (row) => row.ventas, springSales),
  };

  const coordinates = loadCoordinates();
  const mapStoreRows: MapStore[] = coordinates
    .map((coordinate) => {
      const store = tiendas.find((row) => row.tienda === coordinate.tienda);
      if (!store) return null;
      return {
        tienda: coordinate.tienda,
        lat: coordinate.lat,
        lon: coordinate.lon,
        ventas: store.ventas,
        piezas: store.piezas,
        ticketPromedio: store.ticketPromedio,
      };
    })
    .filter((store): store is MapStore => store !== null)
    .sort((left, right) => right.ventas - left.ventas);

  const coverageNote = `${mapStoreRows.length} de ${tiendas.length} tiendas Spring Air tienen coordenadas cargadas para el mapa.`;
  const insights = buildInsights(productos, tiendas, concentracion, springSales / marketSales);
  const springSeries = buildDailySeries(springRecords);
  const marketSeries = buildDailySeries(records);
  const springFamilies = [...new Map(
    springRecords.reduce((entries, record) => {
      const family = getFamilyName(record.descripcion);
      const current = entries.get(family) ?? 0;
      entries.set(family, current + record.ventas);
      return entries;
    }, new Map<string, number>()),
  ).entries()].sort((left, right) => right[1] - left[1]);

  return {
    periodo: period.label,
    metadata: {
      excelFile: path.basename(excelFilePath),
      sourceSheet,
      generatedAt: new Date().toISOString(),
      dateRange: {
        startDay: period.startDay,
        endDay: period.endDay,
        month: period.month,
        monthLabel: period.monthLabel,
        year: period.year,
        totalDays: period.totalDays,
      },
    },
    resumen: {
      ventas: springSales,
      piezas: springUnits,
      ticketPromedio: springUnits > 0 ? springSales / springUnits : 0,
      marketShare: marketSales > 0 ? springSales / marketSales : 0,
      ranking: springRank,
      skusActivos: activeSpringSkuCount,
      tiendasActivas: activeSpringStoreCount,
    },
    mercado: {
      totalVenta: marketSales,
      totalPiezas: marketUnits,
      rankingProveedores: competencia,
    },
    competencia,
    productos,
    skus,
    tiendas,
    concentracion,
    insights,
    mapa: {
      coverageNote,
      tiendas: mapStoreRows,
    },
    series: {
      springAir: springSeries,
      mercado: marketSeries,
    },
    historico: {
      status: "coming_soon",
      title: "Histórico en preparación",
      description:
        "Esta vista se activará cuando el dashboard consolide múltiples periodos en una fuente persistente. Por ahora sólo mostramos datos reales del archivo actual.",
      bullets: [
        "El diseño ya contempla una capa de acceso a datos reutilizable para cambiar Excel por base de datos.",
        "Cuando existan varios periodos, esta pestaña mostrará evolución mensual de ventas, market share, productos y tiendas.",
        `Las familias más fuertes hoy son ${springFamilies
          .slice(0, 3)
          .map(([family]) => family)
          .join(", ")}.`,
      ],
    },
  };
}
