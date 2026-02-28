import { apiGet } from "./client";
import type {
  Goal,
  GoalDetail,
  GoalProgress,
  GoalRegionalBreakdown,
  Insight,
} from "../types/api";

export async function getGoals(): Promise<{ goals: Goal[]; total: number }> {
  return apiGet("/goals");
}

export async function getGoal(id: number): Promise<GoalDetail> {
  return apiGet(`/goals/${id}`);
}

export async function getGoalProgress(id: number): Promise<GoalProgress> {
  return apiGet(`/goals/${id}/progress`);
}

export async function getGoalByRegion(
  id: number
): Promise<GoalRegionalBreakdown> {
  return apiGet(`/goals/${id}/by-region`);
}

export async function getGoalInsights(
  id: number
): Promise<{ insights: Insight[]; total: number }> {
  return apiGet(`/goals/${id}/insights`);
}
