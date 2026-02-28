"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { CHART_COLORS, INSIGHT_TYPE_COLORS, SEVERITY_COLORS } from "@/lib/utils/colors";

interface AUDonutChartProps {
  data: { name: string; value: number }[];
  height?: number;
  colorMode?: "default" | "severity" | "insightType";
}

export function AUDonutChart({ data, height = 250, colorMode = "default" }: AUDonutChartProps) {
  function getColor(name: string, index: number) {
    if (colorMode === "severity") {
      return SEVERITY_COLORS[name as keyof typeof SEVERITY_COLORS] || CHART_COLORS[index % CHART_COLORS.length];
    }
    if (colorMode === "insightType") {
      return INSIGHT_TYPE_COLORS[name] || CHART_COLORS[index % CHART_COLORS.length];
    }
    return CHART_COLORS[index % CHART_COLORS.length];
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
          label={({ name, value }) => `${name}: ${value}`}
          labelLine={{ stroke: "#6b7280", strokeWidth: 1 }}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={getColor(entry.name, index)} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
