export type InsightTone = "success" | "warning" | "info";

export interface Metadata {
  excelFile: string;
  sourceSheet: string;
  generatedAt: string;
  dateRange: {
    startDay: number;
    endDay: number;
    month: number;
    monthLabel: string;
    year: number;
    totalDays: number;
  };
}

export interface SummaryStats {
  ventas: number;
  piezas: number;
  ticketPromedio: number;
  marketShare: number;
  ranking: number;
  skusActivos: number;
  tiendasActivas: number;
}

export interface CompetitorRow {
  proveedorId: number | null;
  proveedor: string;
  ventas: number;
  piezas: number;
  marketShare: number;
  ticketPromedio: number;
  tiendasActivas: number;
  skus: number;
}

export interface ProductRow {
  interno: number | null;
  descripcion: string;
  ventas: number;
  piezas: number;
  tiendas: number;
  ticketPromedio: number;
  participacionSpring: number;
}

export interface MarketSkuRow {
  proveedorId: number | null;
  proveedor: string;
  interno: number | null;
  descripcion: string;
  ventas: number;
  piezas: number;
  tiendas: number;
  ticketPromedio: number;
  participacionMercado: number;
}

export interface StoreRow {
  tiendaId: number | null;
  tienda: string;
  ventas: number;
  piezas: number;
  skus: number;
  ticketPromedio: number;
  shareDentroTienda: number;
  participacionSpring: number;
}

export interface ConcentrationStats {
  top20PctSkusShare: number;
  top10SkusShare: number;
  top5TiendasShare: number;
}

export interface Insight {
  tone: InsightTone;
  title: string;
  body: string;
}

export interface DailyPoint {
  dia: number;
  ventas: number;
  piezas: number;
  ticketPromedio: number;
}

export interface MapStore {
  tienda: string;
  lat: number;
  lon: number;
  ventas: number;
  piezas: number;
  ticketPromedio: number;
}

export interface HistoricalTopItem {
  nombre: string;
  venta: number;
  piezas: number;
}

export interface HistoricalMonth {
  mes: string;
  mesNombre: string;
  ventas: number;
  piezas: number;
  marketShare: number;
  ticketPromedio: number;
  skusActivos: number;
  tiendasActivas: number;
  topProductos: HistoricalTopItem[];
  topTiendas: HistoricalTopItem[];
}

export interface HistoricalMetrics {
  crecimientoVentas: number;
  promedioMensualVentas: number;
  promedioMensualPiezas: number;
  marketSharePromedio: number;
}

export interface HistoricalData {
  status: "mock_ready";
  title: string;
  description: string;
  generatedAt: string;
  months: number;
  periodLabel: string;
  entries: HistoricalMonth[];
  metrics: HistoricalMetrics;
}

export interface HistoricalPlaceholderData {
  status: "coming_soon";
  title: string;
  description: string;
  bullets: string[];
}

export interface DashboardData {
  periodo: string;
  metadata: Metadata;
  resumen: SummaryStats;
  mercado: {
    totalVenta: number;
    totalPiezas: number;
    rankingProveedores: CompetitorRow[];
  };
  competencia: CompetitorRow[];
  productos: ProductRow[];
  skus: MarketSkuRow[];
  tiendas: StoreRow[];
  concentracion: ConcentrationStats;
  insights: Insight[];
  mapa: {
    coverageNote: string;
    tiendas: MapStore[];
  };
  series: {
    springAir: DailyPoint[];
    mercado: DailyPoint[];
  };
  historico: HistoricalData | HistoricalPlaceholderData;
}
