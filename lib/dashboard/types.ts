export type InsightTone = "success" | "warning" | "info";
export type MetricBase = "raw" | "comercial_limpia";

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
  tiendaId?: number | null;
  determinante?: string | null;
  lat: number;
  lon: number;
  ventas: number;
  piezas: number;
  ticketPromedio: number;
  promotoria?: boolean;
  localizacion?: string | null;
  cadena?: string | null;
  formato?: string | null;
  tiendaFuente?: string | null;
  segment?: "standard" | "opportunity" | "white_space";
  opportunity?: number;
  shareDentroTienda?: number;
}

export interface MetricSnapshot<T> {
  base: MetricBase;
  updatedAt: string;
  payload: T;
}

export interface DistributionMetric {
  distribucionNumerica: number;
  distribucionPonderada: number;
  springStores: number;
  marketStores: number;
  coveredMarketSales: number;
  totalMarketSales: number;
}

export interface ProviderVelocityRow {
  proveedor: string;
  ventas: number;
  piezas: number;
  tiendasActivas: number;
  skusActivos: number;
  ventasPorTienda: number;
  piezasPorTienda: number;
  ventasPorSku: number;
  piezasPorSku: number;
}

export interface StoreOpportunityRow {
  tienda: string;
  tiendaId: number | null;
  determinante?: string | null;
  ventasMercado: number;
  ventasSpring: number;
  shareActual: number;
  shareObjetivo: number;
  gapShare: number;
  oportunidadVenta: number;
  promotoria?: boolean;
  localizacion?: string | null;
  cadena?: string | null;
  formato?: string | null;
  tiendaFuente?: string | null;
  lat?: number;
  lon?: number;
}

export interface PromoterStoreRow {
  tienda: string;
  tiendaId: number | null;
  determinante: string | null;
  lat: number;
  lon: number;
  localizacion: string | null;
  cadena: string | null;
  formato: string | null;
  promotoria: boolean;
  matchedDashboardStore: string | null;
}

export interface ProductividadSkuRow {
  interno: number | null;
  descripcion: string;
  familia: string;
  ventas: number;
  piezas: number;
  tiendas: number;
  diasConVenta: number;
  ticketPromedio: number;
  ventasPorTienda: number;
  piezasPorTienda: number;
  shareSpring: number;
}

export interface SkuEfficiencyRow extends ProductividadSkuRow {
  segmento: "alta_distribucion_baja_velocidad" | "baja_distribucion_alta_velocidad";
}

export interface PriceIndexRow {
  scope: "tienda" | "sku" | "familia";
  nombre: string;
  springTicket: number;
  marketTicket: number;
  leaderTicket: number;
  indexVsMarket: number;
  indexVsLeader: number;
}

export interface PriceMixBand {
  label: string;
  min: number;
  max: number | null;
  ventas: number;
  piezas: number;
  shareVentas: number;
  sharePiezas: number;
}

export interface DailyConsistencyMetric {
  top3Share: number;
  coefficientOfVariation: number;
  bestDay: DailyPoint | null;
  worstDay: DailyPoint | null;
}

export interface DependencyRow {
  tienda: string;
  ventas: number;
  topSku: string;
  topSkuShare: number;
  topFamily: string;
  topFamilyShare: number;
}

export interface PortfolioConcentrationMetric {
  top5SkusShare: number;
  top10SkusShare: number;
  longTailSkusShare: number;
  top5StoresShare: number;
  top10StoresShare: number;
  longTailStoresShare: number;
}

export interface MeasurementSuite {
  distribucion: MetricSnapshot<DistributionMetric>;
  velocidadProveedores: MetricSnapshot<ProviderVelocityRow[]>;
  oportunidadTiendas: MetricSnapshot<{
    shareObjetivo: number;
    marketMedian: number;
    benchmarkStores: string[];
    benchmarkRows: StoreOpportunityRow[];
    rows: StoreOpportunityRow[];
  }>;
  tiendasBlancas: MetricSnapshot<{
    shareThreshold: number;
    rows: StoreOpportunityRow[];
  }>;
  concentracionPortafolio: MetricSnapshot<PortfolioConcentrationMetric>;
  productividadSku: MetricSnapshot<ProductividadSkuRow[]>;
  eficienciaSurtido: MetricSnapshot<{
    altaDistribucionBajaVelocidad: SkuEfficiencyRow[];
    bajaDistribucionAltaVelocidad: SkuEfficiencyRow[];
  }>;
  indicePrecio: MetricSnapshot<{
    tiendas: PriceIndexRow[];
    skus: PriceIndexRow[];
    familias: PriceIndexRow[];
  }>;
  mixPrecio: MetricSnapshot<PriceMixBand[]>;
  consistenciaDiaria: MetricSnapshot<DailyConsistencyMetric>;
  riesgoDependencia: MetricSnapshot<{
    topSkuShare: number;
    topFamilyShare: number;
    stores: DependencyRow[];
  }>;
  mapaOportunidad: MetricSnapshot<MapStore[]>;
}

export interface DataQualityStats {
  updatedAt: string;
  tasaDevoluciones: {
    rows: number;
    shareRows: number;
    ventas: number;
    shareVentas: number;
    piezas: number;
    sharePiezas: number;
  };
  tasaLineasNoCore: {
    rows: number;
    shareRows: number;
    ventas: number;
    shareVentas: number;
  };
  filasAnomalas: {
    positiveSalesZeroUnits: number;
    nearZeroSalesPositiveUnits: number;
    totalFlaggedRows: number;
    shareRows: number;
  };
  coberturaMapa: {
    storesWithCoordinates: number;
    springActiveStores: number;
    coverage: number;
  };
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
  mediciones: {
    raw: MeasurementSuite;
    comercialLimpia: MeasurementSuite;
  };
  calidad: DataQualityStats;
  promotoria: {
    source: string;
    totalTiendas: number;
    matchedDashboardStores: number;
    tiendas: PromoterStoreRow[];
  };
}
