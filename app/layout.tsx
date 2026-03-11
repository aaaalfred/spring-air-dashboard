import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Spring Air BI Dashboard",
  description: "Dashboard MVP para visualizar el rendimiento de Spring Air con datos reales del Excel.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
