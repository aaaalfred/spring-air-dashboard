import { readFileSync } from "fs";
import path from "path";

import * as XLSX from "xlsx";

import type {
  CompetitorRow,
  ConcentrationStats,
  DailyPoint,
  DashboardData,
  DataQualityStats,
  DependencyRow,
  DistributionMetric,
  Insight,
  MapStore,
  MarketSkuRow,
  MeasurementSuite,
  MetricBase,
  PortfolioConcentrationMetric,
  PriceMixBand,
  PromoterStoreRow,
  ProductividadSkuRow,
  ProductRow,
  ProviderVelocityRow,
  SkuEfficiencyRow,
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
  familia: string;
  sizeSegment: string;
  ventas: number;
  piezas: number;
  dailySales: number[];
  dailyPieces: number[];
  isNegative: boolean;
  isNoCore: boolean;
  isPositiveSalesZeroUnits: boolean;
  isNearZeroSalesPositiveUnits: boolean;
}

interface CoordinateRow {
  tienda: string;
  tiendaId: number | null;
  determinante: string | null;
  lat: number;
  lon: number;
  localizacion: string | null;
  cadena: string | null;
  formato: string | null;
  promotoria: boolean;
}

interface PeriodInfo {
  startDay: number;
  endDay: number;
  month: number;
  monthLabel: string;
  year: number;
  totalDays: number;
  label: string;
}

interface ProductAggregate {
  row: ProductRow;
  stores: Set<string>;
}

interface PromoterStoreAlias {
  sourceName: string;
  sourceLocation?: string;
  dashboardStoreId: number;
  dashboardStoreName: string;
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
const NO_CORE_MATCHER = /(DESC|EXHIBICION|OBSEQUIO|PROMOCIONALES?|PROMOCION)/i;
const PROMOTER_STORE_ALIASES: PromoterStoreAlias[] = [
  { sourceName: "OUTLET", sourceLocation: "PACHUCA", dashboardStoreId: 213, dashboardStoreName: "PACHUCA OUTLET" },
  { sourceName: "SAN LUIS PLAZA", sourceLocation: "SAN LUIS POTOSI", dashboardStoreId: 241, dashboardStoreName: "SAN LUIS PLAZA" },
  { sourceName: "SAN LUIS CENTRO", sourceLocation: "SAN LUIS POTOSI", dashboardStoreId: 301, dashboardStoreName: "SAN LUIS POTOSI CENTRO" },
  { sourceName: "AGUASCALIENTES ALTARIA", sourceLocation: "AGUASCALIETES", dashboardStoreId: 231, dashboardStoreName: "AGUASCALIENTES ALTARIA" },
  { sourceName: "CIBELES", sourceLocation: "GUANAJUATO", dashboardStoreId: 253, dashboardStoreName: "IRAPUATO CIBELES" },
  { sourceName: "GALERIAS", sourceLocation: "GUANAJUATO", dashboardStoreId: 245, dashboardStoreName: "CELAYA GALERIAS" },
  { sourceName: "OAXACA PLAZA", sourceLocation: "OAXACA", dashboardStoreId: 214, dashboardStoreName: "OAXACA PLAZA" },
  { sourceName: "CENTRO", sourceLocation: "PUEBLA", dashboardStoreId: 203, dashboardStoreName: "PUEBLA CENTRO" },
];

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

function safeDivide(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
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

function parseSheetPeriod(sheetName: string, headerRows: CellValue[][]): PeriodInfo {
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
    "KYOTO",
    "ROMA",
    "LONDON",
  ]) {
    if (text.includes(family)) return family;
  }

  return "OTROS";
}

function getSizeSegment(description: string) {
  const text = description.toUpperCase();
  if (text.includes("KING")) return "KING SIZE";
  if (text.includes("QUEEN")) return "QUEEN SIZE";
  if (text.includes("MATRIMON")) return "MATRIMONIAL";
  if (text.includes("INDIVIDUAL")) return "INDIVIDUAL";
  if (text.includes("CUNA")) return "CUNA";
  return "OTROS";
}

