import { apiGet, apiPost } from "./client";
import type { Insight, InsightsSummary } from "../types/api";

export async function getInsights(
  type?: string,
  severity?: string
): Promise<{ insights: Insight[]; total: number }> {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (severity) params.set("severity", severity);
  const q = params.toString() ? `?${params}` : "";
  return apiGet(`/insights${q}`);
}

export async function getLatestInsights(
  limit = 10
): Promise<{ insights: Insight[] }> {
  return apiGet(`/insights/latest?limit=${limit}`);
}

export async function getCriticalInsights(): Promise<{
  insights: Insight[];
  total: number;
}> {
  return apiGet("/insights/critical");
}

export async function getInsightsByGoal(
  goalId: number
): Promise<{ insights: Insight[]; total: number }> {
  return apiGet(`/insights/by-goal/${goalId}`);
}

export async function getInsightsSummary(): Promise<InsightsSummary> {
  return apiGet("/insights/summary");
}

export async function generateInsights(): Promise<{
  total_insights: number;
  by_type: Record<string, number>;
}> {
  return apiPost("/insights/generate");
}
