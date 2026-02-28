"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { InsightCard } from "@/components/insights/insight-card";
import { getCountryProfile, getCountryScorecard } from "@/lib/api/countries";
import {
  formatNumber,
  formatCurrency,
  formatPercent,
  getProgressTextColor,
} from "@/lib/utils/format";
import type { CountryProfile, CountryScorecard, Insight } from "@/lib/types/api";

function CountryProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-36 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}

export default function CountryProfilePage() {
  const params = useParams();
  const iso = params.iso as string;

  const [profile, setProfile] = useState<CountryProfile | null>(null);
  const [scorecard, setScorecard] = useState<CountryScorecard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!iso) {
      setError("Invalid country code");
      return;
    }

    Promise.all([
      getCountryProfile(iso).catch(() => null),
      getCountryScorecard(iso).catch(() => null),
    ])
      .then(([prof, sc]) => {
        if (!prof) {
          setError("Country not found");
          return;
        }
        setProfile(prof);
        setScorecard(sc);
      })
      .catch((err) => setError(err.message));
  }, [iso]);

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-au-dark">Country Profile</h1>
        <Card className="p-6 border-l-4 border-l-severity-critical">
          <p className="text-sm text-severity-critical font-medium">Error loading country</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </Card>
      </div>
    );
  }

  if (!profile) return <CountryProfileSkeleton />;

  const { country, key_indicators, gender_metrics, youth_metrics } = profile;

  // Convert scorecard insights to Insight-compatible objects
  const scorecardInsights: Insight[] =
    scorecard?.insights?.map((si, idx) => ({
      id: idx,
      type: si.type,
      severity: si.severity,
      title: si.title,
      description: si.description,
      generated_at: new Date().toISOString(),
      is_active: true,
      included_in_report: false,
    })) ?? [];

  function progressBarColor(value: number | undefined | null): string {
    if (value == null) return "";
    if (value >= 60) return "[&>div]:bg-au-green";
    if (value >= 30) return "[&>div]:bg-au-gold";
    return "[&>div]:bg-severity-critical";
  }

  return (
    <div className="space-y-6">
      {/* Country Header */}
      <Card className="p-6 border-t-4 border-t-au-green">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-au-dark">{country.name}</h1>
              <Badge variant="outline" className="font-mono text-xs">
                {country.iso_code}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {country.region_name || country.regions?.name || "Africa"}
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Population</p>
              <p className="font-semibold text-au-dark">
                {country.population ? formatNumber(country.population, 0) : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">GDP per Capita</p>
              <p className="font-semibold text-au-dark">
                {country.gdp_per_capita ? formatCurrency(country.gdp_per_capita) : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">AU Member Since</p>
              <p className="font-semibold text-au-dark">
                {country.au_membership_year ?? "N/A"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Key Indicators Table */}
      <div>
        <h2 className="text-lg font-semibold text-au-dark mb-3">Key Indicators</h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Indicator</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Value</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Year</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Unit</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Goal</th>
                </tr>
              </thead>
              <tbody>
                {key_indicators.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      No indicator data available for this country.
                    </td>
                  </tr>
                ) : (
                  key_indicators.map((ind, idx) => (
                    <tr key={idx} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-au-dark">{ind.indicator}</td>
                      <td className="px-4 py-3 text-right font-semibold text-au-dark">
                        {formatNumber(ind.value)}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{ind.year}</td>
                      <td className="px-4 py-3 text-muted-foreground">{ind.unit ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{ind.goal ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Gender & Youth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gender Metrics */}
        <Card className="p-5 border-t-4 border-t-au-maroon">
          <h3 className="text-md font-semibold text-au-dark mb-4">Gender Metrics</h3>
          {gender_metrics ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Women in Parliament</span>
                <span className="font-semibold text-au-dark">
                  {formatPercent(gender_metrics.women_parliament_pct)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Gender Parity Index</span>
                <span className="font-semibold text-au-dark">
                  {gender_metrics.gender_parity_education?.toFixed(2) ?? "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Labor Force Participation</span>
                <span className="font-semibold text-au-dark">
                  {formatPercent(gender_metrics.women_labor_force_pct)}
                </span>
              </div>
              {gender_metrics.maternal_mortality_ratio != null && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Maternal Mortality</span>
                  <span className="font-semibold text-au-dark">
                    {formatNumber(gender_metrics.maternal_mortality_ratio, 0)} per 100k
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No gender data available.</p>
          )}
        </Card>

        {/* Youth Metrics */}
        <Card className="p-5 border-t-4 border-t-severity-neutral">
          <h3 className="text-md font-semibold text-au-dark mb-4">Youth Metrics</h3>
          {youth_metrics ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Youth Unemployment</span>
                <span className="font-semibold text-au-dark">
                  {formatPercent(youth_metrics.youth_unemployment_pct)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Secondary Enrollment</span>
                <span className="font-semibold text-au-dark">
                  {formatPercent(youth_metrics.secondary_enrollment_pct)}
                </span>
              </div>
              {youth_metrics.youth_literacy_pct != null && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Youth Literacy</span>
                  <span className="font-semibold text-au-dark">
                    {formatPercent(youth_metrics.youth_literacy_pct)}
                  </span>
                </div>
              )}
              {youth_metrics.youth_neet_pct != null && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">NEET Rate</span>
                  <span className="font-semibold text-au-dark">
                    {formatPercent(youth_metrics.youth_neet_pct)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No youth data available.</p>
          )}
        </Card>
      </div>

      {/* Agenda 2063 Scorecard */}
      {scorecard && scorecard.scorecard.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-au-dark mb-3">Agenda 2063 Scorecard</h2>
          <div className="space-y-4">
            {scorecard.scorecard.map((goal, gIdx) => {
              // Calculate goal progress from indicators
              const indicatorsWithTarget = goal.indicators.filter(
                (i) => i.target != null && i.target > 0
              );
              const goalProgress =
                indicatorsWithTarget.length > 0
                  ? indicatorsWithTarget.reduce(
                      (sum, i) => sum + Math.min((i.value / (i.target ?? 1)) * 100, 100),
                      0
                    ) / indicatorsWithTarget.length
                  : null;

              return (
                <Card key={gIdx} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-au-gold text-white text-xs">
                        Goal {goal.goal_number}
                      </Badge>
                      <h4 className="text-sm font-semibold text-au-dark">{goal.goal_name}</h4>
                    </div>
                    {goalProgress != null && (
                      <span className={`text-sm font-bold ${getProgressTextColor(goalProgress)}`}>
                        {goalProgress.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  {goalProgress != null && (
                    <Progress
                      value={goalProgress}
                      className={`h-1.5 mb-3 ${progressBarColor(goalProgress)}`}
                    />
                  )}
                  <div className="space-y-1.5">
                    {goal.indicators.map((ind, iIdx) => (
                      <div
                        key={iIdx}
                        className="flex items-center justify-between text-xs text-muted-foreground"
                      >
                        <span className="truncate max-w-[60%]">{ind.indicator}</span>
                        <span className="flex items-center gap-2">
                          <span className="font-medium text-au-dark">
                            {formatNumber(ind.value)} {ind.unit ?? ""}
                          </span>
                          {ind.target != null && (
                            <span className="text-au-gold">/ {formatNumber(ind.target)}</span>
                          )}
                          <span className="text-[10px]">({ind.year})</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-[10px]">
                      Data: {goal.data_completeness}
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Country-specific Insights */}
      {scorecardInsights.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-au-dark mb-3">
            Country Insights{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({scorecardInsights.length})
            </span>
          </h2>
          <div className="space-y-3">
            {scorecardInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
