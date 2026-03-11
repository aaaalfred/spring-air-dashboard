import { promises as fs } from "fs";
import path from "path";

import type { DashboardData } from "@/lib/dashboard/types";

function assertClose(label: string, actual: number, expected: number, tolerance = 0.01) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label} fuera de rango. esperado=${expected} actual=${actual}`);
  }
}

async function main() {
  const filePath = path.join(process.cwd(), "public", "dashboard_data.json");
  const raw = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(raw) as DashboardData;

  assertClose("venta mercado", data.mercado.totalVenta, 86470767.16);
  assertClose("venta spring air", data.resumen.ventas, 7798512.52);
  assertClose("piezas spring air", data.resumen.piezas, 1047);
  assertClose("market share spring air", data.resumen.marketShare, 0.09018669286893376, 0.000001);

  if (data.competencia[0]?.proveedor !== "ARTABAN THERAPEDIC SA DE CV") {
    throw new Error("El top competidor esperado no coincide.");
  }

  if (data.productos[0]?.descripcion !== "COLCHON MATRIMONIAL THERAPY") {
    throw new Error("El top SKU esperado no coincide.");
  }

  if (data.tiendas[0]?.tienda !== "PACHUCA PLAZA Q") {
    throw new Error("La top tienda esperada no coincide.");
  }

  console.log("Validación completada correctamente");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

