import { apiGet } from "./client";
import type { DashboardSummary, HealthStatus } from "../types/api";

export async function getDashboard(): Promise<DashboardSummary> {
  return apiGet<DashboardSummary>("/dashboard/summary");
}

export async function getHealth(): Promise<HealthStatus> {
  return apiGet<HealthStatus>("/health");
}
