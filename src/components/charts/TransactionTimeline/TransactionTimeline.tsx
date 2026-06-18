import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { TooltipContentProps, DotItemDotProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import type { Transaction, TransactionType } from '../../../types/transaction.types';
import { isPositiveTransaction, getTransactionTypeLabel } from '../../../lib/transactionLabels';

interface TransactionTimelineProps {
  transactions: Transaction[];
}

type DataPoint = { label: string; amount: number; type: TransactionType };

const TYPE_COLORS: Record<TransactionType, string> = {
  buy:                      '#00e676',
  sell:                     '#ff1744',
  exchange:                 '#7c6dfa',
  transfer_in:              '#00e676',
  transfer_out:             '#ff1744',
  savings_goal_fund:        '#f3ba2f',
  shared_expense_paid:      '#ff1744',
  shared_expense_received:  '#00e676',
};

function CustomTooltip({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as DataPoint | undefined;
  if (!d) return null;
  const color = TYPE_COLORS[d.type];
  const typeLabel = getTransactionTypeLabel(d.type);

  return (
    <div style={{
      background: 'rgba(15, 18, 28, 0.95)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8,
      padding: '12px 16px',
      fontSize: 12,
      backdropFilter: 'blur(16px)',
    }}>
      <div style={{ color: '#8a99ad', marginBottom: 6, fontSize: 11, fontWeight: 700 }}>{d.label}</div>
      <div style={{ color, fontWeight: 700 }}>{typeLabel}</div>
      <div style={{ color: '#fff', fontWeight: 700, marginTop: 4 }}>
        {d.amount >= 0 ? '+' : ''}{d.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </div>
    </div>
  );
}

export default function TransactionTimeline({ transactions }: TransactionTimelineProps) {
  if (!transactions.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-secondary)', fontSize: 13 }}>
        Sin transacciones registradas
      </div>
    );
  }

  const data: DataPoint[] = [...transactions]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-20)
    .map((tx) => ({
      label: new Date(tx.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
      amount: isPositiveTransaction(tx.type) ? tx.amount_to : -tx.amount_from,
      type: tx.type,
    }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="label"
          tick={{ fill: '#8a99ad', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#8a99ad', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={50}
          tickFormatter={(v: number) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
        />
        <Tooltip content={CustomTooltip} />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="#f3ba2f"
          strokeWidth={2}
          dot={(props: DotItemDotProps) => {
            const { cx, cy, payload } = props;
            if (cx == null || cy == null) return <></>;
            const typedPayload = payload as DataPoint;
            const color = TYPE_COLORS[typedPayload.type];
            return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={4} fill={color} stroke="none" />;
          }}
          activeDot={{ r: 6, fill: '#f3ba2f', stroke: 'none' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
