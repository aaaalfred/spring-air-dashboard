"use client";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

import { formatCurrency, formatNumber } from "@/lib/dashboard/format";
import type { MapStore } from "@/lib/dashboard/types";

function getMarkerColor(store: MapStore, mode: "analytics" | "spring-sales") {
  if (mode === "spring-sales") {
    return store.promotoria ? "#059669" : "#2563eb";
  }
  if (store.segment === "white_space") return "#dc2626";
  if (store.segment === "opportunity") return "#2563eb";
  return "#94a3b8";
}

function getMarkerStroke(store: MapStore) {
  return store.promotoria ? "#064e3b" : "#ffffff";
}

function getMarkerRadius(store: MapStore, mode: "analytics" | "spring-sales") {
  const reference = store.opportunity && store.opportunity > 0 ? store.opportunity : store.ventas;
  const baseBoost = mode === "spring-sales" ? 2 : 0;
  if (store.segment === "white_space") return 13;
  if (store.segment === "opportunity" && reference > 300000) return 14 + baseBoost;
  if (reference > 400000) return 14 + baseBoost;
  if (reference > 300000) return 12 + baseBoost;
  if (reference > 200000) return 10 + baseBoost;
  return 8 + baseBoost;
}

export function LeafletMap({
  stores,
  mode = "analytics",
}: {
  stores: MapStore[];
  mode?: "analytics" | "spring-sales";
}) {
  return (
    <MapContainer center={[23.6345, -102.5528]} zoom={5} scrollWheelZoom className="h-[420px] w-full rounded-[22px]">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {stores.map((store) => (
        <CircleMarker
          key={`${store.tienda}-${store.lat}-${store.lon}`}
          center={[store.lat, store.lon]}
          radius={getMarkerRadius(store, mode)}
          pathOptions={{
            color: getMarkerStroke(store),
            weight: store.promotoria ? 3 : 2,
            fillColor: getMarkerColor(store, mode),
            fillOpacity: 0.92,
          }}
        >
          <Popup>
            <div className="min-w-[180px]">
              <h4 className="font-semibold text-slate-900">{store.tienda}</h4>
              {store.determinante ? (
                <p className="text-sm text-slate-600">Determinante: {store.determinante}</p>
              ) : null}
              {store.tiendaFuente && store.tiendaFuente !== store.tienda ? (
                <p className="text-sm text-slate-600">Tienda fuente: {store.tiendaFuente}</p>
              ) : null}
              <p className="text-sm text-slate-600">Ventas: {formatCurrency(store.ventas)}</p>
              <p className="text-sm text-slate-600">Piezas: {formatNumber(store.piezas)}</p>
              <p className="text-sm text-slate-600">Ticket: {formatCurrency(store.ticketPromedio)}</p>
              <p className={`text-sm ${store.promotoria ? "text-emerald-700" : "text-slate-600"}`}>
                Promotoria: {store.promotoria ? "Si" : "No"}
              </p>
              {store.localizacion ? <p className="text-sm text-slate-600">Zona: {store.localizacion}</p> : null}
              {typeof store.shareDentroTienda === "number" ? (
                <p className="text-sm text-slate-600">Share tienda: {(store.shareDentroTienda * 100).toFixed(1)}%</p>
              ) : null}
              {typeof store.opportunity === "number" ? (
                <p className="text-sm text-slate-600">Oportunidad: {formatCurrency(store.opportunity)}</p>
              ) : null}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
