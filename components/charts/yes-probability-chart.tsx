"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Snapshot = {
  recordedAt: string;
  yesProbability: number;
};

type YesProbabilityChartProps = {
  snapshots: Snapshot[];
};

export function YesProbabilityChart({ snapshots }: YesProbabilityChartProps) {
  const data = snapshots.map((snapshot) => ({
    time: new Date(snapshot.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    yes: Math.round(snapshot.yesProbability * 100),
  }));

  if (!data.length) {
    return <p className="text-xs muted">No snapshot data yet.</p>;
  }

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="time" tick={{ fill: "#757170", fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: "#757170", fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: "#ffffff", border: "1px solid #e4e2e2", borderRadius: 10 }}
            labelStyle={{ color: "#453f3d" }}
            itemStyle={{ color: "#0ea158" }}
          />
          <Line type="monotone" dataKey="yes" stroke="#0ea158" strokeWidth={2.2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