function topShare<T>(rows: T[], take: number, getValue: (row: T) => number, denominator: number) {
  if (!denominator || rows.length === 0) return 0;
  const total = rows.slice(0, take).reduce((aggregate, row) => aggregate + getValue(row), 0);
  return total / denominator;
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function percentile(values: number[], target: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const position = Math.min(sorted.length - 1, Math.max(0, Math.ceil(target * sorted.length) - 1));
  return sorted[position];
}

function standardDeviation(values: number[]) {
  if (values.length === 0) return 0;
  const mean = sum(values) / values.length;
  const variance = sum(values.map((value) => (value - mean) ** 2)) / values.length;
  return Math.sqrt(variance);
}

function normalizeStoreKey(value: string) {
  return value.trim().toUpperCase();
}

function findPromoterStoreAlias(store: Pick<CoordinateRow, "tienda" | "localizacion">) {
  const storeName = normalizeStoreKey(store.tienda);
  const storeLocation = normalizeStoreKey(store.localizacion ?? "");

  return PROMOTER_STORE_ALIASES.find(
    (alias) =>
      normalizeStoreKey(alias.sourceName) === storeName &&
      (!alias.sourceLocation || normalizeStoreKey(alias.sourceLocation) === storeLocation),
  );
}

function loadPromoterStores() {
  const filePath = path.join(process.cwd(), "data", "promoter-stores.json");
  const raw = readFileSync(filePath, "utf8");
  const rows = JSON.parse(raw) as CoordinateRow[];

  return rows.map((row) => ({
    ...row,
    tiendaId: row.tiendaId && row.tiendaId > 0 ? row.tiendaId : null,
  }));
}

function loadCoordinates() {
  const filePath = path.join(process.cwd(), "data", "store-coordinates.json");
  const raw = readFileSync(filePath, "utf8");
  const legacy = JSON.parse(raw) as Array<{ tienda: string; lat: number; lon: number }>;
  const promoterStores = loadPromoterStores();
  const merged = [...promoterStores];
  const existingKeys = new Set(
    promoterStores.flatMap((row) => [
      row.tiendaId !== null ? `id:${row.tiendaId}` : null,
      `name:${normalizeStoreKey(row.tienda)}`,
    ]).filter(Boolean) as string[],
  );

  for (const row of legacy) {
    const key = `name:${normalizeStoreKey(row.tienda)}`;
    if (existingKeys.has(key)) continue;
    merged.push({
      tienda: row.tienda,
      tiendaId: null,
      determinante: null,
      lat: row.lat,
      lon: row.lon,
      localizacion: null,
      cadena: null,
      formato: null,
      promotoria: false,
    });
  }

  return merged;
}

function buildCoordinateLookup(rows: CoordinateRow[]) {
  const lookup = new Map<string, CoordinateRow>();
  for (const row of rows) {
    if (row.tiendaId !== null) {
      lookup.set(`id:${row.tiendaId}`, row);
    }
    lookup.set(`name:${normalizeStoreKey(row.tienda)}`, row);

    const alias = findPromoterStoreAlias(row);
    if (alias) {
      lookup.set(`id:${alias.dashboardStoreId}`, row);
      lookup.set(`name:${normalizeStoreKey(alias.dashboardStoreName)}`, row);
    }
  }
  return lookup;
}

function findCoordinate(
  coordinateLookup: Map<string, CoordinateRow>,
  tienda: string,
  tiendaId: number | null,
) {
  if (tiendaId !== null) {
    const byId = coordinateLookup.get(`id:${tiendaId}`);
    if (byId) return byId;
  }

  return coordinateLookup.get(`name:${normalizeStoreKey(tienda)}`);
}

function resolveDashboardStoreMatch(
  store: CoordinateRow,
  dashboardStoresById: Map<number, string>,
  dashboardStoresByName: Map<string, string>,
) {
  const alias = findPromoterStoreAlias(store);

  return (
    (store.tiendaId !== null ? dashboardStoresById.get(store.tiendaId) : null) ??
    dashboardStoresByName.get(normalizeStoreKey(store.tienda)) ??
    (alias ? dashboardStoresById.get(alias.dashboardStoreId) : null) ??
    (alias ? dashboardStoresByName.get(normalizeStoreKey(alias.dashboardStoreName)) : null) ??
    null
  );
}

function isCommercialCleanRecord(record: BaseRecord) {
  return !(
    record.isNegative ||
    record.isNoCore ||
    record.isPositiveSalesZeroUnits ||
    record.isNearZeroSalesPositiveUnits
  );
}

function buildDailySeries(records: BaseRecord[]): DailyPoint[] {
  return SALES_DAY_ORDER.map((day, index) => {
    const ventas = records.reduce((aggregate, record) => aggregate + record.dailySales[index], 0);
    const piezas = records.reduce((aggregate, record) => aggregate + record.dailyPieces[index], 0);
    return {
      dia: day,
      ventas,
      piezas,
      ticketPromedio: safeDivide(ventas, piezas),
    };
  });
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
      title: "Alta concentracion en pocos SKUs",
      body: `El top 20% del portafolio concentra ${(concentration.top20PctSkusShare * 100).toFixed(
        1,
      )}% de la venta Spring Air. Conviene revisar profundidad y cobertura del resto del surtido.`,
    });
  }

  if (marketShare < 0.15) {
    insights.push({
      tone: "info",
      title: "Hay espacio para crecer participacion",
      body: `Spring Air hoy representa ${(marketShare * 100).toFixed(
        1,
      )}% del mercado analizado. El potencial inmediato esta en tiendas donde la categoria ya mueve volumen, pero la marca aun participa poco.`,
    });
  }

  if (topStore) {
    insights.push({
      tone: "info",
      title: `Tienda ancla: ${topStore.tienda}`,
      body: `Es la plaza mas relevante para Spring Air con ${money.format(
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
      ).toFixed(1)}%. Hay oportunidad clara de corregir cobertura o ejecucion comercial.`,
    });
  }

  return insights.slice(0, 5);
}

function aggregateProducts(springRecords: BaseRecord[], springSales: number) {
  const productMap = new Map<string, ProductAggregate>();

  for (const record of springRecords) {
    const key = `${record.interno ?? "na"}-${record.descripcion}`;
    const aggregate = productMap.get(key) ?? {
      row: {
        interno: record.interno,
        descripcion: record.descripcion,
        ventas: 0,
        piezas: 0,
        tiendas: 0,
        ticketPromedio: 0,
        participacionSpring: 0,
      },
      stores: new Set<string>(),
    };

    aggregate.row.ventas += record.ventas;
    aggregate.row.piezas += record.piezas;
    if (record.ventas > 0 && record.tienda) {
      aggregate.stores.add(record.tienda);
    }
    productMap.set(key, aggregate);
  }

  return [...productMap.values()]
    .map(({ row, stores }) => ({
      ...row,
      tiendas: stores.size,
      ticketPromedio: safeDivide(row.ventas, row.piezas),
      participacionSpring: safeDivide(row.ventas, springSales),
    }))
    .sort((left, right) => right.ventas - left.ventas);
}

function aggregateMarketSkus(records: BaseRecord[], marketSales: number) {
  const skuMap = new Map<string, { row: MarketSkuRow; stores: Set<string> }>();

  for (const record of records) {
    const key = `${record.proveedorId ?? "na"}-${record.proveedor}-${record.interno ?? "na"}-${record.descripcion}`;
    const aggregate = skuMap.get(key) ?? {
      row: {
        proveedorId: record.proveedorId,
        proveedor: record.proveedor,
        interno: record.interno,
        descripcion: record.descripcion,
        ventas: 0,
        piezas: 0,
        tiendas: 0,
        ticketPromedio: 0,
        participacionMercado: 0,
      },
      stores: new Set<string>(),
    };

    aggregate.row.ventas += record.ventas;
    aggregate.row.piezas += record.piezas;
    if (record.ventas > 0 && record.tienda) {
      aggregate.stores.add(record.tienda);
    }
    skuMap.set(key, aggregate);
  }

  return [...skuMap.values()]
    .map(({ row, stores }) => ({
      ...row,
      tiendas: stores.size,
      ticketPromedio: safeDivide(row.ventas, row.piezas),
      participacionMercado: safeDivide(row.ventas, marketSales),
    }))
    .sort((left, right) => right.ventas - left.ventas);
}

