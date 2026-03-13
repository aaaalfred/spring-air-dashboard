"use client";

import { useDeferredValue, useState } from "react";
import clsx from "clsx";
import dynamic from "next/dynamic";

import { AnalyticsPanel } from "@/components/dashboard/analytics-panel";
import { HistoricalPanel } from "@/components/dashboard/historical-panel";
import { MapPanel } from "@/components/dashboard/map-panel";
import {
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/dashboard/format";
import type { DashboardData } from "@/lib/dashboard/types";

const BarChartCard = dynamic(
  () => import("@/components/charts/bar-chart-card").then((module) => module.BarChartCard),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center rounded-[2.5rem] border border-slate-100 bg-white text-sm text-slate-500 shadow-sm">
        Preparando visual...
      </div>
    ),
  },
);

const LineChartCard = dynamic(
  () => import("@/components/charts/line-chart-card").then((module) => module.LineChartCard),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center rounded-[2.5rem] border border-slate-100 bg-white text-sm text-slate-500 shadow-sm">
        Preparando visual...
      </div>
    ),
  },
);

const tabs = [
  { id: "resumen", label: "Resumen", icon: "grid" },
  { id: "analitica", label: "Analitica", icon: "target" },
  { id: "historico", label: "Historico", icon: "clock" },
  { id: "competencia", label: "Competencia", icon: "bars" },
  { id: "productos", label: "Productos", icon: "box" },
  { id: "skus", label: "SKUs", icon: "layers" },
  { id: "tiendas", label: "Tiendas", icon: "store" },
  { id: "mapa", label: "Mapa", icon: "pin" },
  { id: "insights", label: "Insights", icon: "spark" },
] as const;

type TabId = (typeof tabs)[number]["id"];
type IconName = (typeof tabs)[number]["icon"];

