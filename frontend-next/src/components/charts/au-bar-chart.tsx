"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CHART_COLORS, REGION_COLORS } from "@/lib/utils/colors";

interface AUBarChartProps {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  layout?: "horizontal" | "vertical";
  useRegionColors?: boolean;
  color?: string;
}

export function AUBarChart({
  data,
  height = 300,
  layout = "vertical",
  useRegionColors = false,
  color,
}: AUBarChartProps) {
  if (layout === "horizontal") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" tick={{ fontSize: 12 }} stroke="#6b7280" />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#6b7280" width={90} />
          <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: 12 }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={
                  useRegionColors
                    ? REGION_COLORS[entry.name as keyof typeof REGION_COLORS] || CHART_COLORS[index % CHART_COLORS.length]
                    : color || CHART_COLORS[index % CHART_COLORS.length]
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#6b7280" />
        <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
        <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: 12 }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={
                useRegionColors
                  ? REGION_COLORS[entry.name as keyof typeof REGION_COLORS] || CHART_COLORS[index % CHART_COLORS.length]
                  : color || CHART_COLORS[index % CHART_COLORS.length]
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
