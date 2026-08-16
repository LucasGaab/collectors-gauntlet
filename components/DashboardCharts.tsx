"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ChartDatum = { name: string; value: number; corBg: string };

const CHART_COLORS = ["#ED1D24", "#E8C468", "#7A7A85", "#8E2226", "#3F3F49", "#C98F3A"];

const tooltipStyle = {
  backgroundColor: "#1F1F24",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  fontSize: 12,
  color: "#F5F5F7",
};

const axisTick = { fill: "#9B9BA3", fontSize: 10 };

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl border border-border p-6">
      <p className="eyebrow mb-6">{title}</p>
      {children}
    </div>
  );
}

export function GrupoPieChart({ data }: { data: ChartDatum[] }) {
  return (
    <ChartCard title="Peças por grupo">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={86}
              paddingAngle={3}
              stroke="none"
              animationDuration={280}
            >
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={entry.corBg || CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {data.map((g, i) => (
          <span
            key={g.name}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: g.corBg || CHART_COLORS[i % CHART_COLORS.length] }}
            />
            {g.name} {g.value}
          </span>
        ))}
      </div>
    </ChartCard>
  );
}

export function MarcaBarChart({ data }: { data: ChartDatum[] }) {
  return (
    <ChartCard title="Peças por marca">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="value" fill="#ED1D24" radius={[6, 6, 0, 0]} animationDuration={280} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function EscalaBarChart({ data }: { data: ChartDatum[] }) {
  return (
    <ChartCard title="Peças por escala">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <XAxis allowDecimals={false} type="number" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="value" fill="#E8C468" radius={[0, 6, 6, 0]} animationDuration={280} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
