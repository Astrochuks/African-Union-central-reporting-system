import { apiGet } from "./client";
import type { GenderOverview, GenderMetrics, GenderTrend } from "../types/api";

export async function getGenderOverview(): Promise<GenderOverview> {
  return apiGet("/gender/overview");
}

export async function getGenderByCountry(): Promise<{
  data: (GenderMetrics & {
    member_states: { name: string; iso_code: string; regions: { name: string } };
  })[];
  total: number;
}> {
  return apiGet("/gender/by-country");
}

export async function getGenderTrends(): Promise<{ trends: GenderTrend[] }> {
  return apiGet("/gender/trends");
}

export async function getGenderParity(): Promise<{
  ranking: {
    rank: number;
    country: string;
    iso_code: string;
    parity_index: number;
    year: number;
  }[];
}> {
  return apiGet("/gender/parity-index");
}
