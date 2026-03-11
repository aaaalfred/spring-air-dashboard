"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompactCurrency, formatCurrency, formatNumber, formatPercent } from "@/lib/dashboard/format";
import type { HistoricalData } from "@/lib/dashboard/types";

function monthLabel(value: string) {
  const date = new Date(`${value}-01T00:00:00Z`);
  return new Intl.DateTimeFormat("es-MX", { month: "short", year: "2-digit", timeZone: "UTC" })
    .format(date)
    .replace(".", "");
}

function truncateLabel(value: string, size: number) {
  return value.length > size ? `${value.slice(0, size)}...` : value;
}

function HistoricalMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <article className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-slate-400">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </article>
  );
}

function HistoricalChartFrame({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm md:p-10">
      <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-slate-400">{eyebrow}</p>
      <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{title}</h3>
      <div className="mt-8 h-[340px]">{children}</div>
    </section>
  );
}

export function HistoricalPanel({ data }: { data: HistoricalData }) {
  const bestMonth = data.entries.reduce((best, current) => (current.ventas > best.ventas ? current : best), data.entries[0]);

  const salesSeries = data.entries.map((entry) => ({
    label: monthLabel(entry.mes),
    ventas: entry.ventas,
    piezas: entry.piezas,
  }));

  const shareSeries = data.entries.map((entry) => ({
    label: monthLabel(entry.mes),
    marketShare: entry.marketShare,
    ticketPromedio: entry.ticketPromedio,
  }));

  const topProductsSeries = data.entries.map((entry) => ({
    period: monthLabel(entry.mes),
    shortLabel: truncateLabel(entry.topProductos[0]?.nombre ?? "Sin dato", 18),
    fullLabel: entry.topProductos[0]?.nombre ?? "Sin dato",
    value: entry.topProductos[0]?.venta ?? 0,
    piezas: entry.topProductos[0]?.piezas ?? 0,
  }));

  const topStoresSeries = data.entries.map((entry) => ({
    period: monthLabel(entry.mes),
    shortLabel: truncateLabel(entry.topTiendas[0]?.nombre ?? "Sin dato", 18),
    fullLabel: entry.topTiendas[0]?.nombre ?? "Sin dato",
    value: entry.topTiendas[0]?.venta ?? 0,
    piezas: entry.topTiendas[0]?.piezas ?? 0,
  }));

  const cadence = data.entries.map((entry) => ({
    label: monthLabel(entry.mes),
    skusActivos: entry.skusActivos,
    tiendasActivas: entry.tiendasActivas,
  }));

  return (
    <section className="space-y-10">
      <div className="rounded-[2.8rem] border border-slate-100 bg-[linear-gradient(135deg,#0f172a_0%,#15294d_48%,#2563eb_100%)] p-10 text-white shadow-xl shadow-slate-950/10">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-200">Historico</p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">{data.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-200">{data.description}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.8rem] border border-white/10 bg-white/8 px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-100">Horizonte</p>
              <p className="mt-2 text-xl font-semibold">{data.months} meses</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-300">{data.periodLabel}</p>
            </div>
            <div className="rounded-[1.8rem] border border-white/10 bg-white/8 px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-100">Share promedio</p>
              <p className="mt-2 text-xl font-semibold">{formatPercent(data.metrics.marketSharePromedio)}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-300">seis cortes simulados</p>
            </div>
            <div className="rounded-[1.8rem] border border-white/10 bg-white/8 px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-100">Generado</p>
              <p className="mt-2 text-xl font-semibold">{monthLabel(data.entries[data.entries.length - 1].mes)}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-300">mock historico publicado</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-4">
        <HistoricalMetric
          label="Periodo analizado"
          value={`${data.months} meses`}
          helper={data.periodLabel}
        />
        <HistoricalMetric
          label="Crecimiento"
          value={`+${data.metrics.crecimientoVentas.toFixed(1)}%`}
          helper="vs primer mes"
        />
        <HistoricalMetric
          label="Promedio mensual"
          value={formatCompactCurrency(data.metrics.promedioMensualVentas)}
          helper={`${formatNumber(data.metrics.promedioMensualPiezas)} piezas por mes`}
        />
        <HistoricalMetric
          label="Mejor mes"
          value={monthLabel(bestMonth.mes)}
          helper={`${formatCurrency(bestMonth.ventas)} en ventas`}
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <HistoricalChartFrame eyebrow="Tendencia" title="Ventas mensuales Spring Air">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesSeries} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="historicalSalesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(15, 23, 42, 0.06)" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis tickFormatter={(value) => formatCompactCurrency(Number(value))} stroke="#94a3b8" />
              <Tooltip
                formatter={(value, name) =>
                  name === "ventas"
                    ? formatCurrency(Number(value ?? 0))
                    : `${formatNumber(Number(value ?? 0))} piezas`
                }
                labelFormatter={(value) => `Mes ${value}`}
                contentStyle={{
                  borderRadius: "22px",
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                  boxShadow: "0 16px 28px rgba(15, 23, 42, 0.1)",
                }}
              />
              <Area type="monotone" dataKey="ventas" stroke="#2563eb" strokeWidth={3} fill="url(#historicalSalesFill)" />
              <Line type="monotone" dataKey="piezas" stroke="#0f172a" strokeWidth={2.5} dot={{ r: 3 }} yAxisId={1} hide />
              <YAxis yAxisId={1} hide />
            </AreaChart>
          </ResponsiveContainer>
        </HistoricalChartFrame>

        <HistoricalChartFrame eyebrow="Share" title="Market share evolutivo">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={shareSeries} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(15, 23, 42, 0.06)" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis tickFormatter={(value) => `${value}%`} stroke="#94a3b8" domain={["dataMin - 0.4", "dataMax + 0.4"]} />
              <Tooltip
                formatter={(value, name) =>
                  name === "marketShare"
                    ? `${Number(value ?? 0).toFixed(2)}%`
                    : formatCurrency(Number(value ?? 0))
                }
                labelFormatter={(value) => `Mes ${value}`}
                contentStyle={{
                  borderRadius: "22px",
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                  boxShadow: "0 16px 28px rgba(15, 23, 42, 0.1)",
                }}
              />
              <Line type="monotone" dataKey="marketShare" stroke="#0f172a" strokeWidth={3} dot={{ r: 4, fill: "#0f172a" }} />
            </LineChart>
          </ResponsiveContainer>
        </HistoricalChartFrame>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <HistoricalChartFrame eyebrow="Productos" title="Comparativa mensual: producto top">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProductsSeries} margin={{ top: 10, right: 18, left: 0, bottom: 18 }}>
              <CartesianGrid stroke="rgba(15, 23, 42, 0.06)" vertical={false} />
              <XAxis dataKey="period" stroke="#94a3b8" />
              <YAxis tickFormatter={(value) => formatCompactCurrency(Number(value))} stroke="#94a3b8" />
              <Tooltip
                formatter={(value, _name, item) => [
                  `${formatCurrency(Number(value ?? 0))} · ${item.payload.piezas} piezas`,
                  item.payload.fullLabel,
                ]}
                labelFormatter={(value) => `Mes ${value}`}
                contentStyle={{
                  borderRadius: "22px",
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                  boxShadow: "0 16px 28px rgba(15, 23, 42, 0.1)",
                }}
              />
              <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                {topProductsSeries.map((row, index) => (
                  <Cell key={`${row.period}-${row.fullLabel}`} fill={index === topProductsSeries.length - 1 ? "#0f172a" : "#2563eb"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </HistoricalChartFrame>

        <HistoricalChartFrame eyebrow="Tiendas" title="Comparativa mensual: tienda top">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topStoresSeries} margin={{ top: 10, right: 18, left: 0, bottom: 18 }}>
              <CartesianGrid stroke="rgba(15, 23, 42, 0.06)" vertical={false} />
              <XAxis dataKey="period" stroke="#94a3b8" />
              <YAxis tickFormatter={(value) => formatCompactCurrency(Number(value))} stroke="#94a3b8" />
              <Tooltip
                formatter={(value, _name, item) => [
                  `${formatCurrency(Number(value ?? 0))} · ${item.payload.piezas} piezas`,
                  item.payload.fullLabel,
                ]}
                labelFormatter={(value) => `Mes ${value}`}
                contentStyle={{
                  borderRadius: "22px",
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                  boxShadow: "0 16px 28px rgba(15, 23, 42, 0.1)",
                }}
              />
              <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                {topStoresSeries.map((row, index) => (
                  <Cell key={`${row.period}-${row.fullLabel}`} fill={index === topStoresSeries.length - 1 ? "#1d4ed8" : "#7dd3fc"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </HistoricalChartFrame>
      </div>

      <section className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm md:p-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-slate-400">Cadencia</p>
          <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Cobertura y surtido por mes</h3>
          <div className="mt-8 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cadence} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(15, 23, 42, 0.06)" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  formatter={(value, name) => [formatNumber(Number(value ?? 0)), name === "skusActivos" ? "SKUs activos" : "Tiendas activas"]}
                  labelFormatter={(value) => `Mes ${value}`}
                  contentStyle={{
                    borderRadius: "22px",
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    boxShadow: "0 16px 28px rgba(15, 23, 42, 0.1)",
                  }}
                />
                <Line type="monotone" dataKey="skusActivos" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="tiendasActivas" stroke="#0f172a" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-slate-100 bg-slate-950 p-8 text-white shadow-xl shadow-slate-950/10 md:p-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-slate-500">Lectura rapida</p>
          <div className="mt-6 space-y-4">
            {data.entries.map((entry) => (
              <article key={entry.mes} className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">{monthLabel(entry.mes)}</h4>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{truncateLabel(entry.topProductos[0]?.nombre ?? "Sin dato", 34)}</p>
                  </div>
                  <span className="rounded-full bg-white/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200">
                    {formatPercent(entry.marketShare)}
                  </span>
                </div>
                <p className="mt-4 text-sm text-slate-200">
                  {formatCurrency(entry.ventas)} en ventas, {formatNumber(entry.piezas)} piezas y {entry.topTiendas[0]?.nombre ?? "Sin tienda top"} como plaza lider.
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
