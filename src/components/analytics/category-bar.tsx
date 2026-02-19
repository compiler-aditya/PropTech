"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type CategoryEntry = { category: string; label: string; count: number };

const COLORS = [
  "#60a5fa", "#818cf8", "#a78bfa", "#f472b6",
  "#34d399", "#fb923c", "#facc15",
];

export function CategoryBar({ data }: { data: CategoryEntry[] }) {
  if (data.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
        No data
      </div>
    );
  }

  const height = Math.max(200, data.length * 36 + 16);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 32, bottom: 4, left: 4 }}
        barSize={20}
      >
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={90}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
          contentStyle={{
            fontSize: "12px",
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--popover))",
            color: "hsl(var(--popover-foreground))",
          }}
          formatter={(value: number) => [value, "Tickets"]}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell key={entry.category} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
