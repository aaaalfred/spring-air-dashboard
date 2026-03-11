"use client";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

import { formatCurrency, formatNumber } from "@/lib/dashboard/format";
import type { MapStore } from "@/lib/dashboard/types";

function getMarkerColor(ventas: number) {
  if (ventas > 400000) return "#0d8a68";
  if (ventas > 300000) return "#0f6cbd";
  if (ventas > 200000) return "#ef7d32";
  return "#8b98a8";
}

function getMarkerRadius(ventas: number) {
  if (ventas > 400000) return 14;
  if (ventas > 300000) return 12;
  if (ventas > 200000) return 10;
  return 8;
}

export function LeafletMap({ stores }: { stores: MapStore[] }) {
  return (
    <MapContainer center={[23.6345, -102.5528]} zoom={5} scrollWheelZoom={false} className="h-[420px] w-full rounded-[22px]">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {stores.map((store) => (
        <CircleMarker
          key={store.tienda}
          center={[store.lat, store.lon]}
          radius={getMarkerRadius(store.ventas)}
          pathOptions={{
            color: "#fff",
            weight: 2,
            fillColor: getMarkerColor(store.ventas),
            fillOpacity: 0.92,
          }}
        >
          <Popup>
            <div className="min-w-[180px]">
              <h4 className="font-semibold text-slate-900">{store.tienda}</h4>
              <p className="text-sm text-slate-600">Ventas: {formatCurrency(store.ventas)}</p>
              <p className="text-sm text-slate-600">Piezas: {formatNumber(store.piezas)}</p>
              <p className="text-sm text-slate-600">Ticket: {formatCurrency(store.ticketPromedio)}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

