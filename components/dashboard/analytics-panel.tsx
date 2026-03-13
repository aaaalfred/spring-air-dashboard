"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { BarChartCard } from "@/components/charts/bar-chart-card";
import { AnalyticsHelpModal, type AnalyticsHelpContent } from "@/components/dashboard/analytics-help-modal";
import { MapPanel } from "@/components/dashboard/map-panel";
import {
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/dashboard/format";
import type { DashboardData, MeasurementSuite, StoreOpportunityRow } from "@/lib/dashboard/types";

type AnalyticsHelpKey =
  | "base_activa"
  | "distribucion_numerica"
  | "distribucion_ponderada"
  | "share_objetivo_tienda"
  | "indice_promedio_precio"
  | "top_oportunidad_chart"
  | "detalle_oportunidad_table"
  | "tiendas_blancas_table"
  | "mapa_oportunidad"
  | "top5_skus"
  | "long_tail_skus"
  | "dependencia_top_sku"
  | "productividad_chart"
  | "productividad_table"
  | "eficiencia_table"
  | "mix_precio_chart"
  | "indice_tienda_table"
  | "indice_familia_table"
  | "indice_sku_table"
  | "devoluciones"
  | "lineas_no_core"
  | "filas_anomalias"
  | "cobertura_mapa";

function percentPoints(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function HelpTrigger({
  label,
  onOpen,
}: {
  label: string;
  onOpen: (trigger: HTMLElement) => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => onOpen(event.currentTarget)}
      aria-label={label}
      className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-xs font-bold text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
    >
      i
    </button>
  );
}

function SectionLead({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-300">{eyebrow}</p>
      <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <h3 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h3>
        <p className="max-w-3xl text-sm leading-7 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function CardTitle({
  title,
  onHelp,
}: {
  title: string;
  onHelp: (trigger: HTMLElement) => void;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h4 className="text-lg font-bold tracking-tight text-slate-900">{title}</h4>
      <HelpTrigger label={`Abrir ayuda para ${title}`} onOpen={onHelp} />
    </div>
  );
}

function MiniTable({
  title,
  onHelp,
  headers,
  rows,
}: {
  title: string;
  onHelp: (trigger: HTMLElement) => void;
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
      <CardTitle title={title} onHelp={onHelp} />
      <table className="min-w-full text-left">
        <thead className="border-b border-slate-100 bg-slate-50/90">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-slate-100/80 last:border-b-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-5 py-4 text-sm text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  onHelp,
}: {
  label: string;
  value: string;
  helper: string;
  onHelp: (trigger: HTMLElement) => void;
}) {
  return (
    <article className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">{label}</p>
        <HelpTrigger label={`Abrir ayuda para ${label}`} onOpen={onHelp} />
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </article>
  );
}

function SupportStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-slate-100 bg-slate-50/80 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
    </article>
  );
}

function StatusBadge({
  tone,
  label,
}: {
  tone: "yes" | "no" | "mixed";
  label: string;
}) {
  const classes =
    tone === "yes"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "no"
        ? "border-slate-200 bg-slate-50 text-slate-600"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}>
      {label}
    </span>
  );
}

interface PromoterAssumptionRow {
  tienda: string;
  ventasSpring: number;
  shareActual: number;
  reason: string;
  source: "benchmark" | "high_signal";
}

function buildMockPromoterCoverage(current: MeasurementSuite) {
  const assumed = new Map<string, PromoterAssumptionRow>();
  const opportunityRows = current.oportunidadTiendas.payload.rows;

  for (const row of current.oportunidadTiendas.payload.benchmarkRows) {
    if (/^INTERNET$/i.test(row.tienda)) continue;
    assumed.set(row.tienda, {
      tienda: row.tienda,
      ventasSpring: row.ventasSpring,
      shareActual: row.shareActual,
      reason: "Benchmark de share: tienda donde la marca ya compite por arriba del promedio.",
      source: "benchmark",
    });
  }

  for (const row of opportunityRows) {
    if (/^INTERNET$/i.test(row.tienda)) continue;
    if (row.ventasSpring >= 100000 && row.shareActual >= 0.05) {
      assumed.set(row.tienda, {
        tienda: row.tienda,
        ventasSpring: row.ventasSpring,
        shareActual: row.shareActual,
        reason: "Plaza con venta Spring relevante y presencia comercial visible.",
        source: "high_signal",
      });
    }
  }

  const rows = [...assumed.values()].sort(
    (left, right) => right.ventasSpring - left.ventasSpring || right.shareActual - left.shareActual,
  );
  const coveredStores = new Set(rows.map((row) => row.tienda));
  const opportunityWithPromoter = opportunityRows.filter((row) => coveredStores.has(row.tienda));
  const opportunityWithoutPromoter = opportunityRows.filter((row) => !coveredStores.has(row.tienda));

  return {
    rows,
    coveredStores,
    opportunityWithPromoter,
    opportunityWithoutPromoter,
    assumedCoverage: current.distribucion.payload.marketStores
      ? rows.length / current.distribucion.payload.marketStores
      : 0,
  };
}

