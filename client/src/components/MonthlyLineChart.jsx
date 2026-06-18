import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const formatMonth = (month) => {
  if (!month) return "";
  try {
    return new Date(month + "-01").toLocaleString("fr-FR", { month: "short", year: "2-digit" });
  } catch {
    return month;
  }
};

const formatTotal = (value) =>
  Number(value).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " HTG";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-lg text-xs">
      <p className="font-semibold text-slate-700">{formatMonth(label)}</p>
      <p className="mt-1 text-slate-500">
        Ventes : <span className="font-semibold text-slate-900">{payload[0]?.payload?.nombre_ventes}</span>
      </p>
      <p className="text-slate-500">
        Total : <span className="font-semibold text-slate-900">{formatTotal(payload[0]?.value)}</span>
      </p>
    </div>
  );
}

function MonthlyLineChart({ data, loading }) {
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
        Aucune donnee sur les 12 derniers mois.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={formatMonth}
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v) => Number(v).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#0f172a"
          strokeWidth={2}
          dot={{ r: 3, fill: "#0f172a" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default MonthlyLineChart;
