import { apiGet } from "./client";
import type {
  YouthOverview,
  YouthMetrics,
  YouthEmploymentRanking,
  YouthTrend,
} from "../types/api";

export async function getYouthOverview(): Promise<YouthOverview> {
  return apiGet("/youth/overview");
}

export async function getYouthByCountry(): Promise<{
  data: (YouthMetrics & {
    member_states: { name: string; iso_code: string; regions: { name: string } };
  })[];
  total: number;
}> {
  return apiGet("/youth/by-country");
}

export async function getYouthEmployment(): Promise<YouthEmploymentRanking> {
  return apiGet("/youth/employment");
}

export async function getYouthTrends(): Promise<{ trends: YouthTrend[] }> {
  return apiGet("/youth/trends");
}
