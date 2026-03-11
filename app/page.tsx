import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";

export default async function Page() {
  const data = await getDashboardData();

  return <DashboardShell data={data} />;
}

