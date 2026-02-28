import { apiGet } from "./client";
import type {
  Indicator,
  IndicatorTimeSeries,
  IndicatorRanking,
  IndicatorTrend,
} from "../types/api";

export async function getIndicators(
  goalId?: number
): Promise<{ indicators: Indicator[]; total: number }> {
  const q = goalId ? `?goal_id=${goalId}` : "";
  return apiGet(`/indicators${q}`);
}

export async function getIndicatorValues(
  id: number,
  country?: string
): Promise<IndicatorTimeSeries> {
  const q = country ? `?country=${country}` : "";
  return apiGet(`/indicators/${id}/values${q}`);
}

export async function getIndicatorRanking(
  id: number
): Promise<{ ranking: IndicatorRanking[] }> {
  return apiGet(`/indicators/${id}/ranking`);
}

export async function getIndicatorTrend(id: number): Promise<IndicatorTrend> {
  return apiGet(`/indicators/${id}/trend`);
}
