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
    return <p className="text-sm muted">No transaction history yet.</p>;
  }

  const last = data[data.length - 1]?.value ?? 0;
  data.push({ time: "Now", value: Math.floor(last + openValue) });

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <XAxis dataKey="time" tick={{ fill: "#757170", fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "#757170", fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: "#ffffff", border: "1px solid #e4e2e2", borderRadius: 10 }}
            labelStyle={{ color: "#453f3d" }}
            itemStyle={{ color: "#156cc2" }}
          />
          <Area type="monotone" dataKey="value" stroke="#156cc2" fill="#156cc21f" strokeWidth={2.2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
