"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, AlertTriangle, RefreshCw, Search, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ProgressRing } from "@/components/charts/progress-ring";
import { AUBarChart } from "@/components/charts/au-bar-chart";
import {
  getDataQualityOverview,
  getDataQualityByCountry,
  assessDataQuality,
} from "@/lib/api/data-quality";
import { formatPercent } from "@/lib/utils/format";
import type { DataQualityOverview, DataQualityCountryScore } from "@/lib/types/api";

function getScoreColor(score: number): string {
  if (score > 70) return "text-au-green";
  if (score >= 40) return "text-au-gold";
  return "text-severity-critical";
}

function getScoreBg(score: number): string {
  if (score > 70) return "bg-au-green/10";
  if (score >= 40) return "bg-au-gold/10";
  return "bg-red-50";
}

export default function DataQualityPage() {
  const [overview, setOverview] = useState<DataQualityOverview | null>(null);
  const [countryScores, setCountryScores] = useState<DataQualityCountryScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessing, setAssessing] = useState(false);
  const [assessResult, setAssessResult] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, countryData] = await Promise.allSettled([
        getDataQualityOverview(),
        getDataQualityByCountry(),
      ]);
      if (overviewData.status === "fulfilled") {
        setOverview(overviewData.value);
      }
      if (countryData.status === "fulfilled") {
        setCountryScores(countryData.value.scores || []);
      }
      if (overviewData.status === "rejected" && countryData.status === "rejected") {
        setError("Failed to load data quality information. Please try again later.");
      }
    } catch {
      setError("Failed to load data quality information. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAssess = async () => {
    setAssessing(true);
    setAssessResult(null);
    try {
      const result = await assessDataQuality();
      setAssessResult(`Assessment complete: ${result.total_scores} country scores evaluated.`);
      // Reload data after assessment
      await loadData();
    } catch {
      setAssessResult("Assessment failed. Please try again.");
    } finally {
      setAssessing(false);
    }
  };

  const filteredScores = countryScores.filter(
    (s) =>
      s.country_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.iso_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mostComplete = overview?.most_complete_indicators
    ?.slice(0, 5)
    .map((i) => ({ name: i.indicator, value: Math.round(i.score) })) || [];

  const leastComplete = overview?.least_complete_indicators
    ?.slice(0, 5)
    .map((i) => ({ name: i.indicator, value: Math.round(i.score) })) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (error && !overview && countryScores.length === 0) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-au-gold mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-au-dark mb-1">Unable to Load Data Quality</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-t-4 border-t-severity-neutral">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Continental Avg Score</p>
              <p className="text-2xl font-bold text-au-dark mt-1">
                {overview ? formatPercent(overview.continental_avg_score, 0) : "N/A"}
              </p>
            </div>
            {overview && (
              <ProgressRing value={overview.continental_avg_score} size={56} strokeWidth={5} />
            )}
          </div>
        </Card>
        <KPICard
          label="Good Data Quality"
          value={overview ? String(overview.countries_with_good_data) : "N/A"}
          unit="countries (>70)"
          severity="positive"
        />
        <KPICard
          label="Poor Data Quality"
          value={overview ? String(overview.countries_with_poor_data) : "N/A"}
          unit="countries (<40)"
          severity={overview && overview.countries_with_poor_data > 10 ? "critical" : "warning"}
        />
        <KPICard
          label="Total Data Gaps"
          value={overview ? String(overview.gaps?.length ?? 0) : "N/A"}
          unit="missing entries"
          severity={overview && (overview.gaps?.length ?? 0) > 100 ? "critical" : "warning"}
        />
      </div>

      {/* Indicator Charts */}
      {(mostComplete.length > 0 || leastComplete.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mostComplete.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-4 w-4 text-au-green" />
                <h3 className="text-sm font-semibold text-au-dark">Most Complete Indicators</h3>
              </div>
              <AUBarChart data={mostComplete} layout="horizontal" height={220} color="#017c3a" />
            </Card>
          )}
          {leastComplete.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-4 w-4 text-severity-critical" />
                <h3 className="text-sm font-semibold text-au-dark">Least Complete Indicators</h3>
              </div>
              <AUBarChart data={leastComplete} layout="horizontal" height={220} color="#dc2626" />
            </Card>
          )}
        </div>
      )}

      {/* Run Assessment + Country Scores */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-au-dark" />
            <h3 className="text-sm font-semibold text-au-dark">Country Data Quality Scores</h3>
            <Badge variant="outline" className="text-[10px]">
              {countryScores.length} countries
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 w-48 text-xs"
              />
            </div>
            <Button
              onClick={handleAssess}
              disabled={assessing}
              size="sm"
              className="bg-au-green hover:bg-au-green/90 text-white text-xs h-8"
            >
              {assessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Assessing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Run Assessment
                </>
              )}
            </Button>
          </div>
        </div>

        {assessResult && (
          <div
            className={`mb-4 px-3 py-2 rounded-md text-xs ${
              assessResult.includes("failed")
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-au-green/10 text-au-green border border-au-green/20"
            }`}
          >
            {assessResult}
          </div>
        )}

        {filteredScores.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Country
                  </th>
                  <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    ISO
                  </th>
                  <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Overall Score
                  </th>
                  <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Completeness
                  </th>
                  <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Indicators Covered
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredScores.map((score) => (
                  <tr key={score.iso_code} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-2 px-3 font-medium text-au-dark text-xs">{score.country_name}</td>
                    <td className="py-2 px-3">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {score.iso_code}
                      </Badge>
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getScoreBg(score.overall_score)} ${getScoreColor(score.overall_score)}`}
                      >
                        {formatPercent(score.overall_score, 0)}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${score.completeness > 70 ? "bg-au-green" : score.completeness >= 40 ? "bg-au-gold" : "bg-severity-critical"}`}
                            style={{ width: `${Math.min(score.completeness, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{formatPercent(score.completeness, 0)}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-xs text-muted-foreground">{score.indicators_covered}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : countryScores.length > 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No countries match &quot;{searchTerm}&quot;</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <ShieldCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No country scores available yet. Click &quot;Run Assessment&quot; to generate scores.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
