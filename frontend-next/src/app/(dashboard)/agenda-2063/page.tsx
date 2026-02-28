"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getGoals } from "@/lib/api/goals";
import { getProgressTextColor } from "@/lib/utils/format";
import type { Goal } from "@/lib/types/api";

function AgendaSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-24 rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function Agenda2063Page() {
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getGoals()
      .then((res) => {
        setGoals(res.goals);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-au-dark">Agenda 2063 Goals</h1>
        <Card className="p-6 border-l-4 border-l-severity-critical">
          <p className="text-sm text-severity-critical font-medium">Failed to load goals</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </Card>
      </div>
    );
  }

  if (!goals) return <AgendaSkeleton />;

  // Calculate average progress across all goals
  const goalsWithProgress = goals.filter((g) => g.current_progress != null);
  const avgProgress =
    goalsWithProgress.length > 0
      ? goalsWithProgress.reduce((sum, g) => sum + (g.current_progress || 0), 0) / goalsWithProgress.length
      : 0;

  // Group goals by aspiration
  const grouped = goals.reduce<Record<string, Goal[]>>((acc, goal) => {
    const aspiration = goal.aspiration_name || goal.aspirations?.name || `Aspiration ${goal.aspiration_id}`;
    if (!acc[aspiration]) acc[aspiration] = [];
    acc[aspiration].push(goal);
    return acc;
  }, {});

  function progressBarColor(value: number | undefined | null): string {
    if (value == null) return "";
    if (value >= 60) return "[&>div]:bg-au-green";
    if (value >= 30) return "[&>div]:bg-au-gold";
    return "[&>div]:bg-severity-critical";
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-au-dark">Agenda 2063 Goals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tracking Africa&apos;s strategic framework for inclusive growth and sustainable development
        </p>
      </div>

      {/* Summary Card */}
      <Card className="p-5 border-t-4 border-t-au-gold">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Goals Tracked</p>
            <p className="text-3xl font-bold text-au-dark">{total}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Average Progress</p>
            <p className={`text-3xl font-bold ${getProgressTextColor(avgProgress)}`}>
              {avgProgress.toFixed(1)}%
            </p>
          </div>
        </div>
      </Card>

      {/* Goals Table grouped by aspiration */}
      <div className="space-y-8">
        {Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([aspiration, aspirationGoals]) => (
            <div key={aspiration}>
              <h2 className="text-sm font-semibold text-au-gold uppercase tracking-wide mb-3">
                {aspiration}
              </h2>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground w-12">#</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Goal Name</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground w-48">Progress</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground w-28">Indicators</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aspirationGoals
                        .sort((a, b) => a.number - b.number)
                        .map((goal) => (
                          <tr
                            key={goal.id}
                            className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-4 py-3 font-semibold text-au-dark">{goal.number}</td>
                            <td className="px-4 py-3">
                              <Link
                                href={`/agenda-2063/${goal.id}`}
                                className="text-au-dark hover:text-au-green font-medium transition-colors"
                              >
                                {goal.name}
                              </Link>
                              {goal.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                  {goal.description}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={goal.current_progress ?? 0}
                                  className={`h-2 flex-1 ${progressBarColor(goal.current_progress)}`}
                                />
                                <span
                                  className={`text-xs font-medium w-10 text-right ${getProgressTextColor(goal.current_progress)}`}
                                >
                                  {goal.current_progress != null
                                    ? `${goal.current_progress.toFixed(0)}%`
                                    : "N/A"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-muted-foreground">
                              {goal.indicator_count ?? "-"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          ))}
      </div>
    </div>
  );
}
