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
    return <p className="text-xs text-zinc-400">No snapshot data yet.</p>;
  }

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="time" tick={{ fill: "#a1a1aa", fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: "#a1a1aa", fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: "#0f1220", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8 }}
            labelStyle={{ color: "#d4d4d8" }}
            itemStyle={{ color: "#34d399" }}
          />
          <Line type="monotone" dataKey="yes" stroke="#34d399" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
