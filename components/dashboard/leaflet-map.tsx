"use client";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

import { formatCurrency, formatNumber } from "@/lib/dashboard/format";
import type { MapStore } from "@/lib/dashboard/types";

function getMarkerColor(store: MapStore) {
  if (store.segment === "white_space") return "#dc2626";
  if (store.segment === "opportunity") return "#2563eb";
  return "#94a3b8";
}

function getMarkerStroke(store: MapStore) {
  return store.promotoria ? "#064e3b" : "#ffffff";
}

function getMarkerRadius(store: MapStore) {
  const reference = store.opportunity && store.opportunity > 0 ? store.opportunity : store.ventas;
  if (store.segment === "white_space") return 13;
  if (store.segment === "opportunity" && reference > 300000) return 14;
  if (reference > 400000) return 14;
  if (reference > 300000) return 12;
  if (reference > 200000) return 10;
  return 8;
}

export function LeafletMap({ stores }: { stores: MapStore[] }) {
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
          radius={getMarkerRadius(store)}
          pathOptions={{
            color: getMarkerStroke(store),
            weight: store.promotoria ? 3 : 2,
            fillColor: getMarkerColor(store),
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
