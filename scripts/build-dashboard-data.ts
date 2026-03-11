import { promises as fs } from "fs";
import path from "path";

import { buildDashboardData } from "@/lib/dashboard/transform";

async function main() {
  const excelPath = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : path.join(process.cwd(), "vta competencia.xlsx");
  const outputPath = path.join(process.cwd(), "public", "dashboard_data.json");
  const dashboardData = buildDashboardData(excelPath);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(dashboardData, null, 2)}\n`, "utf8");

  console.log("dashboard_data.json generado correctamente");
  console.log(`Periodo: ${dashboardData.periodo}`);
  console.log(`Spring Air ventas: ${dashboardData.resumen.ventas.toFixed(2)}`);
  console.log(`Market share: ${(dashboardData.resumen.marketShare * 100).toFixed(2)}%`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

