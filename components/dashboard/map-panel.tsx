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

export function MapPanel({ stores, note }: { stores: MapStore[]; note: string }) {
  return (
    <section className="rounded-[2.5rem] border border-slate-100 bg-white p-10 shadow-sm">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-slate-400">Mapa</p>
          <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Cobertura de tiendas Spring Air</h3>
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
