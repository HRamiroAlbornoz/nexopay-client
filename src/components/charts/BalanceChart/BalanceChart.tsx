import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { TooltipContentProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

export interface BalanceDataPoint {
  date: string;
  ARS: number;
  USD: number;
  EUR: number;
}

interface BalanceChartProps {
  data: BalanceDataPoint[];
}

const COLORS = {
  ARS: '#f3ba2f',
  USD: '#00e676',
  EUR: '#7c6dfa',
};

// Tooltip personalizado con tipado oficial y fallback para evitar errores de IDE con Recharts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType> | any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'rgba(15, 18, 28, 0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        padding: '12px 16px',
        fontSize: 12,
        backdropFilter: 'blur(16px)',
      }}
    >
      <div style={{ color: '#8a99ad', marginBottom: 8, fontWeight: 700, fontSize: 11 }}>
        {String(label)}
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(payload as any[]).map((entry: any) => (
        <div key={String(entry.dataKey)} style={{ color: entry.color, fontWeight: 700, marginBottom: 4 }}>
          {String(entry.dataKey)}: {Number(entry.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      ))}
    </div>
  );
}

export default function BalanceChart({ data }: BalanceChartProps) {
  if (!data.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-secondary)', fontSize: 13 }}>
        Sin datos de balance disponibles
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          {Object.entries(COLORS).map(([key, color]) => (
            <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0}    />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#8a99ad', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#8a99ad', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={50}
          tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
        />
        <Tooltip content={CustomTooltip} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#8a99ad', paddingTop: 8 }}
          iconType="circle"
          iconSize={8}
        />
        {(Object.keys(COLORS) as Array<keyof typeof COLORS>).map((key) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={COLORS[key]}
            strokeWidth={2}
            fill={`url(#grad-${key})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
