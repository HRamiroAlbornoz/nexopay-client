import { z } from 'zod';
import { API_BASE_URL } from '../../lib/apiConfig';
import { parseApiResponse } from '../../lib/apiError';
import { kycRequestSchema } from './admin.get';

// Re-export for convenience
export type { KycRequest } from './admin.get';

// ─── Esquemas de respuesta ────────────────────────────────────────────────────

const kycActionResponseSchema = z.object({
  request: kycRequestSchema,
});

// ─── Helper interno ───────────────────────────────────────────────────────────

async function postKycAction(
  id: string,
  action: 'approve' | 'reject',
  reason?: string,
) {
  const res = await fetch(`${API_BASE_URL}/admin/kyc/${id}/${action}`, {
    method:      'POST',
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify(reason ? { reason } : {}),
  });

  const raw = await parseApiResponse(res);
  const { request } = kycActionResponseSchema.parse(raw);
  return request;
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/kyc/:id/approve
 * Aprueba una solicitud KYC. El backend actualiza el estado y notifica al usuario.
 */
export function approveKyc(id: string) {
  return postKycAction(id, 'approve');
}

/**
 * POST /api/admin/kyc/:id/reject
 * Rechaza una solicitud KYC con una razón opcional.
 */
export function rejectKyc(id: string, reason?: string) {
  return postKycAction(id, 'reject', reason);
}
