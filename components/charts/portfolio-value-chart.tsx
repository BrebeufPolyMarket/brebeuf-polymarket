"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Transaction = {
  createdAt: string;
  balanceAfter: number;
};

type PortfolioValueChartProps = {
  transactions: Transaction[];
  openValue: number;
};

export function PortfolioValueChart({ transactions, openValue }: PortfolioValueChartProps) {
  const sorted = [...transactions].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const data = sorted.map((transaction) => ({
    time: new Date(transaction.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }),
    value: transaction.balanceAfter,
  }));

  if (data.length === 0) {
    return <p className="text-sm text-zinc-400">No transaction history yet.</p>;
  }

  const last = data[data.length - 1]?.value ?? 0;
  data.push({ time: "Now", value: Math.floor(last + openValue) });

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <XAxis dataKey="time" tick={{ fill: "#a1a1aa", fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: "#0f1220", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8 }}
            labelStyle={{ color: "#d4d4d8" }}
            itemStyle={{ color: "#60a5fa" }}
          />
          <Area type="monotone" dataKey="value" stroke="#60a5fa" fill="#60a5fa22" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
