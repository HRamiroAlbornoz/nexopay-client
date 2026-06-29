import { z } from 'zod';
import { API_BASE_URL } from '../../lib/apiConfig';
import { parseApiResponse } from '../../lib/apiError';

// ─── Esquemas ─────────────────────────────────────────────────────────────────

export const kycRequestSchema = z.object({
  id:         z.string(),
  user_email: z.string().email(),
  user_id:    z.string(),
  doc_type:   z.string(),
  doc_url:    z.string().url().optional(),
  status:     z.enum(['pending', 'approved', 'rejected']),
  created_at: z.string(),
});

const kycQueueResponseSchema = z.object({
  requests: z.array(kycRequestSchema),
});

const adminStatsSchema = z.object({
  active_users:  z.number(),
  daily_volume:  z.number(),
  kyc_pending:   z.number(),
});

export type KycRequest  = z.infer<typeof kycRequestSchema>;
export type AdminStats  = z.infer<typeof adminStatsSchema>;

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/kyc
 * Devuelve la cola de solicitudes KYC pendientes.
 * Requiere rol admin — el backend valida la sesión y el rol.
 */
export async function getKycQueue(): Promise<KycRequest[]> {
  const res = await fetch(`${API_BASE_URL}/admin/kyc`, {
    credentials: 'include',
  });
  const raw = await parseApiResponse(res);
  const { requests } = kycQueueResponseSchema.parse(raw);
  return requests;
}

/**
 * GET /api/admin/stats
 * Devuelve métricas de alto nivel del sistema para el panel de administración.
 */
export async function getAdminStats(): Promise<AdminStats> {
  const res = await fetch(`${API_BASE_URL}/admin/stats`, {
    credentials: 'include',
  });
  const raw = await parseApiResponse(res);
  return adminStatsSchema.parse(raw);
}
