import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getKycQueue, getAdminStats } from '../api-calls/admin/admin.get';
import { approveKyc, rejectKyc } from '../api-calls/admin/admin.post';
import { ApiError } from '../lib/apiError';
import type { KycRequest, AdminStats } from '../api-calls/admin/admin.get';

export type { KycRequest, AdminStats };

export function useKycQueue() {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState<KycRequest[]>([]);
  const [stats, setStats]       = useState<AdminStats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const fetchQueue = useCallback(async () => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [queue, adminStats] = await Promise.all([getKycQueue(), getAdminStats()]);
      setRequests(queue);
      setStats(adminStats);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isUnauthorized()) {
          logout();
          return;
        }
        setError(err.message);
      } else {
        setError('No se pudo cargar la cola de verificación.');
      }
    } finally {
      setLoading(false);
    }
  }, [user, logout]);

  useEffect(() => {
    void fetchQueue();
  }, [fetchQueue]);

  /** Aprueba una solicitud KYC y actualiza el estado local optimistamente. */
  const approve = useCallback(async (
    id: string
  ): Promise<{ ok: true } | { ok: false; message: string }> => {
    // Optimistic: remover de la cola inmediatamente
    setRequests((prev) => prev.filter((r) => r.id !== id));
    try {
      await approveKyc(id);
      return { ok: true };
    } catch (err) {
      // Rollback: recargar la cola si falló
      void fetchQueue();
      if (err instanceof ApiError) {
        if (err.isUnauthorized()) logout();
        return { ok: false, message: err.message };
      }
      return { ok: false, message: 'No se pudo aprobar la solicitud.' };
    }
  }, [logout, fetchQueue]);

  /** Rechaza una solicitud KYC con razón opcional y actualiza el estado local. */
  const reject = useCallback(async (
    id: string,
    reason?: string
  ): Promise<{ ok: true } | { ok: false; message: string }> => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    try {
      await rejectKyc(id, reason);
      return { ok: true };
    } catch (err) {
      void fetchQueue();
      if (err instanceof ApiError) {
        if (err.isUnauthorized()) logout();
        return { ok: false, message: err.message };
      }
      return { ok: false, message: 'No se pudo rechazar la solicitud.' };
    }
  }, [logout, fetchQueue]);

  return { requests, stats, loading, error, approve, reject, refetch: fetchQueue };
}