function shortStoreLabel(store: string) {
  return store
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function ShareObjectiveSupport({
  rows,
  shareObjetivo,
}: {
  rows: StoreOpportunityRow[];
  shareObjetivo: number;
}) {
  const totalMercado = rows.reduce((sum, row) => sum + row.ventasMercado, 0);
  const totalSpring = rows.reduce((sum, row) => sum + row.ventasSpring, 0);
  const averageShare = rows.length > 0 ? rows.reduce((sum, row) => sum + row.shareActual, 0) / rows.length : 0;
  const salesMax = Math.max(...rows.map((row) => row.ventasMercado), 0);
  const shareMax = Math.max(...rows.map((row) => row.shareActual), shareObjetivo, 0.3);
  const formulaLine =
    rows.length > 0
      ? `(${rows.map((row) => `${(row.shareActual * 100).toFixed(4)}%`).join(" + ")}) / ${rows.length} = ${(averageShare * 100).toFixed(4)}%`
      : "No hay tiendas benchmark disponibles.";

  const chartRows = rows.map((row) => ({
    ...row,
    label: shortStoreLabel(row.tienda),
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SupportStat label="Venta total (top 10)" value={formatCompactCurrency(totalMercado)} />
        <SupportStat label="Venta Spring Air (top 10)" value={formatCompactCurrency(totalSpring)} />
        <SupportStat label="Share promedio" value={formatPercent(averageShare)} />
      </div>

      <section className="rounded-[1.5rem] border border-slate-100 bg-slate-50/60 p-5">
        <p className="text-sm font-semibold text-slate-900">Mercado vs Spring Air en las 10 tiendas benchmark</p>
        <p className="mt-1 text-sm text-slate-500">
          Estas son las 10 tiendas con mayor share actual de Spring Air. El promedio simple de sus shares es el
          valor que ves como `Share objetivo por tienda`.
        </p>
        <div className="mt-4 h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartRows} margin={{ top: 12, right: 20, left: 4, bottom: 72 }}>
              <CartesianGrid stroke="rgba(15, 23, 42, 0.08)" vertical={false} />
              <XAxis
                dataKey="label"
                interval={0}
                angle={-22}
                textAnchor="end"
                height={84}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <YAxis
                width={82}
                domain={[0, salesMax * 1.1]}
                tickFormatter={(value) => formatCompactCurrency(Number(value))}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <Tooltip
                formatter={(value, name) =>
                  name === "Share %"
                    ? `${(Number(value) * 100).toFixed(2)}%`
                    : formatCompactCurrency(Number(value))
                }
                contentStyle={{
                  borderRadius: "18px",
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                  boxShadow: "0 16px 28px rgba(15, 23, 42, 0.1)",
                }}
              />
              <Legend />
              <Bar dataKey="ventasMercado" name="Mercado total" fill="#bfdbfe" radius={[8, 8, 0, 0]} />
              <Bar dataKey="ventasSpring" name="Spring Air" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-slate-100 bg-slate-50/60 p-5">
        <p className="text-sm font-semibold text-slate-900">
          Share por tienda: línea de referencia {formatPercent(shareObjetivo)}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          La línea punteada marca el promedio top 10. Las barras más oscuras quedan arriba o en línea; las claras,
          por debajo.
        </p>
        <div className="mt-4 h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartRows} margin={{ top: 12, right: 20, left: 4, bottom: 72 }}>
              <CartesianGrid stroke="rgba(15, 23, 42, 0.08)" vertical={false} />
              <XAxis
                dataKey="label"
                interval={0}
                angle={-22}
                textAnchor="end"
                height={84}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <YAxis
                width={58}
                domain={[0, shareMax * 1.1]}
                tickFormatter={(value) => `${(Number(value) * 100).toFixed(0)}%`}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => `${(Number(value) * 100).toFixed(2)}%`}
                contentStyle={{
                  borderRadius: "18px",
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                  boxShadow: "0 16px 28px rgba(15, 23, 42, 0.1)",
                }}
              />
              <ReferenceLine
                y={shareObjetivo}
                stroke="#ea580c"
                strokeDasharray="6 6"
                label={{
                  value: `${formatPercent(shareObjetivo)} promedio top 10`,
                  position: "insideTopRight",
                  fill: "#c2410c",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="shareActual" name="Share %" radius={[8, 8, 0, 0]}>
                {chartRows.map((row) => (
                  <Cell
                    key={row.tienda}
                    fill={row.shareActual >= shareObjetivo ? "#0f9f6e" : "#9bd8c7"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-slate-100 bg-slate-950 px-5 py-4 text-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Formula exacta</p>
        <p className="mt-3 text-sm leading-7 text-slate-200">{formulaLine}</p>
      </section>

      <div className="overflow-x-auto rounded-[1.5rem] border border-slate-100">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              {["Tienda", "Mercado", "Spring Air", "Share actual"].map((header) => (
                <th key={header} className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {rows.map((row) => (
              <tr key={row.tienda} className="border-t border-slate-100">
                <td className="px-4 py-3 text-sm text-slate-700">{shortStoreLabel(row.tienda)}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{formatCurrency(row.ventasMercado)}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{formatCurrency(row.ventasSpring)}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                  {(row.shareActual * 100).toFixed(4)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildGapExample(row: StoreOpportunityRow) {
  return [
    `Ejemplo con ${row.tienda}:`,
    `Mercado = ${formatCurrency(row.ventasMercado)}`,
    `Spring Air = ${formatCurrency(row.ventasSpring)}`,
    `Share actual = ${formatCurrency(row.ventasSpring)} / ${formatCurrency(row.ventasMercado)} = ${percentPoints(row.shareActual)}`,
    `Gap = ${percentPoints(row.shareObjetivo)} - ${percentPoints(row.shareActual)} = ${percentPoints(row.gapShare)}`,
    `Oportunidad = (${formatCurrency(row.ventasMercado)} x ${percentPoints(row.shareObjetivo)}) - ${formatCurrency(row.ventasSpring)} = ${formatCurrency(row.oportunidadVenta)}`,
  ].join("\n");
}

function buildHelpRegistry(
  current: MeasurementSuite,
  calidad: DashboardData["calidad"],
  avgFamilyIndex: number,
): Record<AnalyticsHelpKey, AnalyticsHelpContent> {
  const distribution = current.distribucion.payload;
  const objective = current.oportunidadTiendas.payload;
  const benchmarkRows = objective.benchmarkRows;
  const nezahualcoyotl =
    objective.rows.find((row) => /NEZAHUALCOYOTL/i.test(row.tienda)) ??
    objective.rows[0];
  const internet = objective.rows.find((row) => /INTERNET/i.test(row.tienda)) ?? objective.rows[0];
  const whiteSpaceExample = current.tiendasBlancas.payload.rows[0] ?? objective.rows[0];
  const topProductividad = current.productividadSku.payload[0];
  const lowVelocity = current.eficienciaSurtido.payload.altaDistribucionBajaVelocidad[0];
  const highVelocity = current.eficienciaSurtido.payload.bajaDistribucionAltaVelocidad[0];
  const mixExample = current.mixPrecio.payload[0];
  const priceStore = current.indicePrecio.payload.tiendas[0];
  const priceFamily = current.indicePrecio.payload.familias[0];
  const priceSku = current.indicePrecio.payload.skus[0];
  const benchmarkStores = objective.benchmarkStores.join(", ");

  return {
    base_activa: {
      title: "Base activa: Raw",
      definition:
        "Es la fotografia completa del archivo Excel tal como fue cargado. No elimina descuentos, exhibiciones, obsequios, promocionales, devoluciones ni filas anomalias.",
      formula:
        "No es una formula numerica.\nBase raw = todas las filas leidas desde la hoja principal del Excel y procesadas sin depuracion comercial.",
      dataSource:
        "Proviene del pipeline `buildMeasurementSuite(rawRecords, 'raw', ...)`, donde `rawRecords = records` y `records` son todas las filas parseadas desde el Excel.",
      example:
        "En esta vista siguen contando lineas como DESC, EXHIBICION, OBSEQUIO y PROMOCIONALES, ademas de devoluciones y anomalias de captura.",
      rationale:
        "Sirve para leer continuidad operacional y auditar lo que realmente trae la fuente antes de aplicar filtros de negocio.",
      notes:
        "Puede distorsionar metricas comerciales cuando hay mucho ruido no core o devoluciones en el periodo.",
    },
    distribucion_numerica: {
      title: "Distribucion numerica",
      definition:
        "Mide en que porcentaje de tiendas del mercado Spring Air tiene presencia comercial.",
      formula:
        "Distribucion numerica = tiendas activas Spring Air / tiendas activas mercado",
      dataSource:
        "Se construye agregando ventas por tienda y contando tiendas con venta positiva de Spring Air frente al total de tiendas activas del mercado.",
      example:
        `${formatNumber(distribution.springStores)} / ${formatNumber(distribution.marketStores)} = ${formatPercent(distribution.distribucionNumerica)}`,
      rationale:
        "Sirve para entender alcance comercial: cuantas plazas relevantes ya tienen a la marca operando.",
    },
    distribucion_ponderada: {
      title: "Distribucion ponderada",
      definition:
        "Mide que porcentaje de la venta del mercado ocurre en tiendas donde Spring Air esta presente.",
      formula:
        "Distribucion ponderada = venta mercado en tiendas con Spring Air / venta total mercado",
      dataSource:
        "El pipeline suma la venta de mercado de todas las tiendas donde Spring Air tiene presencia y la divide entre la venta total del mercado.",
      example:
        `${formatCompactCurrency(distribution.coveredMarketSales)} / ${formatCompactCurrency(distribution.totalMarketSales)} = ${formatPercent(distribution.distribucionPonderada)}`,
      rationale:
        "No solo importa cuantas tiendas cubres, sino cuanto pesan economicamente esas tiendas dentro del mercado.",
    },
    share_objetivo_tienda: {
      title: "Share objetivo por tienda",
      definition:
        "Es el share benchmark que el modelo usa para estimar la oportunidad comercial faltante en cada tienda.",
      formula:
        "1. shareActual por tienda = ventasSpring / ventasMercado\n2. Ordenar tiendas con presencia Spring Air por mayor share\n3. Tomar las 10 primeras\n4. shareObjetivo = promedio de esos 10 shares",
      dataSource:
        `Proviene de la salida de oportunidad por tienda. Las tiendas benchmark actuales son: ${benchmarkStores}.`,
      example:
        `Share objetivo actual = ${formatPercent(objective.shareObjetivo)}\nMediana mercado por tienda = ${formatCompactCurrency(objective.marketMedian)}\nTiendas benchmark: ${benchmarkStores}`,
      rationale:
        "Permite comparar una tienda contra un referente interno realista de buen desempeno, en lugar de usar un objetivo arbitrario.",
      notes:
        "No es el market share total de Spring Air. Es un share objetivo local por tienda, construido con las 10 tiendas de mejor participacion.",
      visual: <ShareObjectiveSupport rows={benchmarkRows} shareObjetivo={objective.shareObjetivo} />,
    },
    indice_promedio_precio: {
      title: "Indice promedio de precio",
      definition:
        "Resume el posicionamiento relativo de precio de Spring Air contra mercado a nivel familias.",
      formula:
        "Indice por familia = ticket Spring Air / ticket mercado\nIndice promedio = promedio simple de esos indices por familia",
      dataSource:
        "Se calcula desde `indicePrecio.payload.familias`, comparando ticket promedio de Spring Air contra ticket promedio del mercado por familia.",
      example: `Indice promedio actual = ${avgFamilyIndex.toFixed(2)}x`,
      rationale:
        "Ayuda a leer si la marca juega arriba, abajo o en linea con el mercado en promedio.",
      notes: "En esta version el promedio es simple, no ponderado por ventas.",
    },
    top_oportunidad_chart: {
      title: "Top 10 tiendas por oportunidad no capturada",
      definition:
        "Ranking de tiendas donde el modelo estima mas venta incremental si Spring Air alcanzara el share objetivo local.",
      formula:
        "Oportunidad = max(0, ventasMercado x shareObjetivo - ventasSpring)",
      dataSource:
        "Se genera a partir de `oportunidadTiendas.payload.rows` y ordena descendentemente por `oportunidadVenta`.",
      example: internet
        ? `La tienda ${internet.tienda} aparece con ${formatCurrency(internet.oportunidadVenta)} porque hoy vende ${formatCurrency(internet.ventasSpring)} sobre un mercado de ${formatCurrency(internet.ventasMercado)}.`
        : "La grafica ordena las 10 tiendas con mayor oportunidad estimada.",
      rationale:
        "Sirve para priorizar atencion comercial donde el mercado ya existe y la marca tiene una brecha monetizable.",
    },
    detalle_oportunidad_table: {
      title: "Detalle de oportunidad por tienda",
      definition:
        "Tabla operativa que desglosa la brecha comercial por tienda y la convierte a pesos.",
      formula:
        "Share actual = ventasSpring / ventasMercado\nGap = max(0, shareObjetivo - shareActual)\nOportunidad = max(0, ventasMercado x shareObjetivo - ventasSpring)",
      dataSource:
        "Proviene del arreglo `oportunidadTiendas.payload.rows`, construido agregando venta de mercado y venta Spring Air por tienda.",
      example: buildGapExample(nezahualcoyotl),
      rationale:
        "Permite pasar de una lectura de share a una lectura accionable en pesos por tienda.",
      notes:
        "El `Gap` se muestra en puntos de participacion faltantes; la `Oportunidad` es ese faltante expresado en venta incremental estimada.",
    },
    tiendas_blancas_table: {
      title: "Tiendas blancas priorizadas",
      definition:
        "Lista de tiendas con mercado relevante y participacion Spring Air casi nula o muy baja.",
      formula:
        "Tienda blanca priorizada = tienda con ventasMercado >= marketMedian y shareActual < 3%",
      dataSource:
        "Se filtran desde la misma salida de oportunidad por tienda, usando la mediana de mercado por tienda como umbral de relevancia.",
      example: whiteSpaceExample
        ? `${whiteSpaceExample.tienda} entra como tienda blanca porque mueve ${formatCurrency(whiteSpaceExample.ventasMercado)} y Spring Air solo participa con ${formatPercent(whiteSpaceExample.shareActual)}.`
        : "Se listan las tiendas con mayor mercado y muy bajo share Spring Air.",
      rationale:
        "Ayuda a detectar plazas donde la marca casi no existe, pero el mercado si justifica entrar o reforzar cobertura.",
    },
    mapa_oportunidad: {
      title: "Mapa analitico de oportunidad",
      definition:
        "Ubica geograficamente las tiendas con coordenadas y resalta focos de oportunidad y espacios blancos.",
      formula:
        "Cada marcador hereda la oportunidad y share actual calculados en `oportunidadTiendas`. El color o segmento identifica tienda estandar, oportunidad o espacio blanco.",
      dataSource:
        "Cruza `mapaOportunidad.payload` con las coordenadas cargadas en `store-coordinates.json` y la salida analitica de oportunidad por tienda.",
      example:
        `Cobertura actual del mapa: ${formatPercent(calidad.coberturaMapa.coverage)} (${formatNumber(calidad.coberturaMapa.storesWithCoordinates)} de ${formatNumber(calidad.coberturaMapa.springActiveStores)} tiendas activas con coordenadas).`,
      rationale:
        "Permite leer patron geografico y no solo ranking tabular, para detectar concentraciones y huecos regionales.",
    },
    top5_skus: {
      title: "Top 5 SKUs",
      definition:
        "Participacion de ventas que concentra el grupo de los 5 SKUs mas fuertes de Spring Air.",
      formula:
        "Top 5 SKUs share = venta de los 5 SKUs lideres / venta total Spring Air",
      dataSource:
        "Se calcula desde la agregacion de productos Spring Air ordenados por ventas.",
      example:
        `Hoy los 5 SKUs mas fuertes concentran ${formatPercent(current.concentracionPortafolio.payload.top5SkusShare)} de la venta Spring Air.`,
      rationale:
        "Ayuda a medir dependencia del surtido ganador y el nivel de concentracion del portafolio.",
    },
    long_tail_skus: {
      title: "Long tail de SKUs",
      definition:
        "Participacion de ventas que proviene del portafolio fuera del top 10 de SKUs.",
      formula: "Long tail share = 1 - top10SkusShare",
      dataSource:
        "Se deriva de la concentracion del portafolio calculada sobre los productos Spring Air agregados.",
      example:
        `El long tail aporta ${formatPercent(current.concentracionPortafolio.payload.longTailSkusShare)} de la venta.`,
      rationale:
        "Sirve para saber si el resto del catalogo realmente complementa al top de SKUs o si casi toda la venta se concentra arriba.",
    },
    dependencia_top_sku: {
      title: "Dependencia top SKU",
      definition:
        "Mide que porcentaje de la venta Spring Air depende del SKU lider.",
      formula:
        "Dependencia top SKU = ventas del SKU numero 1 / ventas totales Spring Air",
      dataSource:
        "Se obtiene desde `riesgoDependencia.payload.topSkuShare`, calculado a partir del ranking de productividad de SKUs Spring Air.",
      example: topProductividad
        ? `${topProductividad.descripcion} aporta ${formatPercent(current.riesgoDependencia.payload.topSkuShare)} de la venta total Spring Air.`
        : `Dependencia actual = ${formatPercent(current.riesgoDependencia.payload.topSkuShare)}`,
      rationale:
        "Entre mas alto sea, mayor riesgo de concentracion comercial en un solo producto.",
    },
    productividad_chart: {
      title: "Top 10 SKUs por ventas por tienda",
      definition:
        "Compara productividad de SKUs usando ventas promedio por tienda activa, no venta total.",
      formula:
        "Ventas por tienda = ventas del SKU / numero de tiendas activas del SKU",
      dataSource:
        "Se construye con `productividadSku.payload`, calculado sobre los registros Spring Air.",
      example: topProductividad
        ? `${topProductividad.descripcion} genera ${formatCurrency(topProductividad.ventasPorTienda)} por tienda activa en promedio, con presencia en ${formatNumber(topProductividad.tiendas)} tiendas.`
        : "La grafica ordena los 10 SKUs con mayor venta promedio por tienda.",
      rationale:
        "Ayuda a distinguir productos que son realmente eficientes por punto de venta, no solo por volumen agregado.",
    },
    productividad_table: {
      title: "Productividad del surtido",
      definition:
        "Tabla detallada para entender que tan productivo es cada SKU dentro del portafolio Spring Air.",
      formula:
        "Ventas/Tienda = ventas del SKU / tiendas activas\nDias con venta = numero de dias del periodo donde el SKU tuvo venta positiva\nShare Spring = ventas del SKU / ventas totales Spring Air",
      dataSource:
        "Se alimenta de `productividadSku.payload`, que agrega ventas, piezas, tiendas y dias con venta por SKU.",
      example: topProductividad
        ? `${topProductividad.descripcion}: ${formatCurrency(topProductividad.ventasPorTienda)} por tienda, ${formatNumber(topProductividad.diasConVenta)} dias con venta y ${formatPercent(topProductividad.shareSpring)} del negocio Spring Air.`
        : "La tabla resume productividad y profundidad de cada SKU.",
      rationale:
        "Sirve para decidir que defender, expandir o revisar dentro del surtido.",
    },
    eficiencia_table: {
      title: "Alertas de eficiencia",
      definition:
        "Cruza distribucion y velocidad para detectar SKUs sobredistribuidos y SKUs subdistribuidos con alto potencial.",
      formula:
        "Alta distribucion / baja velocidad = tiendas >= P75 de distribucion y ventas por tienda < mediana de velocidad\nBaja distribucion / alta velocidad = tiendas < mediana de distribucion y ventas por tienda >= P75 de velocidad",
      dataSource:
        "Se calcula sobre `productividadSku.payload` usando medianas y percentiles de tiendas activas y ventas por tienda.",
      example:
        `Ejemplo de alta distribucion / baja velocidad: ${lowVelocity?.descripcion ?? "N/D"} con ${formatNumber(lowVelocity?.tiendas ?? 0)} tiendas y ${formatCurrency(lowVelocity?.ventasPorTienda ?? 0)} por tienda.\nEjemplo de baja distribucion / alta velocidad: ${highVelocity?.descripcion ?? "N/D"} con ${formatNumber(highVelocity?.tiendas ?? 0)} tienda(s) y ${formatCurrency(highVelocity?.ventasPorTienda ?? 0)} por tienda.`,
      rationale:
        "Te ayuda a detectar donde conviene podar distribucion o, al contrario, expandir un SKU que ya prueba buena velocidad.",
    },
    mix_precio_chart: {
      title: "Mix de precio Spring Air por banda",
      definition:
        "Distribuye las ventas de Spring Air por bandas de ticket para entender donde se concentra el mix de precio.",
      formula:
        "El pipeline calcula percentiles del ticket de mercado y crea bandas. Luego agrega ventas Spring Air dentro de cada banda y calcula su participacion.",
      dataSource:
        "Se construye desde `mixPrecio.payload`, usando registros validos con ventas y piezas positivas.",
      example: mixExample
        ? `La banda ${mixExample.label} concentra ${formatCurrency(mixExample.ventas)} y ${formatPercent(mixExample.shareVentas)} de las ventas Spring Air.`
        : "La grafica reparte las ventas de Spring Air por escalones de ticket.",
      rationale:
        "Sirve para ver si la marca vive mas en entrada, medio o premium y como se reparte el negocio por nivel de precio.",
    },
    indice_tienda_table: {
      title: "Indice de precio por tienda",
      definition:
        "Compara ticket promedio de Spring Air contra ticket promedio del mercado dentro de cada tienda.",
      formula:
        "Indice vs mercado = ticket Spring Air / ticket mercado",
      dataSource:
        "Se obtiene agregando ventas y piezas por proveedor dentro de cada tienda y comparando el ticket de Spring Air contra el promedio de mercado.",
      example: priceStore
        ? `${priceStore.nombre}: ${formatCurrency(priceStore.springTicket)} / ${formatCurrency(priceStore.marketTicket)} = ${priceStore.indexVsMarket.toFixed(2)}x`
        : "Cada fila compara el ticket Spring Air contra el ticket promedio del mercado en esa tienda.",
      rationale:
        "Ayuda a entender si la marca esta premium, en linea o por debajo del mercado por plaza.",
    },
    indice_familia_table: {
      title: "Indice de precio por familia",
      definition:
        "Compara ticket promedio de Spring Air contra el ticket del lider dentro de cada familia.",
      formula:
        "Indice vs lider = ticket Spring Air / ticket del lider",
      dataSource:
        "El pipeline agrega ventas y piezas por familia y proveedor, identifica al lider por ventas y compara el ticket de Spring Air contra ese referente.",
      example: priceFamily
        ? `${priceFamily.nombre}: ${formatCurrency(priceFamily.springTicket)} / ${formatCurrency(priceFamily.leaderTicket)} = ${priceFamily.indexVsLeader.toFixed(2)}x`
        : "Cada fila compara Spring Air contra el lider de la familia.",
      rationale:
        "Sirve para leer posicionamiento competitivo real dentro de las familias donde participa la marca.",
    },
    indice_sku_table: {
      title: "Indice de precio por SKU",
      definition:
        "Compara ticket promedio del SKU Spring Air contra el ticket promedio del mercado del mismo agregado de comparacion.",
      formula:
        "Indice vs mercado = ticket del SKU Spring Air / ticket promedio del mercado",
      dataSource:
        "Proviene de `indicePrecio.payload.skus`, donde el pipeline cruza productividad de SKUs Spring Air con tickets promedio del mercado en agregados equivalentes.",
      example: priceSku
        ? `${priceSku.nombre}: ${formatCurrency(priceSku.springTicket)} / ${formatCurrency(priceSku.marketTicket)} = ${priceSku.indexVsMarket.toFixed(2)}x`
        : "Cada fila compara precio relativo del SKU Spring Air contra el mercado.",
      rationale:
        "Te ayuda a detectar donde un SKU esta demasiado arriba o abajo frente al mercado.",
    },
    devoluciones: {
      title: "Devoluciones",
      definition:
        "Cuantifica el peso de filas con ventas o piezas negativas dentro del archivo.",
      formula:
        "Share filas devoluciones = filas negativas / filas totales\nShare ventas devoluciones = ventas absolutas negativas / ventas absolutas totales",
      dataSource:
        "Se calcula desde `calidad.tasaDevoluciones`, marcando cualquier fila con ventas < 0 o piezas < 0.",
      example:
        `${formatNumber(calidad.tasaDevoluciones.rows)} filas negativas representan ${formatPercent(calidad.tasaDevoluciones.shareRows)} del archivo y ${formatCompactCurrency(calidad.tasaDevoluciones.ventas)} en valor absoluto.`,
      rationale:
        "Ayuda a saber cuanto del periodo puede estar siendo afectado por devoluciones y no por venta comercial neta.",
    },
    lineas_no_core: {
      title: "Lineas no core",
      definition:
        "Mide el peso de descripciones no core como descuentos, exhibiciones, obsequios o promocionales.",
      formula:
        "Una fila es no core si su descripcion hace match con DESC, EXHIBICION, OBSEQUIO, PROMOCION o PROMOCIONALES.",
      dataSource:
        "Se calcula desde `calidad.tasaLineasNoCore` usando el matcher de texto definido en el pipeline sobre la descripcion del articulo.",
      example:
        `${formatNumber(calidad.tasaLineasNoCore.rows)} filas no core equivalen a ${formatPercent(calidad.tasaLineasNoCore.shareRows)} del archivo y ${formatCompactCurrency(calidad.tasaLineasNoCore.ventas)} en ventas absolutas.`,
      rationale:
        "Sirve para estimar cuanto ruido comercial puede haber en la fotografia si se mezcla producto regular con lineas promocionales o de exhibicion.",
    },
    filas_anomalias: {
      title: "Filas anomalias",
      definition:
        "Identifica filas que parecen inconsistentes entre ventas y piezas.",
      formula:
        "Se marcan dos casos: venta positiva con cero piezas, o venta casi cero con piezas positivas.",
      dataSource:
        "Proviene de `calidad.filasAnomalas`, calculado directamente sobre cada fila del Excel.",
      example:
        `${formatNumber(calidad.filasAnomalas.totalFlaggedRows)} filas marcadas (${formatPercent(calidad.filasAnomalas.shareRows)}). De ellas, ${formatNumber(calidad.filasAnomalas.positiveSalesZeroUnits)} son venta positiva con cero piezas y ${formatNumber(calidad.filasAnomalas.nearZeroSalesPositiveUnits)} son venta casi cero con piezas positivas.`,
      rationale:
        "Ayuda a detectar errores de captura o mapping que pueden sesgar tickets, shares y productividad.",
    },
    cobertura_mapa: {
      title: "Cobertura mapa",
      definition:
        "Mide que porcentaje de tiendas activas Spring Air puede ser mostrado en el mapa por tener coordenadas cargadas.",
      formula:
        "Cobertura mapa = tiendas activas con coordenadas / tiendas activas Spring Air",
      dataSource:
        "Proviene de `calidad.coberturaMapa`, cruzando tiendas activas Spring Air contra el archivo local de coordenadas.",
      example:
        `${formatNumber(calidad.coberturaMapa.storesWithCoordinates)} / ${formatNumber(calidad.coberturaMapa.springActiveStores)} = ${formatPercent(calidad.coberturaMapa.coverage)}`,
      rationale:
        "Sirve para saber cuan representativo es el mapa frente al universo real de tiendas activas.",
    },
  };
}

export function AnalyticsPanel({
  mediciones,
  calidad,
}: Pick<DashboardData, "mediciones" | "calidad">) {
  const current: MeasurementSuite = mediciones.raw;
  const promoterMock = useMemo(() => buildMockPromoterCoverage(current), [current]);
  const [activeHelpKey, setActiveHelpKey] = useState<AnalyticsHelpKey | null>(null);
  const [returnFocusTo, setReturnFocusTo] = useState<HTMLElement | null>(null);
  const familyIndexValues = current.indicePrecio.payload.familias.map((row) => row.indexVsMarket);
  const avgFamilyIndex =
    familyIndexValues.length > 0
      ? familyIndexValues.reduce((total, value) => total + value, 0) / familyIndexValues.length
      : 0;
  const helpRegistry = useMemo(
    () => buildHelpRegistry(current, calidad, avgFamilyIndex),
    [avgFamilyIndex, calidad, current],
  );

  const openHelp = (key: AnalyticsHelpKey) => (trigger: HTMLElement) => {
    setReturnFocusTo(trigger);
    setActiveHelpKey(key);
  };

  const closeHelp = () => {
    setActiveHelpKey(null);
  };

  return (
    <>
      <section className="space-y-12">
      <SectionLead
        eyebrow="Analitica"
        title="Nueva capa de medicion comercial"
        description="Esta vista muestra la fotografia completa del archivo raw: cobertura, oportunidad, surtido, precio y calidad del dato sin aplicar depuracion comercial."
      />

      <div className="rounded-[2rem] border border-slate-100 bg-slate-950 px-6 py-5 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Base activa</p>
          <HelpTrigger label="Abrir ayuda para Base activa" onOpen={openHelp("base_activa")} />
        </div>
        <p className="mt-2 text-lg font-semibold">Raw</p>
        <p className="mt-1 text-sm text-slate-300">
          Incluye devoluciones, exhibiciones, descuentos, obsequios, promocionales y capturas anomalas tal como vienen en el archivo.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        <MetricCard
          label="Distribucion numerica"
          value={formatPercent(current.distribucion.payload.distribucionNumerica)}
          helper={`${formatNumber(current.distribucion.payload.springStores)} de ${formatNumber(current.distribucion.payload.marketStores)} tiendas`}
          onHelp={openHelp("distribucion_numerica")}
        />
        <MetricCard
          label="Distribucion ponderada"
          value={formatPercent(current.distribucion.payload.distribucionPonderada)}
          helper={`Cobertura de ${formatCompactCurrency(current.distribucion.payload.coveredMarketSales)}`}
          onHelp={openHelp("distribucion_ponderada")}
        />
        <MetricCard
          label="Share objetivo por tienda"
          value={formatPercent(current.oportunidadTiendas.payload.shareObjetivo)}
          helper={`Mediana mercado ${formatCompactCurrency(current.oportunidadTiendas.payload.marketMedian)}`}
          onHelp={openHelp("share_objetivo_tienda")}
        />
        <MetricCard
          label="Indice promedio de precio"
          value={`${avgFamilyIndex.toFixed(2)}x`}
          helper="Promedio simple de familias vs mercado"
          onHelp={openHelp("indice_promedio_precio")}
        />
      </div>

      <section className="space-y-8">
        <SectionLead
          eyebrow="Cobertura"
          title="Cobertura y oportunidad"
          description="La prioridad es detectar donde Spring Air ya esta presente, donde aun no captura valor suficiente y cuales tiendas deberian entrar al radar comercial."
        />

        <BarChartCard
          title="Top 10 tiendas por oportunidad no capturada"
          rows={current.oportunidadTiendas.payload.rows.map((row) => ({
            label: row.tienda,
            value: row.oportunidadVenta,
            highlight: row.shareActual < 0.03,
          }))}
          color="#2563eb"
          highlightColor="#dc2626"
          onInfoClick={openHelp("top_oportunidad_chart")}
          infoLabel="Abrir ayuda para Top 10 tiendas por oportunidad no capturada"
        />

        <section className="rounded-[2rem] border border-amber-100 bg-amber-50/70 p-6 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-700">Supuesto comercial</p>
          <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h4 className="text-2xl font-bold tracking-tight text-slate-900">Promotoria supuesta en Sears</h4>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-700">
                Como todavia no existe la base real de promotores, esta capa es un mock de trabajo. Asumimos
                promotoria en tiendas benchmark de share y en plazas fisicas con venta Spring relevante.
              </p>
            </div>
            <StatusBadge tone="mixed" label="Mock de negocio, no dato real" />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            <SupportStat
              label="Tiendas con promotoria supuesta"
              value={formatNumber(promoterMock.rows.length)}
            />
            <SupportStat
              label="Oportunidad con promotoria"
              value={formatCompactCurrency(
                promoterMock.opportunityWithPromoter.reduce((sum, row) => sum + row.oportunidadVenta, 0),
              )}
            />
            <SupportStat
              label="Oportunidad sin promotoria"
              value={formatCompactCurrency(
                promoterMock.opportunityWithoutPromoter.reduce((sum, row) => sum + row.oportunidadVenta, 0),
              )}
            />
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-amber-200 bg-white/80 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-700">Criterio mock</p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Se asume promotoria en tiendas fisicas con alto desempeno de marca: benchmark de share o plazas con
              venta Spring relevante y presencia comercial visible. `Internet` queda fuera por ser canal digital.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {promoterMock.rows.map((row) => (
                <span
                  key={row.tienda}
                  className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                  title={row.reason}
                >
                  {shortStoreLabel(row.tienda)}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-[1.75rem] border border-blue-100 bg-blue-50/70 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-500">Como leer la primera tabla</p>
            <h4 className="mt-3 text-lg font-bold tracking-tight text-slate-900">Detalle de oportunidad por tienda</h4>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Muestra las tiendas con mayor venta potencial a capturar. El orden lo define la oportunidad en pesos:
              donde el mercado es grande y Spring Air todavia esta por debajo del share objetivo.
            </p>
          </article>
          <article className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50/70 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-600">Como leer la segunda tabla</p>
            <h4 className="mt-3 text-lg font-bold tracking-tight text-slate-900">Tiendas blancas priorizadas</h4>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Es un filtro mas exigente: solo deja tiendas con mercado relevante y con participacion Spring Air menor
              a 3%. Sirve para detectar plazas donde la marca casi no existe y deberia activarse cobertura.
            </p>
          </article>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <MiniTable
            title="Detalle de oportunidad por tienda"
            onHelp={openHelp("detalle_oportunidad_table")}
            headers={["Tienda", "Promotoria mock", "Mercado", "Spring", "Share actual", "Gap", "Oportunidad"]}
            rows={current.oportunidadTiendas.payload.rows.map((row) => [
              row.tienda,
              promoterMock.coveredStores.has(row.tienda) ? (
                <StatusBadge tone="yes" label="Si" />
              ) : (
                <StatusBadge tone="no" label="No" />
              ),
              formatCurrency(row.ventasMercado),
              formatCurrency(row.ventasSpring),
              formatPercent(row.shareActual),
              formatPercent(row.gapShare),
              formatCurrency(row.oportunidadVenta),
            ])}
          />
          <MiniTable
            title="Tiendas blancas priorizadas"
            onHelp={openHelp("tiendas_blancas_table")}
            headers={["Tienda blanca", "Promotoria mock", "Mercado", "Spring", "Share actual", "Oportunidad"]}
            rows={current.tiendasBlancas.payload.rows.map((row) => [
              row.tienda,
              promoterMock.coveredStores.has(row.tienda) ? (
                <StatusBadge tone="yes" label="Si" />
              ) : (
                <StatusBadge tone="no" label="No" />
              ),
              formatCurrency(row.ventasMercado),
              formatCurrency(row.ventasSpring),
              formatPercent(row.shareActual),
              formatCurrency(row.oportunidadVenta),
            ])}
          />
        </div>

        <MapPanel
          stores={current.mapaOportunidad.payload}
          eyebrow="Mapa analitico"
          title="Oportunidad comercial y espacios blancos"
          onInfoClick={openHelp("mapa_oportunidad")}
          infoLabel="Abrir ayuda para Oportunidad comercial y espacios blancos"
          note={`Base ${current.mapaOportunidad.base}: ${formatNumber(
            current.tiendasBlancas.payload.rows.length,
          )} tiendas blancas y ${formatNumber(current.oportunidadTiendas.payload.rows.length)} focos de oportunidad priorizados.`}
        />
      </section>

      <section className="space-y-8">
        <SectionLead
          eyebrow="Surtido"
          title="Surtido y productividad"
          description="La lectura combina concentracion del portafolio, productividad por SKU y alertas de eficiencia para encontrar que expandir, que defender y que revisar."
        />

        <div className="grid gap-6 xl:grid-cols-3">
          <MetricCard
            label="Top 5 SKUs"
            value={formatPercent(current.concentracionPortafolio.payload.top5SkusShare)}
            helper="Peso del surtido ganador"
            onHelp={openHelp("top5_skus")}
          />
          <MetricCard
            label="Long tail de SKUs"
            value={formatPercent(current.concentracionPortafolio.payload.longTailSkusShare)}
            helper="Peso fuera del top 10"
            onHelp={openHelp("long_tail_skus")}
          />
          <MetricCard
            label="Dependencia top SKU"
            value={formatPercent(current.riesgoDependencia.payload.topSkuShare)}
            helper="Participacion del SKU lider"
            onHelp={openHelp("dependencia_top_sku")}
          />
        </div>

        <BarChartCard
          title="Top 10 SKUs por ventas por tienda"
          rows={current.productividadSku.payload.map((row) => ({
            label: row.descripcion.length > 26 ? `${row.descripcion.slice(0, 26)}...` : row.descripcion,
            value: row.ventasPorTienda,
          }))}
          color="#0f6cbd"
          onInfoClick={openHelp("productividad_chart")}
          infoLabel="Abrir ayuda para Top 10 SKUs por ventas por tienda"
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <MiniTable
            title="Productividad del surtido"
            onHelp={openHelp("productividad_table")}
            headers={["SKU", "Familia", "Ventas/Tienda", "Dias", "Share Spring"]}
            rows={current.productividadSku.payload.map((row) => [
              row.descripcion,
              row.familia,
              formatCurrency(row.ventasPorTienda),
              formatNumber(row.diasConVenta),
              formatPercent(row.shareSpring),
            ])}
          />
          <MiniTable
            title="Alertas de eficiencia"
            onHelp={openHelp("eficiencia_table")}
            headers={["SKU", "Segmento", "Tiendas", "Ventas/Tienda"]}
            rows={[
              ...current.eficienciaSurtido.payload.altaDistribucionBajaVelocidad.map((row) => [
                row.descripcion,
                "Alta dist / baja vel",
                formatNumber(row.tiendas),
                formatCurrency(row.ventasPorTienda),
              ]),
              ...current.eficienciaSurtido.payload.bajaDistribucionAltaVelocidad.map((row) => [
                row.descripcion,
                "Baja dist / alta vel",
                formatNumber(row.tiendas),
                formatCurrency(row.ventasPorTienda),
              ]),
            ].slice(0, 12)}
          />
        </div>
      </section>

      <section className="space-y-8">
        <SectionLead
          eyebrow="Precio"
          title="Precio y posicionamiento"
          description="El objetivo es leer si Spring Air esta jugando arriba, abajo o en linea con el mercado y con el lider en tienda, familia y SKU."
        />

        <BarChartCard
          title="Mix de precio Spring Air por banda"
          rows={current.mixPrecio.payload.map((row) => ({
            label: row.label,
            value: row.ventas,
          }))}
          color="#0f172a"
          onInfoClick={openHelp("mix_precio_chart")}
          infoLabel="Abrir ayuda para Mix de precio Spring Air por banda"
        />

        <div className="grid gap-6 xl:grid-cols-3">
          <MiniTable
            title="Indice de precio por tienda"
            onHelp={openHelp("indice_tienda_table")}
            headers={["Tienda", "Spring", "Mercado", "Indice vs mercado"]}
            rows={current.indicePrecio.payload.tiendas.map((row) => [
              row.nombre,
              formatCurrency(row.springTicket),
              formatCurrency(row.marketTicket),
              `${row.indexVsMarket.toFixed(2)}x`,
            ])}
          />
          <MiniTable
            title="Indice de precio por familia"
            onHelp={openHelp("indice_familia_table")}
            headers={["Familia", "Spring", "Lider", "Indice vs lider"]}
            rows={current.indicePrecio.payload.familias.map((row) => [
              row.nombre,
              formatCurrency(row.springTicket),
              formatCurrency(row.leaderTicket),
              `${row.indexVsLeader.toFixed(2)}x`,
            ])}
          />
          <MiniTable
            title="Indice de precio por SKU"
            onHelp={openHelp("indice_sku_table")}
            headers={["SKU", "Spring", "Mercado", "Indice vs mercado"]}
            rows={current.indicePrecio.payload.skus.map((row) => [
              row.nombre,
              formatCurrency(row.springTicket),
              formatCurrency(row.marketTicket),
              `${row.indexVsMarket.toFixed(2)}x`,
            ])}
          />
        </div>
      </section>

      <section className="space-y-8">
        <SectionLead
          eyebrow="Calidad"
          title="Calidad de dato y lectura operativa"
          description="Estas tarjetas no corrigen la data por si mismas, pero te dicen cuanta de la fotografia puede estar afectada por devoluciones, lineas no core o capturas anomales."
        />

        <div className="grid gap-6 xl:grid-cols-4">
          <MetricCard
            label="Devoluciones"
            value={formatPercent(calidad.tasaDevoluciones.shareRows)}
            helper={`${formatNumber(calidad.tasaDevoluciones.rows)} filas y ${formatCompactCurrency(calidad.tasaDevoluciones.ventas)}`}
            onHelp={openHelp("devoluciones")}
          />
          <MetricCard
            label="Lineas no core"
            value={formatPercent(calidad.tasaLineasNoCore.shareRows)}
            helper={`${formatNumber(calidad.tasaLineasNoCore.rows)} filas y ${formatCompactCurrency(calidad.tasaLineasNoCore.ventas)}`}
            onHelp={openHelp("lineas_no_core")}
          />
          <MetricCard
            label="Filas anomalias"
            value={formatPercent(calidad.filasAnomalas.shareRows)}
            helper={`${formatNumber(calidad.filasAnomalas.totalFlaggedRows)} filas marcadas`}
            onHelp={openHelp("filas_anomalias")}
          />
          <MetricCard
            label="Cobertura mapa"
            value={formatPercent(calidad.coberturaMapa.coverage)}
            helper={`${formatNumber(calidad.coberturaMapa.storesWithCoordinates)} de ${formatNumber(calidad.coberturaMapa.springActiveStores)} tiendas`}
            onHelp={openHelp("cobertura_mapa")}
          />
        </div>
      </section>

      <AnalyticsHelpModal
        open={activeHelpKey !== null}
        content={activeHelpKey ? helpRegistry[activeHelpKey] : null}
        onClose={closeHelp}
        returnFocusTo={returnFocusTo}
      />
    </section>
    </>
  );
}