function NavIcon({ name }: { name: IconName }) {
  const common = "h-5 w-5";

  if (name === "clock") {
    return (
      <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === "bars") {
    return (
      <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M7 20V10m5 10V4m5 16v-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === "box") {
    return (
      <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === "layers") {
    return (
      <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M12 4l8 4-8 4-8-4 8-4zm0 8l8 4-8 4-8-4m8-4v8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === "store") {
    return (
      <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M3 9l2-4h14l2 4M5 10v8a1 1 0 001 1h12a1 1 0 001-1v-8M9 14h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === "pin") {
    return (
      <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === "spark") {
    return (
      <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === "target") {
    return (
      <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M12 4v2m0 12v2m8-8h-2M6 12H4m13.657-5.657l-1.414 1.414M7.757 16.243l-1.414 1.414m0-11.314l1.414 1.414m8.486 8.486l1.414 1.414" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3.5" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="7.5" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function HeroMetricCard({
  label,
  value,
  helper,
  progress,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  progress: number;
  tone: "blue" | "sky" | "slate" | "navy";
}) {
  const barClass =
    tone === "blue"
      ? "bg-blue-600"
      : tone === "sky"
        ? "bg-sky-400"
        : tone === "navy"
          ? "bg-slate-900"
          : "bg-slate-300";

  return (
    <article className="kpi-container rounded-[2rem] border border-slate-100 bg-white/50 p-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-slate-400">{label}</p>
      <div className="mt-5 flex items-end justify-between gap-3">
        <span className="text-4xl font-semibold tracking-tight text-slate-900">{value}</span>
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">{helper}</span>
      </div>
      <div className="mt-8 h-1 overflow-hidden rounded-full bg-slate-100">
        <div className={clsx("h-full rounded-full", barClass)} style={{ width: `${Math.max(8, Math.min(progress, 100))}%` }} />
      </div>
    </article>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-10">
      <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-300">{eyebrow}</p>
      <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
        <p className="max-w-3xl text-sm leading-7 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="data-table overflow-x-auto rounded-[2.2rem] border border-slate-100 bg-white shadow-sm">
      <table className="min-w-full text-left">
        <thead className="border-b border-slate-100 bg-slate-50/80">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-slate-100/80 transition-colors hover:bg-slate-50/60 last:border-b-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-6 py-4 text-sm text-slate-700">
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

function SpotlightItem({
  icon,
  title,
  subtitle,
  value,
}: {
  icon: "product" | "store" | "share";
  title: string;
  subtitle: string;
  value: string;
}) {
  const iconNode =
    icon === "product" ? (
      <svg className="h-5 w-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    ) : icon === "store" ? (
      <svg className="h-5 w-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M3 9l2-4h14l2 4M5 10v8a1 1 0 001 1h12a1 1 0 001-1v-8M9 14h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    ) : (
      <svg className="h-5 w-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M7 20V10m5 10V4m5 16v-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    );

  return (
    <div className="group flex items-center rounded-[1.8rem] border border-transparent p-6 transition-all hover:border-slate-100 hover:bg-white">
      <div className="mr-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-lg transition-colors group-hover:bg-blue-50">
        {iconNode}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-bold text-slate-800">{title}</h4>
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">{subtitle}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export function DashboardShell({ data }: { data: DashboardData }) {
  const [activeTab, setActiveTab] = useState<TabId>("resumen");
  const [skuSearch, setSkuSearch] = useState("");
  const [skuProvider, setSkuProvider] = useState("all");
  const deferredSkuSearch = useDeferredValue(skuSearch);
  const activeCompetition = data.competencia.slice(0, 5);
  const activeProducts = data.productos.slice(0, 10);
  const activeStores = data.tiendas.slice(0, 10);
  const topProduct = data.productos[0];
  const topStore = data.tiendas[0];
  const providerOptions = [...new Set(data.skus.map((row) => row.proveedor))].sort((left, right) =>
    left.localeCompare(right),
  );
  const normalizedSearch = deferredSkuSearch.trim().toLowerCase();
  const filteredSkus = data.skus.filter((row) => {
    const matchesProvider = skuProvider === "all" || row.proveedor === skuProvider;
    if (!matchesProvider) return false;
    if (!normalizedSearch) return true;

    return (
      row.proveedor.toLowerCase().includes(normalizedSearch) ||
      row.descripcion.toLowerCase().includes(normalizedSearch) ||
      String(row.interno ?? "").includes(normalizedSearch)
    );
  });
  const activeSkus = filteredSkus.slice(0, 10);

  return (
    <main className="flex h-screen overflow-hidden bg-[#fbfcfe] text-slate-700">
      <aside className="hidden h-full w-64 flex-col border-r border-slate-900 bg-slate-950 text-slate-400 xl:flex">
        <div className="px-10 pb-16 pt-10">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-600 text-sm font-bold text-white">S</div>
            <h1 className="text-lg font-bold tracking-tight text-white">Spring Air</h1>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border border-white/5 bg-white/5 text-blue-400"
                  : "text-slate-400 hover:text-slate-200",
              )}
            >
              <span className={clsx(activeTab === tab.id ? "opacity-100" : "opacity-40")}>
                <NavIcon name={tab.icon} />
              </span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-900 p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/5 bg-blue-900/40 text-[10px] font-bold text-blue-300">
              BI
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Analista Senior</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Configuracion</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 flex items-end justify-between gap-6 border-b border-transparent bg-[#fbfcfe]/90 px-6 pb-6 pt-10 backdrop-blur-md md:px-12">
          <div className="flex flex-col">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Panel de Control</h2>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
              Inteligencia corporativa * {data.periodo}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Mercado total</p>
              <p className="text-xl font-bold text-slate-900">{formatCompactCurrency(data.mercado.totalVenta)}</p>
            </div>
            <button
              type="button"
              className="rounded-full bg-blue-600 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white shadow-lg shadow-blue-600/10 transition hover:bg-blue-700"
            >
              Exportar resumen
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12">
          {activeTab === "resumen" && (
            <section className="space-y-14">
              <div className="grid gap-8 md:grid-cols-2 2xl:grid-cols-4">
                <HeroMetricCard
                  label="Ventas totales"
                  value={formatCompactCurrency(data.resumen.ventas)}
                  helper="Spring Air"
                  progress={75}
                  tone="blue"
                />
                <HeroMetricCard
                  label="Unidades vendidas"
                  value={formatNumber(data.resumen.piezas)}
                  helper={`Ticket prom. ${formatCurrency(data.resumen.ticketPromedio)}`}
                  progress={60}
                  tone="sky"
                />
                <HeroMetricCard
                  label="Cuota de mercado"
                  value={formatPercent(data.resumen.marketShare)}
                  helper={`Rank ${data.resumen.ranking}`}
                  progress={data.resumen.marketShare * 1000}
                  tone="slate"
                />
                <HeroMetricCard
                  label="Cobertura"
                  value={formatNumber(data.resumen.tiendasActivas)}
                  helper={`${formatNumber(data.resumen.skusActivos)} SKUs activos`}
                  progress={(data.resumen.tiendasActivas / Math.max(data.tiendas.length, 1)) * 100}
                  tone="navy"
                />
              </div>

              <section className="grid grid-cols-12 gap-10">
                <div className="col-span-12 space-y-6 xl:col-span-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800">Tendencia diaria de ventas</h3>
                    <div className="rounded-full bg-slate-100 p-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                      Mes actual
                    </div>
                  </div>
                  <LineChartCard title="Ventas diarias Spring Air" rows={data.series.springAir} />
                </div>

                <div className="col-span-12 xl:col-span-4">
                  <div className="flex h-full flex-col justify-between rounded-[2.5rem] bg-slate-950 p-10 text-white shadow-xl shadow-slate-950/10">
                    <div>
                      <h3 className="text-lg font-bold text-white">Participacion</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        Spring Air compite dentro de un mercado de {formatCompactCurrency(data.mercado.totalVenta)}.
                      </p>
                    </div>

                    <div className="mt-8 space-y-6">
                      {activeCompetition.map((row, index) => (
                        <div key={row.proveedor} className="space-y-3">
                          <div className="flex items-end justify-between gap-4">
                            <span className="text-xs font-medium text-slate-300">
                              {index + 1}. {row.proveedor}
                            </span>
                            <span className="text-sm font-bold">{formatPercent(row.marketShare)}</span>
                          </div>
                          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                              className={clsx(
                                "h-full rounded-full",
                                /SPRING AIR/i.test(row.proveedor) ? "bg-blue-500" : "bg-blue-300",
                              )}
                              style={{ width: `${Math.max(6, row.marketShare * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-8">
                      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                        Hoja {data.metadata.sourceSheet}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300">
                        Market share {formatPercent(data.resumen.marketShare)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="pb-8">
                <div className="mb-8 flex items-center gap-6">
                  <h3 className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.4em] text-slate-300">
                    En foco
                  </h3>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>

                <div className="grid gap-6 xl:grid-cols-3">
                  {topProduct && (
                    <SpotlightItem
                      icon="product"
                      title={topProduct.descripcion}
                      subtitle="Producto lider"
                      value={formatCurrency(topProduct.ventas)}
                    />
                  )}
                  {topStore && (
                    <SpotlightItem
                      icon="store"
                      title={topStore.tienda}
                      subtitle="Mejor tienda"
                      value={formatCurrency(topStore.ventas)}
                    />
                  )}
                  <SpotlightItem
                    icon="share"
                    title="Concentracion top 5 tiendas"
                    subtitle="Distribucion comercial"
                    value={formatPercent(data.concentracion.top5TiendasShare)}
                  />
                </div>
              </section>

              <section className="space-y-8">
                <div className="flex items-center gap-6">
                  <h3 className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.4em] text-slate-300">
                    Cobertura geografica
                  </h3>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>

                <MapPanel stores={data.mapa.tiendas} note={data.mapa.coverageNote} />
              </section>
            </section>
          )}

          {activeTab === "historico" && (
            data.historico.status === "mock_ready" ? (
              <HistoricalPanel data={data.historico} />
            ) : (
              <section>
                <SectionHeader
                  eyebrow="Historico"
                  title={data.historico.title}
                  description={data.historico.description}
                />
              </section>
            )
          )}

          {activeTab === "analitica" && <AnalyticsPanel mediciones={data.mediciones} calidad={data.calidad} />}

          {activeTab === "competencia" && (
            <section className="space-y-10">
              <SectionHeader
                eyebrow="Competencia"
                title="Quien domina el mercado y donde esta Spring Air"
                description="Comparativo de proveedores ordenado por venta neta, con Spring Air resaltado dentro del ranking."
              />

              <BarChartCard
                title="Top proveedores por venta neta"
                rows={data.competencia.slice(0, 10).map((row) => ({
                  label: row.proveedor.length > 24 ? `${row.proveedor.slice(0, 24)}...` : row.proveedor,
                  value: row.ventas,
                  highlight: /SPRING AIR/i.test(row.proveedor),
                }))}
              />

              <DataTable
                headers={["#", "Proveedor", "Ventas", "Share", "Piezas", "Ticket", "Tiendas", "SKUs"]}
                rows={data.competencia.slice(0, 10).map((row, index) => [
                  <span key="rank" className="font-semibold text-blue-600">
                    {index + 1}
                  </span>,
                  <span key="name" className={clsx(/SPRING AIR/i.test(row.proveedor) && "font-semibold text-blue-600")}>
                    {row.proveedor}
                  </span>,
                  formatCurrency(row.ventas),
                  formatPercent(row.marketShare),
                  formatNumber(row.piezas),
                  formatCurrency(row.ticketPromedio),
                  formatNumber(row.tiendasActivas),
                  formatNumber(row.skus),
                ])}
              />
            </section>
          )}

          {activeTab === "productos" && (
            <section className="space-y-10">
              <SectionHeader
                eyebrow="Productos"
                title="Portafolio Spring Air con venta real"
                description="La vista mantiene el tono editorial de la plantilla, pero sigue alimentada por el mismo contrato JSON del MVP."
              />

              <BarChartCard
                title="Top 10 SKUs por venta"
                rows={activeProducts.map((row) => ({
                  label: row.descripcion.length > 26 ? `${row.descripcion.slice(0, 26)}...` : row.descripcion,
                  value: row.ventas,
                }))}
                color="#2563eb"
              />

              <DataTable
                headers={["#", "SKU", "Descripcion", "Ventas", "Piezas", "Tiendas", "Ticket", "Share Spring"]}
                rows={data.productos.slice(0, 20).map((row, index) => [
                  <span key="rank" className="font-semibold text-blue-600">
                    {index + 1}
                  </span>,
                  row.interno ? formatNumber(row.interno) : "N/D",
                  row.descripcion,
                  formatCurrency(row.ventas),
                  formatNumber(row.piezas),
                  formatNumber(row.tiendas),
                  formatCurrency(row.ticketPromedio),
                  formatPercent(row.participacionSpring),
                ])}
              />
            </section>
          )}

          {activeTab === "skus" && (
            <section className="space-y-10">
              <SectionHeader
                eyebrow="SKUs"
                title="Catalogo completo del mercado por proveedor"
                description="Vista adicional para recorrer todos los SKUs del archivo actual, identificando el proveedor responsable y su peso dentro del mercado."
              />

              <section className="grid gap-4 rounded-[2.2rem] border border-slate-100 bg-white p-6 shadow-sm lg:grid-cols-[1.3fr_0.7fr_auto]">
                <label className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                    Buscar SKU, descripcion o proveedor
                  </span>
                  <input
                    type="text"
                    value={skuSearch}
                    onChange={(event) => setSkuSearch(event.target.value)}
                    placeholder="Ej. THERAPY, 5607059, SPRING AIR"
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                    Filtrar por proveedor
                  </span>
                  <select
                    value={skuProvider}
                    onChange={(event) => setSkuProvider(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
                  >
                    <option value="all">Todos los proveedores</option>
                    {providerOptions.map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex flex-col justify-end rounded-[1.8rem] bg-slate-50 px-5 py-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Resultados</span>
                  <span className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {formatNumber(filteredSkus.length)}
                  </span>
                </div>
              </section>

              <BarChartCard
                title="Top 10 SKUs del mercado por venta"
                rows={activeSkus.map((row) => ({
                  label: row.descripcion.length > 26 ? `${row.descripcion.slice(0, 26)}...` : row.descripcion,
                  value: row.ventas,
                  highlight: /SPRING AIR/i.test(row.proveedor),
                }))}
                color="#2563eb"
                highlightColor="#0f172a"
              />

              <DataTable
                headers={["#", "Proveedor", "SKU", "Descripcion", "Ventas", "Piezas", "Tiendas", "Ticket", "Share mercado"]}
                rows={filteredSkus.slice(0, 100).map((row, index) => [
                  <span key="rank" className="font-semibold text-blue-600">
                    {index + 1}
                  </span>,
                  <span key="provider" className={clsx(/SPRING AIR/i.test(row.proveedor) && "font-semibold text-blue-600")}>
                    {row.proveedor}
                  </span>,
                  row.interno ? formatNumber(row.interno) : "N/D",
                  row.descripcion,
                  formatCurrency(row.ventas),
                  formatNumber(row.piezas),
                  formatNumber(row.tiendas),
                  formatCurrency(row.ticketPromedio),
                  formatPercent(row.participacionMercado),
                ])}
              />
            </section>
          )}

          {activeTab === "tiendas" && (
            <section className="space-y-10">
              <SectionHeader
                eyebrow="Tiendas"
                title="Plazas que mas pesan para Spring Air"
                description="La tabla cruza venta, ticket y share dentro de tienda para encontrar volumen y fuerza relativa."
              />

              <BarChartCard
                title="Top 10 tiendas por venta Spring Air"
                rows={activeStores.map((row) => ({
                  label: row.tienda,
                  value: row.ventas,
                }))}
                color="#1d4ed8"
                highlightColor="#0f172a"
              />

              <DataTable
                headers={["#", "Tienda", "Ventas", "Piezas", "SKUs", "Ticket", "Share tienda", "Share Spring"]}
                rows={data.tiendas.slice(0, 20).map((row, index) => [
                  <span key="rank" className="font-semibold text-blue-600">
                    {index + 1}
                  </span>,
                  row.tienda,
                  formatCurrency(row.ventas),
                  formatNumber(row.piezas),
                  formatNumber(row.skus),
                  formatCurrency(row.ticketPromedio),
                  formatPercent(row.shareDentroTienda),
                  formatPercent(row.participacionSpring),
                ])}
              />
            </section>
          )}

          {activeTab === "mapa" && (
            <section>
              <SectionHeader
                eyebrow="Mapa"
                title="Cobertura geografica actual"
                description="El mapa conserva la fuente de coordenadas separada, pero ya vive dentro del lenguaje visual de la plantilla."
              />

              <MapPanel stores={data.mapa.tiendas} note={data.mapa.coverageNote} />
            </section>
          )}

          {activeTab === "insights" && (
            <section className="space-y-10">
              <SectionHeader
                eyebrow="Insights"
                title="Recomendaciones automaticas del periodo"
                description="Estas lecturas llegan precalculadas desde el pipeline de datos y ahora se presentan con un formato mas editorial y ejecutivo."
              />

              <div className="grid gap-8 xl:grid-cols-3">
                <HeroMetricCard
                  label="Top 20% de SKUs"
                  value={formatPercent(data.concentracion.top20PctSkusShare)}
                  helper="Concentracion"
                  progress={data.concentracion.top20PctSkusShare * 100}
                  tone="blue"
                />
                <HeroMetricCard
                  label="Top 10 SKUs"
                  value={formatPercent(data.concentracion.top10SkusShare)}
                  helper="Mix ganador"
                  progress={data.concentracion.top10SkusShare * 100}
                  tone="sky"
                />
                <HeroMetricCard
                  label="Top 5 tiendas"
                  value={formatPercent(data.concentracion.top5TiendasShare)}
                  helper="Concentracion comercial"
                  progress={data.concentracion.top5TiendasShare * 100}
                  tone="navy"
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                {data.insights.map((insight) => (
                  <article
                    key={insight.title}
                    className={clsx(
                      "rounded-[2.2rem] border bg-white p-8 shadow-sm",
                      insight.tone === "success" && "border-emerald-100",
                      insight.tone === "warning" && "border-amber-100",
                      insight.tone === "info" && "border-blue-100",
                    )}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">{insight.tone}</p>
                    <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{insight.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-slate-500">{insight.body}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
