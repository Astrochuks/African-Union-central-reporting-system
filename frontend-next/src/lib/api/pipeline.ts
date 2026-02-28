import { apiGet, apiPost } from "./client";
import type { PipelineStatus, DataSource } from "../types/api";

export async function triggerPipeline(
  params?: { indicators?: string[]; countries?: string[] }
): Promise<{ message: string; status: string }> {
  return apiPost("/pipeline/trigger", params);
}

export async function seedDatabase(): Promise<{
  status: string;
  regions: number;
  aspirations: number;
  goals: number;
  member_states: number;
  indicators: number;
}> {
  return apiPost("/pipeline/seed");
}

export async function getPipelineStatus(): Promise<PipelineStatus> {
  return apiGet("/pipeline/status");
}

export async function getDataSources(): Promise<{ sources: DataSource[] }> {
  return apiGet("/pipeline/sources");
}
