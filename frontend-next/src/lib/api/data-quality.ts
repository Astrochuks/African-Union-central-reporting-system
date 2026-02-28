import { apiGet, apiPost } from "./client";
import type {
  DataQualityOverview,
  DataQualityCountryScore,
} from "../types/api";

export async function getDataQualityOverview(): Promise<DataQualityOverview> {
  return apiGet("/data-quality/overview");
}

export async function getDataQualityByCountry(): Promise<{
  scores: DataQualityCountryScore[];
}> {
  return apiGet("/data-quality/by-country");
}

export async function assessDataQuality(): Promise<{
  total_scores: number;
  status: string;
}> {
  return apiPost("/data-quality/assess");
}