function aggregateCompetitors(records: BaseRecord[], marketSales: number) {
  const supplierMap = new Map<string, CompetitorRow>();
  const supplierStores = new Map<string, Set<string>>();
  const supplierSkus = new Map<string, Set<number>>();

  for (const record of records) {
    const key = `${record.proveedorId ?? "na"}-${record.proveedor}`;
    const aggregate = supplierMap.get(key) ?? {
      proveedorId: record.proveedorId,
      proveedor: record.proveedor,
      ventas: 0,
      piezas: 0,
      marketShare: 0,
      ticketPromedio: 0,
      tiendasActivas: 0,
      skus: 0,
    };

    aggregate.ventas += record.ventas;
    aggregate.piezas += record.piezas;
    supplierMap.set(key, aggregate);

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

  return [...supplierMap.entries()]
    .map(([key, aggregate]) => ({
      ...aggregate,
      marketShare: safeDivide(aggregate.ventas, marketSales),
      ticketPromedio: safeDivide(aggregate.ventas, aggregate.piezas),
      tiendasActivas: (supplierStores.get(key) ?? new Set<string>()).size,
      skus: (supplierSkus.get(key) ?? new Set<number>()).size,
    }))
    .sort((left, right) => right.ventas - left.ventas);
}

function aggregateStores(records: BaseRecord[], springRecords: BaseRecord[], springSales: number) {
  const storeMarketSales = new Map<string, number>();
  const storeMap = new Map<string, StoreRow>();
  const storeSkuSets = new Map<string, Set<number>>();

  for (const record of records) {
    storeMarketSales.set(record.tienda, (storeMarketSales.get(record.tienda) ?? 0) + record.ventas);
  }

  for (const record of springRecords) {
    const aggregate = storeMap.get(record.tienda) ?? {
      tiendaId: record.tiendaId,
      tienda: record.tienda,
      ventas: 0,
      piezas: 0,
      skus: 0,
      ticketPromedio: 0,
      shareDentroTienda: 0,
      participacionSpring: 0,
    };
    aggregate.ventas += record.ventas;
    aggregate.piezas += record.piezas;
    storeMap.set(record.tienda, aggregate);

    if (record.ventas > 0 && record.interno !== null) {
      const skus = storeSkuSets.get(record.tienda) ?? new Set<number>();
      skus.add(record.interno);
      storeSkuSets.set(record.tienda, skus);
    }
  }

  return [...storeMap.values()]
    .map((store) => {
      const marketStoreSales = storeMarketSales.get(store.tienda) ?? 0;
      return {
        ...store,
        skus: (storeSkuSets.get(store.tienda) ?? new Set<number>()).size,
        ticketPromedio: safeDivide(store.ventas, store.piezas),
        shareDentroTienda: safeDivide(store.ventas, marketStoreSales),
        participacionSpring: safeDivide(store.ventas, springSales),
      };
    })
    .sort((left, right) => right.ventas - left.ventas);
}

function buildMapRows(
  stores: StoreRow[],
  coordinateLookup: Map<string, CoordinateRow>,
  highlighter?: Map<string, Partial<MapStore>>,
) {
  const mapped = stores
    .map((store) => {
      const coordinate = findCoordinate(coordinateLookup, store.tienda, store.tiendaId);
      if (!coordinate) return null;
      const highlight = highlighter?.get(store.tienda);
      return {
        tienda: store.tienda,
        tiendaId: store.tiendaId,
        determinante: coordinate.determinante,
        lat: coordinate.lat,
        lon: coordinate.lon,
        ventas: store.ventas,
        piezas: store.piezas,
        ticketPromedio: store.ticketPromedio,
        promotoria: coordinate.promotoria,
        localizacion: coordinate.localizacion,
        cadena: coordinate.cadena,
        formato: coordinate.formato,
        tiendaFuente: coordinate.tienda,
        segment: highlight?.segment ?? "standard",
        opportunity: highlight?.opportunity,
        shareDentroTienda: highlight?.shareDentroTienda ?? store.shareDentroTienda,
      };
    })
    .filter(Boolean) as MapStore[];

  return mapped.sort((left, right) => right.ventas - left.ventas);
}

function inferProductividadRows(springRecords: BaseRecord[], springSales: number): ProductividadSkuRow[] {
  const skuMap = new Map<string, ProductividadSkuRow & { activeDays: Set<number>; storesSet: Set<string> }>();

  for (const record of springRecords) {
    const key = `${record.interno ?? "na"}-${record.descripcion}`;
    const aggregate = skuMap.get(key) ?? {
      interno: record.interno,
      descripcion: record.descripcion,
      familia: record.familia,
      ventas: 0,
      piezas: 0,
      tiendas: 0,
      diasConVenta: 0,
      ticketPromedio: 0,
      ventasPorTienda: 0,
      piezasPorTienda: 0,
      shareSpring: 0,
      activeDays: new Set<number>(),
      storesSet: new Set<string>(),
    };

    aggregate.ventas += record.ventas;
    aggregate.piezas += record.piezas;
    if (record.ventas > 0 && record.tienda) {
      aggregate.storesSet.add(record.tienda);
    }
    record.dailySales.forEach((value, index) => {
      if (value > 0) {
        aggregate.activeDays.add(index + 1);
      }
    });

    skuMap.set(key, aggregate);
  }

  return [...skuMap.values()]
    .map((aggregate) => ({
      interno: aggregate.interno,
      descripcion: aggregate.descripcion,
      familia: aggregate.familia,
      ventas: aggregate.ventas,
      piezas: aggregate.piezas,
      tiendas: aggregate.storesSet.size,
      diasConVenta: aggregate.activeDays.size,
      ticketPromedio: safeDivide(aggregate.ventas, aggregate.piezas),
      ventasPorTienda: safeDivide(aggregate.ventas, aggregate.storesSet.size),
      piezasPorTienda: safeDivide(aggregate.piezas, aggregate.storesSet.size),
      shareSpring: safeDivide(aggregate.ventas, springSales),
    }))
    .sort((left, right) => right.ventas - left.ventas);
}

function buildDistributionMetric(records: BaseRecord[]): DistributionMetric {
  const springStores = new Set(
    records.filter((record) => SPRING_NAME_MATCHER.test(record.proveedor) && record.ventas > 0).map((record) => record.tienda),
  );
  const marketStoreSales = new Map<string, number>();

  for (const record of records) {
    if (record.ventas > 0) {
      marketStoreSales.set(record.tienda, (marketStoreSales.get(record.tienda) ?? 0) + record.ventas);
    }
  }

  const coveredMarketSales = [...marketStoreSales.entries()]
    .filter(([store]) => springStores.has(store))
    .reduce((aggregate, [, ventas]) => aggregate + ventas, 0);
  const totalMarketSales = [...marketStoreSales.values()].reduce((aggregate, value) => aggregate + value, 0);

  return {
    distribucionNumerica: safeDivide(springStores.size, marketStoreSales.size),
    distribucionPonderada: safeDivide(coveredMarketSales, totalMarketSales),
    springStores: springStores.size,
    marketStores: marketStoreSales.size,
    coveredMarketSales,
    totalMarketSales,
  };
}

function buildProviderVelocity(records: BaseRecord[]): ProviderVelocityRow[] {
  const rows = aggregateCompetitors(records, records.reduce((aggregate, record) => aggregate + record.ventas, 0));

  return rows.map((row) => ({
    proveedor: row.proveedor,
    ventas: row.ventas,
    piezas: row.piezas,
    tiendasActivas: row.tiendasActivas,
    skusActivos: row.skus,
    ventasPorTienda: safeDivide(row.ventas, row.tiendasActivas),
    piezasPorTienda: safeDivide(row.piezas, row.tiendasActivas),
    ventasPorSku: safeDivide(row.ventas, row.skus),
    piezasPorSku: safeDivide(row.piezas, row.skus),
  }));
}

function buildStoreOpportunityRows(records: BaseRecord[], coordinateLookup: Map<string, CoordinateRow>) {
  const marketStoreSales = new Map<string, { tiendaId: number | null; ventasMercado: number; ventasSpring: number }>();

  for (const record of records) {
    const aggregate = marketStoreSales.get(record.tienda) ?? {
      tiendaId: record.tiendaId,
      ventasMercado: 0,
      ventasSpring: 0,
    };

    aggregate.ventasMercado += record.ventas;
    if (SPRING_NAME_MATCHER.test(record.proveedor)) {
      aggregate.ventasSpring += record.ventas;
    }
    marketStoreSales.set(record.tienda, aggregate);
  }

  const shares = [...marketStoreSales.entries()]
    .map(([tienda, aggregate]) => ({
      tienda,
      ventasMercado: aggregate.ventasMercado,
      ventasSpring: aggregate.ventasSpring,
      shareActual: safeDivide(aggregate.ventasSpring, aggregate.ventasMercado),
    }))
    .filter((row) => row.ventasSpring > 0 && row.ventasMercado > 0)
    .sort((left, right) => right.shareActual - left.shareActual);

  const topShares = shares.slice(0, 10);
  const shareObjetivo = topShares.length > 0 ? sum(topShares.map((row) => row.shareActual)) / topShares.length : 0;
  const marketMedian = median([...marketStoreSales.values()].map((row) => row.ventasMercado));
  const benchmarkStores = topShares.map((row) => row.tienda);
  const benchmarkRows = topShares.map((row) => {
    const tiendaId = marketStoreSales.get(row.tienda)?.tiendaId ?? null;
    const coordinate = findCoordinate(coordinateLookup, row.tienda, tiendaId);
    return {
      tienda: row.tienda,
      tiendaId,
      determinante: coordinate?.determinante,
      ventasMercado: row.ventasMercado,
      ventasSpring: row.ventasSpring,
      shareActual: row.shareActual,
      shareObjetivo,
      gapShare: Math.max(0, shareObjetivo - row.shareActual),
      oportunidadVenta: Math.max(0, row.ventasMercado * shareObjetivo - row.ventasSpring),
      promotoria: coordinate?.promotoria,
      localizacion: coordinate?.localizacion,
      cadena: coordinate?.cadena,
      formato: coordinate?.formato,
      tiendaFuente: coordinate?.tienda,
      lat: coordinate?.lat,
      lon: coordinate?.lon,
    };
  });

  const rows = [...marketStoreSales.entries()]
    .map(([tienda, aggregate]) => {
      const coordinate = findCoordinate(coordinateLookup, tienda, aggregate.tiendaId);
      const shareActual = safeDivide(aggregate.ventasSpring, aggregate.ventasMercado);
      const gapShare = Math.max(0, shareObjetivo - shareActual);
      return {
        tienda,
        tiendaId: aggregate.tiendaId,
        determinante: coordinate?.determinante,
        ventasMercado: aggregate.ventasMercado,
        ventasSpring: aggregate.ventasSpring,
        shareActual,
        shareObjetivo,
        gapShare,
        oportunidadVenta: Math.max(0, aggregate.ventasMercado * shareObjetivo - aggregate.ventasSpring),
        promotoria: coordinate?.promotoria,
        localizacion: coordinate?.localizacion,
        cadena: coordinate?.cadena,
        formato: coordinate?.formato,
        tiendaFuente: coordinate?.tienda,
        lat: coordinate?.lat,
        lon: coordinate?.lon,
      };
    })
    .filter((row) => row.ventasMercado > 0)
    .sort((left, right) => right.oportunidadVenta - left.oportunidadVenta);

  return {
    shareObjetivo,
    marketMedian,
    benchmarkStores,
    benchmarkRows,
    rows,
  };
}

function buildPortfolioConcentration(products: ProductRow[], stores: StoreRow[], springSales: number): PortfolioConcentrationMetric {
  const top5SkusShare = topShare(products, 5, (row) => row.ventas, springSales);
  const top10SkusShare = topShare(products, 10, (row) => row.ventas, springSales);
  const top10StoresShare = topShare(stores, 10, (row) => row.ventas, springSales);

  return {
    top5SkusShare,
    top10SkusShare,
    longTailSkusShare: Math.max(0, 1 - top10SkusShare),
    top5StoresShare: topShare(stores, 5, (row) => row.ventas, springSales),
    top10StoresShare,
    longTailStoresShare: Math.max(0, 1 - top10StoresShare),
  };
}

function buildSkuEfficiency(productividad: ProductividadSkuRow[]) {
  const distributionMedian = median(productividad.map((row) => row.tiendas));
  const distributionP75 = percentile(productividad.map((row) => row.tiendas), 0.75);
  const velocityMedian = median(productividad.map((row) => row.ventasPorTienda));
  const velocityP75 = percentile(productividad.map((row) => row.ventasPorTienda), 0.75);

  const altaDistribucionBajaVelocidad: SkuEfficiencyRow[] = productividad
    .filter((row) => row.tiendas >= distributionP75 && row.ventasPorTienda < velocityMedian)
    .map((row) => ({ ...row, segmento: "alta_distribucion_baja_velocidad" as const }))
    .sort((left, right) => right.tiendas - left.tiendas || left.ventasPorTienda - right.ventasPorTienda)
    .slice(0, 10);

  const bajaDistribucionAltaVelocidad: SkuEfficiencyRow[] = productividad
    .filter((row) => row.tiendas < distributionMedian && row.ventasPorTienda >= velocityP75)
    .map((row) => ({ ...row, segmento: "baja_distribucion_alta_velocidad" as const }))
    .sort((left, right) => right.ventasPorTienda - left.ventasPorTienda)
    .slice(0, 10);

  return {
    altaDistribucionBajaVelocidad,
    bajaDistribucionAltaVelocidad,
  };
}

function buildPriceIndex(records: BaseRecord[], productividad: ProductividadSkuRow[]) {
  const validRecords = records.filter((record) => record.ventas > 0 && record.piezas > 0);
  const storeProviderMap = new Map<string, { proveedor: string; ventas: number; piezas: number }[]>();
  const familyProviderMap = new Map<string, { proveedor: string; ventas: number; piezas: number }[]>();
  const sizeProviderMap = new Map<string, { proveedor: string; ventas: number; piezas: number }[]>();

  for (const record of validRecords) {
    const storeRows = storeProviderMap.get(record.tienda) ?? [];
    const existingStore = storeRows.find((row) => row.proveedor === record.proveedor);
    if (existingStore) {
      existingStore.ventas += record.ventas;
      existingStore.piezas += record.piezas;
    } else {
      storeRows.push({ proveedor: record.proveedor, ventas: record.ventas, piezas: record.piezas });
    }
    storeProviderMap.set(record.tienda, storeRows);

    const familyRows = familyProviderMap.get(record.familia) ?? [];
    const existingFamily = familyRows.find((row) => row.proveedor === record.proveedor);
    if (existingFamily) {
      existingFamily.ventas += record.ventas;
      existingFamily.piezas += record.piezas;
    } else {
      familyRows.push({ proveedor: record.proveedor, ventas: record.ventas, piezas: record.piezas });
    }
    familyProviderMap.set(record.familia, familyRows);

    const sizeRows = sizeProviderMap.get(record.sizeSegment) ?? [];
    const existingSize = sizeRows.find((row) => row.proveedor === record.proveedor);
    if (existingSize) {
      existingSize.ventas += record.ventas;
      existingSize.piezas += record.piezas;
    } else {
      sizeRows.push({ proveedor: record.proveedor, ventas: record.ventas, piezas: record.piezas });
    }
    sizeProviderMap.set(record.sizeSegment, sizeRows);
  }

  const tiendas = [...storeProviderMap.entries()]
    .map(([tienda, providers]) => {
      const spring = providers.find((row) => SPRING_NAME_MATCHER.test(row.proveedor));
      if (!spring) return null;
      const leader = [...providers].sort((left, right) => right.ventas - left.ventas)[0];
      const springTicket = safeDivide(spring.ventas, spring.piezas);
      const marketTicket = safeDivide(sum(providers.map((row) => row.ventas)), sum(providers.map((row) => row.piezas)));
      const leaderTicket = safeDivide(leader.ventas, leader.piezas);
      return {
        scope: "tienda" as const,
        nombre: tienda,
        springTicket,
        marketTicket,
        leaderTicket,
        indexVsMarket: safeDivide(springTicket, marketTicket),
        indexVsLeader: safeDivide(springTicket, leaderTicket),
      };
    })
    .filter(isDefined)
    .sort((left, right) => Math.abs(right.indexVsMarket - 1) - Math.abs(left.indexVsMarket - 1))
    .slice(0, 10);

  const familias = [...familyProviderMap.entries()]
    .map(([familia, providers]) => {
      const spring = providers.find((row) => SPRING_NAME_MATCHER.test(row.proveedor));
      if (!spring) return null;
      const leader = [...providers].sort((left, right) => right.ventas - left.ventas)[0];
      const springTicket = safeDivide(spring.ventas, spring.piezas);
      const marketTicket = safeDivide(sum(providers.map((row) => row.ventas)), sum(providers.map((row) => row.piezas)));
      const leaderTicket = safeDivide(leader.ventas, leader.piezas);
      return {
        scope: "familia" as const,
        nombre: familia,
        springTicket,
        marketTicket,
        leaderTicket,
        indexVsMarket: safeDivide(springTicket, marketTicket),
        indexVsLeader: safeDivide(springTicket, leaderTicket),
      };
    })
    .filter(isDefined)
    .sort((left, right) => right.springTicket - left.springTicket)
    .slice(0, 10);

  const sizeBenchmarks = new Map(
    [...sizeProviderMap.entries()].map(([size, providers]) => {
      const leader = [...providers].sort((left, right) => right.ventas - left.ventas)[0];
      return [
        size,
        {
          marketTicket: safeDivide(sum(providers.map((row) => row.ventas)), sum(providers.map((row) => row.piezas))),
          leaderTicket: safeDivide(leader.ventas, leader.piezas),
        },
      ] as const;
    }),
  );

  const skus = productividad
    .map((row) => {
      const benchmark = sizeBenchmarks.get(getSizeSegment(row.descripcion));
      if (!benchmark) return null;
      return {
        scope: "sku" as const,
        nombre: row.descripcion,
        springTicket: row.ticketPromedio,
        marketTicket: benchmark.marketTicket,
        leaderTicket: benchmark.leaderTicket,
        indexVsMarket: safeDivide(row.ticketPromedio, benchmark.marketTicket),
        indexVsLeader: safeDivide(row.ticketPromedio, benchmark.leaderTicket),
      };
    })
    .filter(isDefined)
    .sort((left, right) => Math.abs(right.indexVsLeader - 1) - Math.abs(left.indexVsLeader - 1))
    .slice(0, 10);

  return {
    tiendas,
    skus,
    familias,
  };
}

function buildPriceMix(records: BaseRecord[]): PriceMixBand[] {
  const validMarketRecords = records.filter((record) => record.ventas > 0 && record.piezas > 0);
  const validSpringRecords = validMarketRecords.filter((record) => SPRING_NAME_MATCHER.test(record.proveedor));
  const tickets = validMarketRecords.map((record) => safeDivide(record.ventas, record.piezas));
  const p25 = percentile(tickets, 0.25);
  const p50 = percentile(tickets, 0.5);
  const p75 = percentile(tickets, 0.75);
  const totalVentas = sum(validSpringRecords.map((record) => record.ventas));
  const totalPiezas = sum(validSpringRecords.map((record) => record.piezas));

  const bands = [
    { label: `<= ${money.format(p25)}`, min: 0, max: p25 },
    { label: `${money.format(p25)} - ${money.format(p50)}`, min: p25, max: p50 },
    { label: `${money.format(p50)} - ${money.format(p75)}`, min: p50, max: p75 },
    { label: `> ${money.format(p75)}`, min: p75, max: null },
  ];

  return bands.map((band, index) => {
    const rows = validSpringRecords.filter((record) => {
      const ticket = safeDivide(record.ventas, record.piezas);
      if (index === 0) return ticket <= (band.max ?? Number.POSITIVE_INFINITY);
      if (band.max === null) return ticket > band.min;
      return ticket > band.min && ticket <= band.max;
    });
    const ventas = sum(rows.map((record) => record.ventas));
    const piezas = sum(rows.map((record) => record.piezas));

    return {
      label: band.label,
      min: band.min,
      max: band.max,
      ventas,
      piezas,
      shareVentas: safeDivide(ventas, totalVentas),
      sharePiezas: safeDivide(piezas, totalPiezas),
    };
  });
}

function buildDailyConsistency(springRecords: BaseRecord[]) {
  const series = buildDailySeries(springRecords);
  const ordered = [...series].sort((left, right) => right.ventas - left.ventas);
  const totalVentas = sum(series.map((row) => row.ventas));
  const meanVentas = series.length > 0 ? totalVentas / series.length : 0;
  const deviation = standardDeviation(series.map((row) => row.ventas));

  return {
    top3Share: safeDivide(sum(ordered.slice(0, 3).map((row) => row.ventas)), totalVentas),
    coefficientOfVariation: safeDivide(deviation, meanVentas),
    bestDay: ordered[0] ?? null,
    worstDay: [...series].sort((left, right) => left.ventas - right.ventas)[0] ?? null,
  };
}

function buildDependencyMetrics(springRecords: BaseRecord[], productividad: ProductividadSkuRow[]) {
  const springSales = sum(springRecords.map((record) => record.ventas));
  const familySales = new Map<string, number>();
  const storeBreakdown = new Map<
    string,
    {
      ventas: number;
      skuSales: Map<string, number>;
      familySales: Map<string, number>;
    }
  >();

  for (const record of springRecords) {
    familySales.set(record.familia, (familySales.get(record.familia) ?? 0) + record.ventas);
    const breakdown = storeBreakdown.get(record.tienda) ?? {
      ventas: 0,
      skuSales: new Map<string, number>(),
      familySales: new Map<string, number>(),
    };
    breakdown.ventas += record.ventas;
    const skuKey = `${record.interno ?? "na"}-${record.descripcion}`;
    breakdown.skuSales.set(skuKey, (breakdown.skuSales.get(skuKey) ?? 0) + record.ventas);
    breakdown.familySales.set(record.familia, (breakdown.familySales.get(record.familia) ?? 0) + record.ventas);
    storeBreakdown.set(record.tienda, breakdown);
  }

  const topSkuShare = productividad[0] ? safeDivide(productividad[0].ventas, springSales) : 0;
  const familyRanking = [...familySales.entries()].sort((left, right) => right[1] - left[1]);
  const topFamilyShare = familyRanking[0] ? safeDivide(familyRanking[0][1], springSales) : 0;

  const stores: DependencyRow[] = [...storeBreakdown.entries()]
    .map(([tienda, breakdown]) => {
      const topSku = [...breakdown.skuSales.entries()].sort((left, right) => right[1] - left[1])[0];
      const topFamily = [...breakdown.familySales.entries()].sort((left, right) => right[1] - left[1])[0];
      return {
        tienda,
        ventas: breakdown.ventas,
        topSku: topSku?.[0]?.split("-").slice(1).join("-") ?? "N/D",
        topSkuShare: safeDivide(topSku?.[1] ?? 0, breakdown.ventas),
        topFamily: topFamily?.[0] ?? "N/D",
        topFamilyShare: safeDivide(topFamily?.[1] ?? 0, breakdown.ventas),
      };
    })
    .filter((row) => row.topSkuShare >= 0.4 || row.topFamilyShare >= 0.4)
    .sort(
      (left, right) =>
        Math.max(right.topSkuShare, right.topFamilyShare) - Math.max(left.topSkuShare, left.topFamilyShare),
    )
    .slice(0, 10);

  return {
    topSkuShare,
    topFamilyShare,
    stores,
  };
}

function buildMeasurementSuite(
  records: BaseRecord[],
  base: MetricBase,
  updatedAt: string,
  coordinateLookup: Map<string, CoordinateRow>,
): MeasurementSuite {
  const springRecords = records.filter((record) => SPRING_NAME_MATCHER.test(record.proveedor));
  const springSales = sum(springRecords.map((record) => record.ventas));
  const productos = aggregateProducts(springRecords, springSales);
  const tiendas = aggregateStores(records, springRecords, springSales);
  const productividad = inferProductividadRows(springRecords, springSales);
  const opportunity = buildStoreOpportunityRows(records, coordinateLookup);
  const whiteSpaces = opportunity.rows
    .filter((row) => row.ventasMercado >= opportunity.marketMedian && row.shareActual < 0.03)
    .slice(0, 10);

  const mapHighlights = new Map<string, Partial<MapStore>>();
  for (const row of opportunity.rows.slice(0, 12)) {
    mapHighlights.set(row.tienda, {
      segment: "opportunity",
      opportunity: row.oportunidadVenta,
      shareDentroTienda: row.shareActual,
    });
  }
  for (const row of whiteSpaces) {
    mapHighlights.set(row.tienda, {
      segment: "white_space",
      opportunity: row.oportunidadVenta,
      shareDentroTienda: row.shareActual,
    });
  }

  return {
    distribucion: {
      base,
      updatedAt,
      payload: buildDistributionMetric(records),
    },
    velocidadProveedores: {
      base,
      updatedAt,
      payload: buildProviderVelocity(records).slice(0, 10),
    },
    oportunidadTiendas: {
      base,
      updatedAt,
      payload: {
        shareObjetivo: opportunity.shareObjetivo,
        marketMedian: opportunity.marketMedian,
        benchmarkStores: opportunity.benchmarkStores,
        benchmarkRows: opportunity.benchmarkRows,
        rows: opportunity.rows.slice(0, 10),
      },
    },
    tiendasBlancas: {
      base,
      updatedAt,
      payload: {
        shareThreshold: 0.03,
        rows: whiteSpaces,
      },
    },
    concentracionPortafolio: {
      base,
      updatedAt,
      payload: buildPortfolioConcentration(productos, tiendas, springSales),
    },
    productividadSku: {
      base,
      updatedAt,
      payload: productividad.slice(0, 10),
    },
    eficienciaSurtido: {
      base,
      updatedAt,
      payload: buildSkuEfficiency(productividad),
    },
    indicePrecio: {
      base,
      updatedAt,
      payload: buildPriceIndex(records, productividad),
    },
    mixPrecio: {
      base,
      updatedAt,
      payload: buildPriceMix(records),
    },
    consistenciaDiaria: {
      base,
      updatedAt,
      payload: buildDailyConsistency(springRecords),
    },
    riesgoDependencia: {
      base,
      updatedAt,
      payload: buildDependencyMetrics(springRecords, productividad),
    },
    mapaOportunidad: {
      base,
      updatedAt,
      payload: buildMapRows(tiendas, coordinateLookup, mapHighlights),
    },
  };
}

function buildDataQualityStats(
  rawRecords: BaseRecord[],
  coordinateLookup: Map<string, CoordinateRow>,
  updatedAt: string,
): DataQualityStats {
  const negativeRows = rawRecords.filter((record) => record.isNegative);
  const noCoreRows = rawRecords.filter((record) => record.isNoCore);
  const anomalyRows = rawRecords.filter(
    (record) => record.isPositiveSalesZeroUnits || record.isNearZeroSalesPositiveUnits,
  );
  const springActiveStores = new Map<string, { tienda: string; tiendaId: number | null }>();
  for (const record of rawRecords) {
    if (!SPRING_NAME_MATCHER.test(record.proveedor) || record.ventas <= 0) continue;
    springActiveStores.set(record.tienda, { tienda: record.tienda, tiendaId: record.tiendaId });
  }
  const storesWithCoordinates = [...springActiveStores.values()].filter((store) =>
    Boolean(findCoordinate(coordinateLookup, store.tienda, store.tiendaId)),
  ).length;
  const totalVentas = sum(rawRecords.map((record) => Math.abs(record.ventas)));
  const totalPiezas = sum(rawRecords.map((record) => Math.abs(record.piezas)));

  return {
    updatedAt,
    tasaDevoluciones: {
      rows: negativeRows.length,
      shareRows: safeDivide(negativeRows.length, rawRecords.length),
      ventas: sum(negativeRows.map((record) => Math.abs(record.ventas))),
      shareVentas: safeDivide(sum(negativeRows.map((record) => Math.abs(record.ventas))), totalVentas),
      piezas: sum(negativeRows.map((record) => Math.abs(record.piezas))),
      sharePiezas: safeDivide(sum(negativeRows.map((record) => Math.abs(record.piezas))), totalPiezas),
    },
    tasaLineasNoCore: {
      rows: noCoreRows.length,
      shareRows: safeDivide(noCoreRows.length, rawRecords.length),
      ventas: sum(noCoreRows.map((record) => Math.abs(record.ventas))),
      shareVentas: safeDivide(sum(noCoreRows.map((record) => Math.abs(record.ventas))), totalVentas),
    },
    filasAnomalas: {
      positiveSalesZeroUnits: rawRecords.filter((record) => record.isPositiveSalesZeroUnits).length,
      nearZeroSalesPositiveUnits: rawRecords.filter((record) => record.isNearZeroSalesPositiveUnits).length,
      totalFlaggedRows: anomalyRows.length,
      shareRows: safeDivide(anomalyRows.length, rawRecords.length),
    },
    coberturaMapa: {
      storesWithCoordinates,
      springActiveStores: springActiveStores.size,
      coverage: safeDivide(storesWithCoordinates, springActiveStores.size),
    },
  };
}

export function buildDashboardData(excelFilePath: string): DashboardData {
  const workbook = XLSX.readFile(excelFilePath);
  const sourceSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sourceSheet];

  if (!sheet) {
    throw new Error("No se encontro la hoja principal del Excel.");
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
    const descripcion = asText(row[3]);
    const ventas = asNumber(row[TOTAL_SALES_INDEX]);
    const piezas = asNumber(row[TOTAL_PIECES_INDEX]);

    records.push({
      proveedorId: proveedor.id,
      proveedor: proveedor.name,
      tiendaId: tienda.id,
      tienda: tienda.name,
      interno: row[2] ? asNumber(row[2]) : null,
      descripcion,
      familia: getFamilyName(descripcion),
      sizeSegment: getSizeSegment(descripcion),
      dailyPieces: PIECES_COLUMN_INDEXES.map((index) => asNumber(row[index])),
      dailySales: SALES_COLUMN_INDEXES.map((index) => asNumber(row[index])),
      piezas,
      ventas,
      isNegative: ventas < 0 || piezas < 0,
      isNoCore: NO_CORE_MATCHER.test(descripcion),
      isPositiveSalesZeroUnits: ventas > 0 && piezas === 0,
      isNearZeroSalesPositiveUnits: ventas > 0 && ventas < 1 && piezas > 0,
    });
  }

  const generatedAt = new Date().toISOString();
  const coordinates = loadCoordinates();
  const promoterStores = loadPromoterStores();
  const coordinateLookup = buildCoordinateLookup(coordinates);
  const rawRecords = records;
  const cleanRecords = records.filter(isCommercialCleanRecord);

  const marketSales = sum(rawRecords.map((record) => record.ventas));
  const marketUnits = sum(rawRecords.map((record) => record.piezas));
  const competencia = aggregateCompetitors(rawRecords, marketSales);
  const springRank = competencia.findIndex((supplier) => SPRING_NAME_MATCHER.test(supplier.proveedor)) + 1;
  const springRecords = rawRecords.filter((record) => SPRING_NAME_MATCHER.test(record.proveedor));
  const springSales = sum(springRecords.map((record) => record.ventas));
  const springUnits = sum(springRecords.map((record) => record.piezas));
  const productos = aggregateProducts(springRecords, springSales);
  const skus = aggregateMarketSkus(rawRecords, marketSales);
  const tiendas = aggregateStores(rawRecords, springRecords, springSales);
  const topSkuCount = Math.max(1, Math.ceil(productos.length * 0.2));
  const concentracion: ConcentrationStats = {
    top20PctSkusShare: topShare(productos, topSkuCount, (row) => row.ventas, springSales),
    top10SkusShare: topShare(productos, 10, (row) => row.ventas, springSales),
    top5TiendasShare: topShare(tiendas, 5, (row) => row.ventas, springSales),
  };
  const mapStoreRows = buildMapRows(tiendas, coordinateLookup);
  const coverageNote = `${mapStoreRows.length} de ${tiendas.length} tiendas Spring Air tienen coordenadas cargadas para el mapa.`;
  const insights = buildInsights(productos, tiendas, concentracion, safeDivide(springSales, marketSales));
  const springSeries = buildDailySeries(springRecords);
  const marketSeries = buildDailySeries(rawRecords);
  const dashboardStoresById = new Map(
    tiendas
      .filter((store) => store.tiendaId !== null)
      .map((store) => [store.tiendaId as number, store.tienda]),
  );
  const dashboardStoresByName = new Map(
    tiendas.map((store) => [normalizeStoreKey(store.tienda), store.tienda]),
  );
  const promotoriaRows: PromoterStoreRow[] = promoterStores.map((store) => ({
    tienda: store.tienda,
    tiendaId: store.tiendaId,
    determinante: store.determinante,
    lat: store.lat,
    lon: store.lon,
    localizacion: store.localizacion,
    cadena: store.cadena,
    formato: store.formato,
    promotoria: true,
    matchedDashboardStore: resolveDashboardStoreMatch(store, dashboardStoresById, dashboardStoresByName),
  }));
  const matchedPromoterStores = promotoriaRows.filter((row) => row.matchedDashboardStore).length;
  const springFamilies = [...new Map(
    springRecords.reduce((entries, record) => {
      entries.set(record.familia, (entries.get(record.familia) ?? 0) + record.ventas);
      return entries;
    }, new Map<string, number>()),
  ).entries()].sort((left, right) => right[1] - left[1]);
  const activeSpringSkuCount = new Set(
    springRecords.filter((record) => record.ventas > 0 && record.interno !== null).map((record) => record.interno as number),
  ).size;
  const activeSpringStoreCount = new Set(
    springRecords.filter((record) => record.ventas > 0).map((record) => record.tienda),
  ).size;

  return {
    periodo: period.label,
    metadata: {
      excelFile: path.basename(excelFilePath),
      sourceSheet,
      generatedAt,
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
      ticketPromedio: safeDivide(springSales, springUnits),
      marketShare: safeDivide(springSales, marketSales),
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
      title: "Historico en preparacion",
      description:
        "Esta vista se activara cuando el dashboard consolide multiples periodos en una fuente persistente. Por ahora solo mostramos datos reales del archivo actual.",
      bullets: [
        "El diseno ya contempla una capa de acceso a datos reutilizable para cambiar Excel por base de datos.",
        "Cuando existan varios periodos, esta pestana mostrara evolucion mensual de ventas, market share, productos y tiendas.",
        `Las familias mas fuertes hoy son ${springFamilies
          .slice(0, 3)
          .map(([family]) => family)
          .join(", ")}.`,
      ],
    },
    mediciones: {
      raw: buildMeasurementSuite(rawRecords, "raw", generatedAt, coordinateLookup),
      comercialLimpia: buildMeasurementSuite(cleanRecords, "comercial_limpia", generatedAt, coordinateLookup),
    },
    calidad: buildDataQualityStats(rawRecords, coordinateLookup, generatedAt),
    promotoria: {
      source: "tiendas_export.xlsx",
      totalTiendas: promotoriaRows.length,
      matchedDashboardStores: matchedPromoterStores,
      tiendas: promotoriaRows,
    },
  };
}
