"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompactCurrency } from "@/lib/dashboard/format";
import type { DailyPoint } from "@/lib/dashboard/types";

interface LineChartCardProps {
  title: string;
  rows: DailyPoint[];
}

export function LineChartCard({ title, rows }: LineChartCardProps) {
  return (
    <section className="rounded-[2.5rem] border border-slate-100 bg-white p-10 shadow-sm">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-slate-400">Tendencia actual</p>
        <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{title}</h3>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(15, 23, 42, 0.06)" vertical={false} />
            <XAxis dataKey="dia" stroke="#94a3b8" />
            <YAxis tickFormatter={(value) => formatCompactCurrency(Number(value))} stroke="#94a3b8" />
            <Tooltip
              formatter={(value) => formatCompactCurrency(Number(value ?? 0))}
              labelFormatter={(value) => `Dia ${value}`}
              contentStyle={{
                borderRadius: "22px",
                border: "1px solid rgba(148, 163, 184, 0.18)",
                boxShadow: "0 16px 28px rgba(15, 23, 42, 0.1)",
              }}
            />
            <Area
              type="monotone"
              dataKey="ventas"
              stroke="#2563eb"
              strokeWidth={3}
              fill="url(#salesFill)"
              name="Ventas"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
