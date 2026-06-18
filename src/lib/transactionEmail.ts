import type { Transaction } from '../types/transaction.types';
import { getTransactionTypeLabel } from './transactionLabels';
import { sendConfirmationEmail } from '../api-calls/email/email.post';

export function buildTransactionEmailHtml(transaction: Transaction, firstName: string): string {
  const typeLabel = getTransactionTypeLabel(transaction.type);
  const timestamp = new Date(transaction.created_at).toLocaleString('es-AR');

  return `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #00e676;">Operación confirmada</h2>
      <p>Hola <strong>${firstName}</strong>,</p>
      <p>Tu operación en NexoPay se procesó con éxito. Detalle:</p>
      <ul style="background: #f9f9f9; padding: 15px; border-radius: 4px; list-style: none;">
        <li><strong>Tipo:</strong> ${typeLabel}</li>
        <li><strong>Monto:</strong> ${transaction.amount_from.toFixed(2)} ${transaction.currency_from} → ${transaction.amount_to.toFixed(2)} ${transaction.currency_to}</li>
        <li><strong>Fecha:</strong> ${timestamp}</li>
      </ul>
      <p>Gracias por confiar en NexoPay.</p>
    </div>
  `;
}

export function sendTransactionConfirmationEmail(
  transaction: Transaction,
  user: { email: string; first_name: string }
): void {
  sendConfirmationEmail({
    to: user.email,
    subject: `NexoPay — Confirmación de ${getTransactionTypeLabel(transaction.type)}`,
    html: buildTransactionEmailHtml(transaction, user.first_name),
  }).catch((err) => {
    console.error('No se pudo enviar el email de confirmación.', err);
  });
}
