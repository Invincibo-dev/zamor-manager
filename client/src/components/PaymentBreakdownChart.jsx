import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = {
  Cash: "#f97316",
  MonCash: "#0ea5e9",
  Virement: "#6366f1",
};

const DEFAULT_COLOR = "#94a3b8";

const formatTotal = (value) =>
  Number(value).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " HTG";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-lg text-xs">
      <p className="font-semibold text-slate-700">{entry.name}</p>
      <p className="mt-1 text-slate-500">
        Ventes : <span className="font-semibold text-slate-900">{entry.payload.nombre_ventes}</span>
      </p>
      <p className="text-slate-500">
        Total : <span className="font-semibold text-slate-900">{formatTotal(entry.value)}</span>
      </p>
    </div>
  );
}

function PaymentBreakdownChart({ data, loading }) {
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
        Aucune vente ce mois.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.mode_paiement,
    value: Number(d.total),
    nombre_ventes: d.nombre_ventes,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry) => (
            <Cell
              key={entry.name}
              fill={COLORS[entry.name] || DEFAULT_COLOR}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontSize: 11, color: "#64748b" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default PaymentBreakdownChart;
