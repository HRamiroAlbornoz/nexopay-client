import type { TransactionType } from '../types/transaction.types';

const POSITIVE_TYPES: ReadonlySet<TransactionType> = new Set([
  'buy',
  'transfer_in',
  'shared_expense_received',
]);

export function isPositiveTransaction(type: TransactionType): boolean {
  return POSITIVE_TYPES.has(type);
}

const TYPE_LABELS: Record<TransactionType, string> = {
  buy: 'Compra',
  sell: 'Venta',
  exchange: 'Conversión',
  transfer_in: 'Transferencia Recibida',
  transfer_out: 'Transferencia Enviada',
  savings_goal_fund: 'Aporte a Meta de Ahorro',
  shared_expense_paid: 'Pago de Gasto Compartido',
  shared_expense_received: 'Cobro de Gasto Compartido',
};

export function getTransactionTypeLabel(type: TransactionType): string {
  return TYPE_LABELS[type];
}
