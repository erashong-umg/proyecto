import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import type { Appeal, Report, ReportStatus } from '../types/api';

/**
 * Bandejas de moderación del panel de administración: denuncias
 * (GET/PATCH /api/admin/reports) y apelaciones de suspensión
 * (GET/PATCH /api/admin/appeals). Ver admin.routes.ts / admin.controller.ts.
 */
export const useAdminModeration = () => {
  // --- Denuncias ---
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [reportStatusFilter, setReportStatusFilter] = useState<ReportStatus | ''>('');
  const [resolvingReportId, setResolvingReportId] = useState<string | null>(null);

  const loadReports = useCallback(() => {
    setReportsLoading(true);
    setReportsError(null);
    api
      .get<{ reports: Report[] }>('/admin/reports', {
        params: reportStatusFilter ? { status: reportStatusFilter } : undefined,
      })
      .then((res) => setReports(res.data.reports))
      .catch((err) => setReportsError(getErrorMessage(err, 'No se pudieron cargar las denuncias.')))
      .finally(() => setReportsLoading(false));
  }, [reportStatusFilter]);

  useEffect(() => { loadReports(); }, [loadReports]);

  /** PATCH /api/admin/reports/:id — status: 'reviewing' | 'resolved' | 'dismissed'. */
  const resolveReport = async (
    reportId: string,
    status: Exclude<ReportStatus, 'open'>,
    resolutionNote?: string
  ): Promise<boolean> => {
    setResolvingReportId(reportId);
    setReportsError(null);
    try {
      await api.patch(`/admin/reports/${reportId}`, { status, resolutionNote });
      loadReports();
      return true;
    } catch (err) {
      setReportsError(getErrorMessage(err, 'No se pudo actualizar la denuncia.'));
      return false;
    } finally {
      setResolvingReportId(null);
    }
  };

  // --- Apelaciones ---
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [appealsLoading, setAppealsLoading] = useState(true);
  const [appealsError, setAppealsError] = useState<string | null>(null);
  const [resolvingAppealId, setResolvingAppealId] = useState<string | null>(null);

  const loadAppeals = useCallback(() => {
    setAppealsLoading(true);
    setAppealsError(null);
    api
      .get<{ appeals: Appeal[] }>('/admin/appeals')
      .then((res) => setAppeals(res.data.appeals))
      .catch((err) => setAppealsError(getErrorMessage(err, 'No se pudieron cargar las apelaciones.')))
      .finally(() => setAppealsLoading(false));
  }, []);

  useEffect(() => { loadAppeals(); }, [loadAppeals]);

  /** PATCH /api/admin/appeals/:id — decision: 'accept' | 'reject'. 'accept' reactiva la cuenta. */
  const resolveAppeal = async (
    appealId: string,
    decision: 'accept' | 'reject',
    adminResponse?: string
  ): Promise<boolean> => {
    setResolvingAppealId(appealId);
    setAppealsError(null);
    try {
      await api.patch(`/admin/appeals/${appealId}`, { decision, adminResponse });
      loadAppeals();
      return true;
    } catch (err) {
      setAppealsError(getErrorMessage(err, 'No se pudo resolver la apelación.'));
      return false;
    } finally {
      setResolvingAppealId(null);
    }
  };

  return {
    reports, reportsLoading, reportsError,
    reportStatusFilter, setReportStatusFilter,
    resolveReport, resolvingReportId, reloadReports: loadReports,
    appeals, appealsLoading, appealsError,
    resolveAppeal, resolvingAppealId, reloadAppeals: loadAppeals,
  };
};
