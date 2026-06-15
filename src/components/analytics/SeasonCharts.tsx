"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function SeasonCharts({
  data,
}: {
  data: { season: string; germination: number; production: number }[];
}) {
  return (
    <div dir="ltr" className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e3e8ef" />
          <XAxis dataKey="season" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="germination" name="Avg Germination %" fill="#3fb1d4" />
          <Bar dataKey="production" name="Avg Production" fill="#8cc63f" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
