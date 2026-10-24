// src/lib/benchmarkImportApi.ts
// Client for /api/faculty/admin/benchmark-imports (administrator-only).
import api from './api';

const BASE = '/admin/benchmark-imports';

export interface RowFlag { code: string; severity: 'error' | 'warning' | 'info'; message: string }
export interface BandCell { score: number; label: string; min?: number | null; max?: number | null }
export interface ImportRow {
  rowId: string; metricId: string; metricName: string; description: string; details?: string;
  criterionNumber: number | null; criterion: string; keyIndicator: string; maxScore: number | null;
  unit: string; period: string | null; scoringType: 'numeric' | 'categorical' | 'none';
  direction: 'higherIsBetter' | 'lowerIsBetter' | null; bands: BandCell[];
  options?: { label: string; score: number; text: string }[]; computedField?: string | null;
  source: string; page?: number | null; reviewed: boolean; excluded: boolean; flags: RowFlag[];
  formula?: string; notes?: string; evidence?: { pages: number[]; text: string };
  match?: { existing: boolean; sameMeaning: boolean | null; similarity: number | null; suggestedFrom: { metricId: string; similarity: number } | null };
}
export interface ImportSummary {
  id: string; versionNo: number; documentVersion: string; sourceFilename: string | null;
  origin: 'pdf' | 'manual' | 'baseline'; status: 'draft' | 'approved' | 'active' | 'superseded' | 'rejected';
  uploadedBy?: { name: string | null }; uploadedAt?: string; approvedBy?: { name: string | null }; approvedAt?: string | null;
  activatedAt?: string | null; rowCount: number; includedCount: number; errorCount: number;
  reviewedBy?: { name: string | null }; reviewedAt?: string | null; activatedBy?: { name: string | null }; sourceStored?: boolean;
}
export interface ImportFull extends ImportSummary {
  reused?: boolean; processing?: { chunks: number; chunkSize: number; pagesProcessed: number; ms: number } | null;
  pageCount: number | null; scannedPages: number[]; warnings: string[]; criteria: unknown[]; rows: ImportRow[];
}
export interface AuditEntry { _id: string; action: string; importId: string | null; actor: { name: string | null; role: string | null }; at: string; details: Record<string, unknown> }
export interface CatalogueStatus {
  database: string | null; nodeEnv: string | null;
  benchmarkMetrics: { total: number; active: number; withAnalyticsMapping: number };
  analyticsMetricDefinitions: number; activeVersion: { versionNo: number; documentVersion: string; sourceFilename: string | null; origin: string } | null;
  pendingDrafts: number; notes: string[];
}

export const getImportStatus = () => api.get<CatalogueStatus>(`${BASE}/status`).then((r) => r.data);
export const listImports = () => api.get<ImportSummary[]>(BASE).then((r) => r.data);
export const getImport = (id: string) => api.get<ImportFull>(`${BASE}/${id}`).then((r) => r.data);
export const uploadBenchmarkPdf = (file: File, documentVersion: string) => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('documentVersion', documentVersion);
  return api.post<ImportFull>(`${BASE}/upload`, fd).then((r) => r.data);
};
export const createManualDraft = (documentVersion: string) => api.post<ImportFull>(`${BASE}/manual`, { documentVersion }).then((r) => r.data);
export const updateImportRow = (id: string, rowId: string, patch: Partial<ImportRow>) => api.patch<ImportRow>(`${BASE}/${id}/rows/${rowId}`, patch).then((r) => r.data);
export const addImportRow = (id: string, row: Partial<ImportRow>) => api.post<ImportRow>(`${BASE}/${id}/rows`, row).then((r) => r.data);
export const approveImport = (id: string) => api.post<ImportSummary>(`${BASE}/${id}/approve`).then((r) => r.data);
export const activateImport = (id: string, mode: 'merge' | 'replace') => api.post<ImportSummary>(`${BASE}/${id}/activate`, { mode }).then((r) => r.data);
export const rollbackImport = (id: string) => api.post<ImportSummary>(`${BASE}/${id}/rollback`).then((r) => r.data);
export const rejectImport = (id: string) => api.post<ImportSummary>(`${BASE}/${id}/reject`).then((r) => r.data);
export const deleteImport = (id: string) => api.delete<{ deleted: boolean; id: string; versionNo: number }>(`${BASE}/${id}`).then((r) => r.data);
export const getAuditLog = (importId?: string) => api.get<AuditEntry[]>(`${BASE}/audit-log`, { params: importId ? { importId } : {} }).then((r) => r.data);

