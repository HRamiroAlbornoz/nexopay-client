import { describe, it, expect } from 'vitest';
import { isPositiveTransaction, getTransactionTypeLabel } from '../../lib/transactionLabels';
import type { TransactionType } from '../../types/transaction.types';

describe('isPositiveTransaction', () => {
  it('returns true for transaction types that increase the balance', () => {
    const positiveTypes: TransactionType[] = ['buy', 'transfer_in', 'shared_expense_received'];
    for (const type of positiveTypes) {
      expect(isPositiveTransaction(type)).toBe(true);
    }
  });

  it('returns false for transaction types that decrease the balance', () => {
    const negativeTypes: TransactionType[] = [
      'sell',
      'exchange',
      'transfer_out',
      'savings_goal_fund',
      'shared_expense_paid',
    ];
    for (const type of negativeTypes) {
      expect(isPositiveTransaction(type)).toBe(false);
    }
  });
});

describe('getTransactionTypeLabel', () => {
  it('returns a non-empty Spanish label for each of the 8 real ledger transaction types', () => {
    const allTypes: TransactionType[] = [
      'buy',
      'sell',
      'exchange',
      'transfer_in',
      'transfer_out',
      'savings_goal_fund',
      'shared_expense_paid',
      'shared_expense_received',
    ];
    for (const type of allTypes) {
      const label = getTransactionTypeLabel(type);
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    }
  });

  it('returns distinct labels for shared_expense_paid and shared_expense_received', () => {
    expect(getTransactionTypeLabel('shared_expense_paid')).not.toBe(
      getTransactionTypeLabel('shared_expense_received')
    );
  });
});
