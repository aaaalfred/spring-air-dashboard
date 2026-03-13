"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompactCurrency } from "@/lib/dashboard/format";

interface ChartRow {
  label: string;
  value: number;
  highlight?: boolean;
}

interface BarChartCardProps {
  title: string;
  rows: ChartRow[];
  color?: string;
  highlightColor?: string;
  infoTooltip?: string;
  onInfoClick?: (trigger: HTMLElement) => void;
  infoLabel?: string;
}

export function BarChartCard({
  title,
  rows,
  color = "#2563eb",
  highlightColor = "#0f172a",
  infoTooltip,
  onInfoClick,
  infoLabel,
}: BarChartCardProps) {
  return (
    <section className="rounded-[2.5rem] border border-slate-100 bg-white p-10 shadow-sm">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-slate-400">Visual</p>
        <div className="mt-3 flex items-center gap-3">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h3>
          {onInfoClick ? (
            <button
              type="button"
              onClick={(event) => onInfoClick(event.currentTarget)}
              aria-label={infoLabel ?? `Abrir ayuda para ${title}`}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-xs font-bold text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            >
              i
            </button>
          ) : infoTooltip ? (
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-xs font-bold text-slate-500"
              title={infoTooltip}
              aria-label={infoTooltip}
            >
              i
            </span>
          ) : null}
        </div>
      </div>

      <div className="h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid stroke="rgba(15, 23, 42, 0.06)" horizontal={false} />
            <XAxis type="number" tickFormatter={(value) => formatCompactCurrency(Number(value))} stroke="#94a3b8" />
            <YAxis type="category" dataKey="label" stroke="#94a3b8" width={150} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => formatCompactCurrency(Number(value ?? 0))}
              cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
              contentStyle={{
                borderRadius: "22px",
                border: "1px solid rgba(148, 163, 184, 0.18)",
                boxShadow: "0 16px 28px rgba(15, 23, 42, 0.1)",
              }}
            />
            <Bar dataKey="value" radius={[0, 14, 14, 0]}>
              {rows.map((row) => (
                <Cell key={row.label} fill={row.highlight ? highlightColor : color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
