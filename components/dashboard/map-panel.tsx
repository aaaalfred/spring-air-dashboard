"use client";

import dynamic from "next/dynamic";

import type { MapStore } from "@/lib/dashboard/types";

const DynamicLeafletMap = dynamic(
  () => import("@/components/dashboard/leaflet-map").then((module) => module.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center rounded-[22px] border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        Cargando mapa...
      </div>
    ),
  },
);

export function MapPanel({
  stores,
  note,
  eyebrow = "Mapa",
  title = "Cobertura de tiendas Spring Air",
  infoTooltip,
  onInfoClick,
  infoLabel,
}: {
  stores: MapStore[];
  note: string;
  eyebrow?: string;
  title?: string;
  infoTooltip?: string;
  onInfoClick?: (trigger: HTMLElement) => void;
  infoLabel?: string;
}) {
  return (
    <section className="rounded-[2.5rem] border border-slate-100 bg-white p-10 shadow-sm">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-slate-400">{eyebrow}</p>
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
        <p className="max-w-xl text-sm text-slate-500">{note}</p>
      </div>

      {stores.length > 0 ? (
        <DynamicLeafletMap stores={stores} />
      ) : (
        <div className="flex h-[420px] items-center justify-center rounded-[22px] border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
          No hay tiendas con coordenadas disponibles todavia.
        </div>
      )}
    </section>
  );
}
