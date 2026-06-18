import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const formatDay = (day) => {
  if (!day) return "";
  const date = new Date(day + "T00:00:00");
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
};

const formatTotal = (value) =>
  Number(value).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " HTG";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-lg text-xs">
      <p className="font-semibold text-slate-700">{formatDay(label)}</p>
      <p className="mt-1 text-slate-500">
        Ventes : <span className="font-semibold text-slate-900">{payload[0]?.payload?.nombre_ventes}</span>
      </p>
      <p className="text-slate-500">
        Total : <span className="font-semibold text-slate-900">{formatTotal(payload[0]?.value)}</span>
      </p>
    </div>
  );
}

function SalesBarChart({ data, loading }) {
  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        Chargement...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        Aucune donnee sur les 30 derniers jours.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="day"
          tickFormatter={formatDay}
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(v) => Number(v).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
        <Bar dataKey="total" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default SalesBarChart;
