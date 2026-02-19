"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type CategoryEntry = { category: string; label: string; count: number };

export function CategoryBar({ data }: { data: CategoryEntry[] }) {
  if (data.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
        No data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 40, left: 0 }} barSize={28}>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={28} />
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
        <Bar dataKey="count" fill="#60a5fa" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