// ── Activation preview + source document ─────────────────────────────────────
export interface ActivationPreview {
  importId: string; versionNo: number; status: string; mode: 'merge' | 'replace';
  counts: { added: number; modified: number; deactivated: number; unchanged: number; keptActive: number };
  additions: { metricId: string }[]; modifications: { metricId: string; fields: string[] }[];
  deactivations: { metricId: string; reason: string }[]; keptActive: string[];
}
export const previewActivation = (id: string, mode: 'merge' | 'replace') => api.get<ActivationPreview>(`${BASE}/${id}/preview`, { params: { mode } }).then((r) => r.data);
/** Fetches the stored PDF with the admin session and returns a blob URL (never a public link). */
export const fetchSourcePdfUrl = (id: string) =>
  api.get(`${BASE}/${id}/source`, { responseType: 'blob' }).then((r) => URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' })));

// ── Live catalogue management (/admin/benchmark-catalogue) ───────────────────
const CAT = '/admin/benchmark-catalogue';
export interface CatalogueItem {
  metricId: string; metricName: string; description: string; criterion: string; criterionNumber: number; keyIndicator: string;
  maxScore: number | null; unit: string; period: string | null; scoringType: 'numeric' | 'categorical'; direction: 'higherIsBetter' | 'lowerIsBetter' | null;
  bands: { score: number; label: string }[]; options: { label: string; score: number; text: string }[]; active: boolean;
  computedField: string | null; mapped: boolean; mappingStatus: 'mapped' | 'unmapped' | 'unsupported' | 'unknown_metric';
  formula: string; notes: string; improvementHint: string;
  source: { origin: 'seed' | 'import' | 'manual'; versionNo: number | null; filename: string | null; documentVersion: string | null; approvedBy: string | null; revision: number; editedBy: string | null; editedAt: string | null; page: number | null };
  lifecycle: { deactivatedAt: string | null; deactivatedBy: string | null; reason: string } | null;
}
export interface CatalogueDetail extends CatalogueItem {
  bandsDetail: { score: number; label: string; min: number | null; max: number | null; minInclusive: boolean; maxInclusive: boolean }[];
  benchmarkValue: number | null;
  analyticsMetric: { metricId: string; metricName: string; formulaType: string | null; supported: boolean; criterion: string | null } | null;
}
export interface CatalogueList {
  items: CatalogueItem[]; total: number; page: number; limit: number;
  facets: { versions: string[]; criteria: { number: number; count: number }[]; totals: { all: number; active: number; inactive: number; unmapped: number } };
}
export interface CatalogueFilters { q?: string; criterion?: string; status?: string; version?: string; mapping?: string; page?: number; limit?: number }
export interface CatalogueWrite {
  metricId?: string; criterionNumber?: number; keyIndicator?: string; description?: string; unit?: string; scoringType?: string; maxScore?: number | null;
  period?: string | null; bands?: { score: number; label: string }[]; options?: { label: string; score: number; text: string }[];
  computedField?: string | null; formula?: string; notes?: string; improvementHint?: string; metricName?: string;
}
export const listCatalogue = (f: CatalogueFilters) => api.get<CatalogueList>(CAT, { params: f }).then((r) => r.data);
export const getCatalogueItem = (id: string) => api.get<CatalogueDetail>(`${CAT}/${encodeURIComponent(id)}`).then((r) => r.data);
export const createCatalogueItem = (p: CatalogueWrite) => api.post<{ record: CatalogueDetail; flags: RowFlag[] }>(CAT, p).then((r) => r.data);
export const updateCatalogueItem = (id: string, p: CatalogueWrite) => api.patch<{ record: CatalogueDetail; flags: RowFlag[] }>(`${CAT}/${encodeURIComponent(id)}`, p).then((r) => r.data);
export const deactivateCatalogueItem = (id: string, reason: string) => api.post<CatalogueDetail>(`${CAT}/${encodeURIComponent(id)}/deactivate`, { reason }).then((r) => r.data);
export const reactivateCatalogueItem = (id: string) => api.post<CatalogueDetail>(`${CAT}/${encodeURIComponent(id)}/reactivate`).then((r) => r.data);
export const deleteCatalogueItem = (id: string) => api.delete<{ deleted: boolean; metricId: string }>(`${CAT}/${encodeURIComponent(id)}`).then((r) => r.data);
export const getCatalogueHistory = (id: string) => api.get<AuditEntry[]>(`${CAT}/${encodeURIComponent(id)}/history`).then((r) => r.data);
export const getMetricOptions = () => api.get<{ metricId: string; metricName: string; formulaType: string | null; supported: boolean }[]>(`${CAT}/metric-options`).then((r) => r.data);
