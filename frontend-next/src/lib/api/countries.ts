import { apiGet } from "./client";
import type {
  MemberState,
  CountryProfile,
  CountryScorecard,
} from "../types/api";

export async function getCountries(
  region?: string
): Promise<{ countries: MemberState[]; total: number }> {
  const q = region ? `?region=${region}` : "";
  return apiGet(`/countries${q}`);
}

export async function getCountryProfile(
  iso: string
): Promise<CountryProfile> {
  return apiGet(`/countries/${iso}/profile`);
}

export async function getCountryScorecard(
  iso: string
): Promise<CountryScorecard> {
  return apiGet(`/countries/${iso}/scorecard`);
}

export async function compareCountries(
  codes: string,
  indicator?: string
): Promise<{ comparison: unknown[] }> {
  const q = indicator
    ? `?countries=${codes}&indicator_code=${indicator}`
    : `?countries=${codes}`;
  return apiGet(`/countries/compare${q}`);
}
