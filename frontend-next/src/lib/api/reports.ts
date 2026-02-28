import { apiGet, apiPost } from "./client";
import type { Report, ReportGenerateRequest } from "../types/api";
import { API_BASE } from "./client";

export async function generateReport(
  request: ReportGenerateRequest
): Promise<Report> {
  return apiPost("/reports/generate", request);
}

export async function getReports(): Promise<{
  reports: Report[];
  total: number;
}> {
  return apiGet("/reports");
}

export function getExcelExportUrl(): string {
  return `${API_BASE}/reports/export/excel`;
}
