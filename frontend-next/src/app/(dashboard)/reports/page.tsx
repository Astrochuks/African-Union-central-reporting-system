"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getReports, generateReport, getExcelExportUrl } from "@/lib/api/reports";
import { getCountries } from "@/lib/api/countries";
import { formatDateTime } from "@/lib/utils/format";
import type { Report, MemberState } from "@/lib/types/api";

interface ReportTypeCard {
  type: string;
  title: string;
  description: string;
  icon: string;
  needsCountry: boolean;
}

const REPORT_TYPES: ReportTypeCard[] = [
  {
    type: "executive_summary",
    title: "Executive Summary",
    description:
      "Comprehensive Agenda 2063 progress overview with key findings, trends, and strategic recommendations for AU leadership.",
    icon: "📊",
    needsCountry: false,
  },
  {
    type: "gender_brief",
    title: "Gender Brief",
    description:
      "Gender equality and women's empowerment analysis covering parliamentary representation, labor force, and education parity.",
    icon: "⚖️",
    needsCountry: false,
  },
  {
    type: "country_profile",
    title: "Country Profile",
    description:
      "Deep-dive into a specific member state with scorecard, key indicators, gender/youth metrics, and targeted insights.",
    icon: "🌍",
    needsCountry: true,
  },
];

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-60 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [countries, setCountries] = useState<MemberState[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [genMessage, setGenMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getReports().catch(() => ({ reports: [], total: 0 })),
      getCountries().catch(() => ({ countries: [], total: 0 })),
    ])
      .then(([reportsData, countriesData]) => {
        setReports(reportsData.reports);
        setCountries(countriesData.countries);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleGenerate(type: string) {
    try {
      setGenerating(type);
      setGenMessage(null);

      const params: Record<string, unknown> = {};
      if (type === "country_profile") {
        if (!selectedCountry) {
          setGenMessage("Please select a country first.");
          setGenerating(null);
          return;
        }
        params.country_iso = selectedCountry;
      }

      const report = await generateReport({
        report_type: type,
        parameters: Object.keys(params).length > 0 ? params : undefined,
      });

      setReports((prev) => [report, ...prev]);
      setGenMessage(`Report "${report.title}" generated successfully.`);
    } catch (err) {
      setGenMessage(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setGenerating(null);
    }
  }

  if (error && reports.length === 0 && loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-au-dark">Reports</h1>
        <Card className="p-6 border-l-4 border-l-severity-critical">
          <p className="text-sm text-severity-critical font-medium">Failed to load reports</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </Card>
      </div>
    );
  }

  if (loading) return <ReportsSkeleton />;

  const excelUrl = getExcelExportUrl();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-au-dark">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate consulting-style reports with executive summaries, insights, and data-driven recommendations
        </p>
      </div>

      {genMessage && (
        <Card className="p-3 border-l-4 border-l-au-green">
          <p className="text-sm text-au-dark">{genMessage}</p>
        </Card>
      )}

      {/* Report Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {REPORT_TYPES.map((rt) => (
          <Card key={rt.type} className="p-5 flex flex-col border-t-4 border-t-au-gold">
            <div className="flex-1">
              <div className="text-2xl mb-2">{rt.icon}</div>
              <h3 className="text-md font-semibold text-au-dark mb-2">{rt.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{rt.description}</p>
            </div>

            {/* Country selector for country profile */}
            {rt.needsCountry && (
              <div className="mt-4">
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue placeholder="Select a country..." />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.iso_code} value={c.iso_code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              onClick={() => handleGenerate(rt.type)}
              disabled={generating === rt.type}
              className="mt-4 bg-au-green hover:bg-au-green/90 text-white w-full"
            >
              {generating === rt.type ? "Generating..." : "Generate"}
            </Button>
          </Card>
        ))}
      </div>

      {/* Excel Export */}
      <Card className="p-5 border-t-4 border-t-au-green">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-md font-semibold text-au-dark">Excel Data Export</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Download all AU data as a structured Excel workbook for offline analysis
            </p>
          </div>
          <a href={excelUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="border-au-green text-au-green hover:bg-au-green/10">
              Download Excel
            </Button>
          </a>
        </div>
      </Card>

      {/* Previous Reports */}
      {reports.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-au-dark mb-3">Previous Reports</h2>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Generated</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-au-dark">{report.title}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="capitalize text-xs">
                          {report.report_type.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateTime(report.generated_at)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {report.file_url ? (
                          <a
                            href={report.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-au-green hover:underline font-medium"
                          >
                            Download
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
