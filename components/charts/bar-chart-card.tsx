"use client";

import type { ReactNode } from "react";
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
  badgeLabel?: string;
}

interface LegendItem {
  label: string;
  color?: string;
  kind?: "dot" | "badge";
}

interface BarChartCardProps {
  title: string;
  rows: ChartRow[];
  color?: string;
  highlightColor?: string;
  infoTooltip?: string;
  onInfoClick?: (trigger: HTMLElement) => void;
  infoLabel?: string;
  legendItems?: LegendItem[];
  note?: ReactNode;
  yAxisWidth?: number;
}

export function BarChartCard({
  title,
  rows,
  color = "#2563eb",
  highlightColor = "#0f172a",
  infoTooltip,
  onInfoClick,
  infoLabel,
  legendItems,
  note,
  yAxisWidth = 150,
}: BarChartCardProps) {
  const hasRowBadges = rows.some((row) => row.badgeLabel);

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
        {legendItems?.length ? (
          <div className="mt-4 flex flex-wrap gap-3">
            {legendItems.map((item) =>
              item.kind === "badge" ? (
                <span
                  key={item.label}
                  className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
                >
                  {item.label}
                </span>
              ) : (
                <span key={item.label} className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color ?? color }}
                    aria-hidden="true"
                  />
                  {item.label}
                </span>
              ),
            )}
          </div>
        ) : null}
        {note ? <p className="mt-3 text-sm text-slate-500">{note}</p> : null}
      </div>

      <div className="h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid stroke="rgba(15, 23, 42, 0.06)" horizontal={false} />
            <XAxis type="number" tickFormatter={(value) => formatCompactCurrency(Number(value))} stroke="#94a3b8" />
            <YAxis
              type="category"
              dataKey="label"
              stroke="#94a3b8"
              width={yAxisWidth}
              tick={
                hasRowBadges
                  ? ({ x, y, payload }) => {
                      const row = rows.find((item) => item.label === payload.value);
                      const label = String(payload.value);
                      const badgeWidth = Math.max(52, Math.min(164, label.length * 6.6 + 18));

                      return (
                        <g transform={`translate(${x},${y})`}>
                          {row?.badgeLabel ? (
                            <g transform={`translate(${-badgeWidth - 10},-10)`}>
                              <rect
                                width={badgeWidth}
                                height="20"
                                rx="10"
                                fill="#fef3c7"
                                stroke="#f59e0b"
                                strokeWidth="1"
                              />
                              <text
                                x={badgeWidth / 2}
                                y="13"
                                textAnchor="middle"
                                fill="#b45309"
                                fontSize={10}
                                fontWeight={700}
                              >
                                {label}
                              </text>
                            </g>
                          ) : (
                            <text x={-10} y={4} textAnchor="end" fill="#94a3b8" fontSize={12}>
                              {label}
                            </text>
                          )}
                        </g>
                      );
                    }
                  : { fontSize: 12 }
              }
            />
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
