"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCountries } from "@/lib/api/countries";
import { formatNumber, formatCurrency } from "@/lib/utils/format";
import type { MemberState } from "@/lib/types/api";

const REGIONS = [
  "All",
  "North Africa",
  "West Africa",
  "Central Africa",
  "East Africa",
  "Southern Africa",
] as const;

function CountriesSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-md" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function CountriesPage() {
  const [countries, setCountries] = useState<MemberState[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCountries = useCallback(async () => {
    try {
      setLoading(true);
      const region = selectedRegion === "All" ? undefined : selectedRegion;
      const res = await getCountries(region);
      setCountries(res.countries);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load countries");
    } finally {
      setLoading(false);
    }
  }, [selectedRegion]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  if (error && countries.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-au-dark">Member States</h1>
        <Card className="p-6 border-l-4 border-l-severity-critical">
          <p className="text-sm text-severity-critical font-medium">Failed to load countries</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </Card>
      </div>
    );
  }

  if (loading && countries.length === 0) return <CountriesSkeleton />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-au-dark">Member States</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} African Union member states across 5 regions
        </p>
      </div>

      {/* Region Filter */}
      <div className="flex flex-wrap gap-2">
        {REGIONS.map((region) => (
          <Button
            key={region}
            variant={selectedRegion === region ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedRegion(region)}
            className={selectedRegion === region ? "bg-au-dark text-white" : ""}
          >
            {region}
          </Button>
        ))}
      </div>

      {/* Countries Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Country</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">ISO Code</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Region</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Population</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">GDP/Capita</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">AU Member Since</th>
              </tr>
            </thead>
            <tbody>
              {countries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No countries found for the selected region.
                  </td>
                </tr>
              ) : (
                countries.map((country) => (
                  <tr
                    key={country.id}
                    className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/countries/${country.iso_code}`}
                        className="font-medium text-au-dark hover:text-au-green transition-colors"
                      >
                        {country.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {country.iso_code}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {country.region_name || country.regions?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {country.population ? formatNumber(country.population, 0) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {country.gdp_per_capita ? formatCurrency(country.gdp_per_capita) : "-"}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {country.au_membership_year ?? "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
