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

      <div className="mb-6 grid gap-3 rounded-[1.5rem] border border-slate-100 bg-slate-50/80 p-4 lg:grid-cols-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Color</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-red-600" aria-hidden="true" />
              Tienda blanca
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" aria-hidden="true" />
              Oportunidad
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" aria-hidden="true" />
              Tienda estandar
            </span>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Borde</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
              <span className="h-3 w-3 rounded-full border-[2.5px] border-emerald-900 bg-white" aria-hidden="true" />
              Con promotoria
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
              <span className="h-3 w-3 rounded-full border-2 border-white bg-slate-300" aria-hidden="true" />
              Sin promotoria
            </span>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Tamano</p>
          <p className="mt-3 text-xs leading-6 text-slate-500">
            El tamano del punto crece con el peso comercial de la tienda. En focos de oportunidad y tiendas blancas se
            basa en la oportunidad estimada; en tiendas estandar se apoya en ventas.
          </p>
        </div>
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
