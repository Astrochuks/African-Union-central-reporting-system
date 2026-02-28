import { apiPost } from "./client";

export async function submitFormData(
  entries: {
    country_iso: string;
    indicator_code: string;
    year: number;
    value: number;
  }[]
): Promise<{ status: string; records_inserted: number }> {
  return apiPost("/upload/form", { entries });
}
