"use client";

import { BarChartCard } from "@/components/charts/bar-chart-card";
import { formatCompactCurrency, formatCurrency, formatNumber, formatPercent } from "@/lib/dashboard/format";
import type { DashboardData, ParetoGroup } from "@/lib/dashboard/types";

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

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <article className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </article>
  );
}

function ParetoBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-500"
      }`}
    >
      {active ? "Dentro 80%" : "Resto"}
    </span>
  );
}

function ParetoTable({
  title,
  rows,
}: {
  title: string;
  rows: ParetoGroup["rows"];
}) {
  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
      <h4 className="text-lg font-bold tracking-tight text-slate-900">{title}</h4>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="border-b border-slate-100 bg-slate-50/80">
            <tr>
              {["#", "Elemento", "Ventas", "Share", "Acumulado", "Pareto"].map((header) => (
                <th key={header} className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 20).map((row) => (
              <tr key={row.id} className="border-b border-slate-100/80 last:border-b-0">
                <td className="px-4 py-3 text-sm font-semibold text-blue-600">{row.rank}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{row.label}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{formatCurrency(row.ventas)}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{formatPercent(row.share)}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{formatPercent(row.cumulativeShare)}</td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  <ParetoBadge active={row.within80} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function GroupSection({
  eyebrow,
  title,
  description,
  stores,
  skus,
  accentColor,
}: {
  eyebrow: string;
  title: string;
  description: string;
  stores: ParetoGroup;
  skus: ParetoGroup;
  accentColor: string;
}) {
  return (
    <section className="space-y-8">
      <SectionLead eyebrow={eyebrow} title={title} description={description} />

      <div className="grid gap-6 xl:grid-cols-4">
        <MetricCard
          label="Ventas totales"
          value={formatCompactCurrency(stores.totalVentas)}
          helper={`${formatNumber(stores.totalItems)} tiendas / ${formatNumber(skus.totalItems)} SKUs`}
        />
        <MetricCard
          label="Tiendas para 80%"
          value={formatNumber(stores.top80Count)}
          helper={`${formatPercent(stores.top80Share)} de ventas acumuladas`}
        />
        <MetricCard
          label="SKUs para 80%"
          value={formatNumber(skus.top80Count)}
          helper={`${formatPercent(skus.top80Share)} de ventas acumuladas`}
        />
        <MetricCard
          label="Ticket promedio"
          value={formatCurrency(stores.ticketPromedio)}
          helper={`Top tienda: ${stores.topItem ? stores.topItem.label : "N/D"}`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <BarChartCard
          title={`Top tiendas ${title}`}
          rows={stores.rows.slice(0, 10).map((row) => ({
            label: row.label,
            value: row.ventas,
            highlight: row.within80,
          }))}
          color={accentColor}
          highlightColor="#0f172a"
          legendItems={[{ label: "Dentro del 80%", color: "#0f172a" }, { label: "Resto top 10", color: accentColor }]}
          note="Las barras oscuras ya forman parte del grupo minimo de tiendas que acumula alrededor de 80% de las ventas."
        />
        <BarChartCard
          title={`Top SKUs ${title}`}
          rows={skus.rows.slice(0, 10).map((row) => ({
            label: row.label.length > 28 ? `${row.label.slice(0, 28)}...` : row.label,
            value: row.ventas,
            highlight: row.within80,
          }))}
          color={accentColor}
          highlightColor="#0f172a"
          legendItems={[{ label: "Dentro del 80%", color: "#0f172a" }, { label: "Resto top 10", color: accentColor }]}
          note="Esta vista muestra que tan concentrado esta el negocio en pocos SKUs y donde se apoya el volumen real."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ParetoTable title={`Pareto por tienda ${title}`} rows={stores.rows} />
        <ParetoTable title={`Pareto por SKU ${title}`} rows={skus.rows} />
      </div>
    </section>
  );
}

export function ParetoPanel({ data }: { data: DashboardData["pareto"] }) {
  return (
    <section className="space-y-14">
      <SectionLead
        eyebrow="80-20"
        title="Analisis Pareto de competencia y Spring Air"
        description="Esta vista identifica el grupo minimo de tiendas y SKUs que explica alrededor de 80% de las ventas. Sirve para entender concentracion, dependencias y donde realmente se sostiene el negocio."
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <MetricCard
          label="Competencia foco"
          value={data.competitor.provider}
          helper={`Proveedor ${data.competitor.providerId}`}
        />
        <MetricCard
          label="80-20 tiendas DK"
          value={formatNumber(data.competitor.stores.top80Count)}
          helper={`${formatPercent(data.competitor.stores.top80Share)} de ventas`}
        />
        <MetricCard
          label="80-20 tiendas Spring"
          value={formatNumber(data.spring.stores.top80Count)}
          helper={`${formatPercent(data.spring.stores.top80Share)} de ventas`}
        />
      </div>

      <GroupSection
        eyebrow="Competencia"
        title="Industria DK 2016187"
        description="Lectura de la competencia 2016187 a nivel tiendas y productos. El objetivo es detectar que tan concentrado esta su negocio y cuales puntos explican el mayor peso del periodo."
        stores={data.competitor.stores}
        skus={data.competitor.skus}
        accentColor="#2563eb"
      />

      <GroupSection
        eyebrow="Spring"
        title="Spring Air"
        description="El mismo corte 80-20 aplicado a Spring Air para comparar concentracion comercial, dependencia por SKU y dispersion de tiendas contra la competencia."
        stores={data.spring.stores}
        skus={data.spring.skus}
        accentColor="#0f6cbd"
      />
    </section>
  );
}
