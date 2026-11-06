// src/lib/eventsApi.ts
// Campus Events & Evidence Management — typed wrappers over /api/events/*
// (same-origin, mounted on THIS backend — see server/index.js). Uses
// apiCore exactly like institutionalApi.ts does for /api/library|/api/mmttc.
import { apiCore } from './api';

export interface Venue {
  _id: string;
  name: string;
  venueType: string;
  building?: string;
  roomNumber?: string;
  capacity?: number | null;
  isActive: boolean;
  isCustom: boolean;
  bookingRestrictions?: string;
  maintenancePeriods: { _id: string; from: string; to: string; reason: string }[];
}

export interface SlotConfig {
  _id?: string;
  timezone: string;
  slots: { slotNumber: number; label: string; startTime: string; endTime: string }[];
}

export interface Booking {
  _id: string;
  programName: string;
  conductingDepartment: string;
  venue: Venue | string;
  customVenueName?: string;
  customRoomNumber?: string;
  date: string;
  slotType: 'standard' | 'custom';
  standardSlotNumber?: number | null;
  startTime: string;
  endTime: string;
  targetGroups: string[];
  expectedStrength?: number | null;
  objectives?: string;
  resourcePerson?: string;
  bookingNotes?: string;
  leadFaculty: { _id: string; name: string; email: string } | string;
  supportingFaculty: ({ _id: string; name: string; email: string } | string)[];
  status: 'draft' | 'confirmed' | 'cancelled' | 'rescheduled';
  eventStatus: string;
  reportDeadline: string;
  createdBy: string;
  /** Server-calculated permissions for the signed-in viewer. */
  canCancel?: boolean;
  canManage?: boolean;
}

export interface EvidenceFile {
  _id: string;
  url: string;
  category: 'photo' | 'attendance_register' | 'brochure' | 'document' | 'feedback';
  originalName?: string;
  latitude?: number | null;
  longitude?: number | null;
  gpsMissing?: boolean;
  uploadedAt?: string;
}

export interface EventReport {
  _id: string;
  booking: string;
  version: number;
  isCurrent: boolean;
  nameOfProgram: string;
  conductingDepartment: string;
  personInCharge: string;
  programVenue: string;
  targetGroupBeneficiaries: string[];
  dateFrom?: string | null;
  dateTo?: string | null;
  expectedStrength?: number | null;
  objectives?: string;
  resourcePerson?: string;
  numberOfParticipants?: number | null;
  briefEventReport?: string;
  feedbackText?: string;
  evidence: EvidenceFile[];
  isDraft: boolean;
  submittedAt?: string | null;
  reviewStatus: 'draft' | 'submitted' | 'under_review' | 'correction_requested' | 'approved' | 'rejected';
  correctionNotes?: string;
  changedFromBooking: string[];
}

// ── Venues ─────────────────────────────────────────────────────────────────
export const listVenues = (includeInactive = false) =>
  apiCore.get<Venue[]>('/events/venues', { params: { includeInactive } }).then((r) => r.data);
export const createVenue = (payload: Partial<Venue>) =>
  apiCore.post<Venue>('/events/venues', payload).then((r) => r.data);
export const updateVenue = (id: string, payload: Partial<Venue>) =>
  apiCore.patch<Venue>(`/events/venues/${id}`, payload).then((r) => r.data);
export const deleteVenue = (id: string) =>
  apiCore.delete<{ message: string; venue: Venue }>(`/events/venues/${id}`).then((r) => r.data);
export const addMaintenancePeriod = (id: string, from: string, to: string, reason: string) =>
  apiCore.post<Venue>(`/events/venues/${id}/maintenance`, { from, to, reason }).then((r) => r.data);
export const getSlotConfig = () => apiCore.get<SlotConfig>('/events/venues/slot-config').then((r) => r.data);
export const updateSlotConfig = (payload: SlotConfig) =>
  apiCore.put<SlotConfig>('/events/venues/slot-config', payload).then((r) => r.data);

// ── Bookings (HOD) ───────────────────────────────────────────────────────────
export const listBookings = (params?: { venue?: string; department?: string; from?: string; to?: string }) =>
  apiCore.get<Booking[]>('/events/bookings', { params }).then((r) => r.data);
export const getBooking = (id: string) => apiCore.get<Booking>(`/events/bookings/${id}`).then((r) => r.data);
export const createBooking = (payload: Record<string, unknown>) =>
  apiCore.post<Booking>('/events/bookings', payload).then((r) => r.data);
export const confirmBooking = (id: string) =>
  apiCore.post<Booking>(`/events/bookings/${id}/confirm`).then((r) => r.data);
export const cancelBooking = (id: string, reason: string) =>
  apiCore.post<Booking>(`/events/bookings/${id}/cancel`, { reason }).then((r) => r.data);
export const rescheduleBooking = (id: string, payload: Record<string, unknown>) =>
  apiCore.post<Booking>(`/events/bookings/${id}/reschedule`, payload).then((r) => r.data);
export const updateAssignments = (id: string, payload: Record<string, unknown>) =>
  apiCore.patch<Booking>(`/events/bookings/${id}/assignments`, payload).then((r) => r.data);
export const emergencyOverride = (id: string, reason: string) =>
  apiCore.post<Booking>(`/events/bookings/${id}/emergency-override`, { reason }).then((r) => r.data);

// ── Faculty ───────────────────────────────────────────────────────────────────
export const getFacultyHome = () => apiCore.get('/events/faculty/home').then((r) => r.data);
export const getAssignedEvent = (bookingId: string) =>
  apiCore.get<{ booking: Booking; report: EventReport; isLead: boolean }>(`/events/faculty/${bookingId}`).then((r) => r.data);
export const saveReportDraft = (bookingId: string, payload: Partial<EventReport>) =>
  apiCore.put<EventReport>(`/events/faculty/${bookingId}/report`, payload).then((r) => r.data);
export const uploadEvidence = (
  bookingId: string,
  file: File,
  category: EvidenceFile['category'],
  geo?: { latitude?: number; longitude?: number; gpsAccuracyMeters?: number; capturedAt?: string }
) => {
  const form = new FormData();
  form.append('file', file);
  form.append('category', category);
  if (geo?.latitude !== undefined) form.append('latitude', String(geo.latitude));
  if (geo?.longitude !== undefined) form.append('longitude', String(geo.longitude));
  if (geo?.gpsAccuracyMeters !== undefined) form.append('gpsAccuracyMeters', String(geo.gpsAccuracyMeters));
  if (geo?.capturedAt) form.append('capturedAt', geo.capturedAt);
  return apiCore.post<EventReport>(`/events/faculty/${bookingId}/evidence`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};
export const deleteEvidence = (bookingId: string, evidenceId: string) =>
  apiCore.delete<EventReport>(`/events/faculty/${bookingId}/evidence/${evidenceId}`).then((r) => r.data);
export const submitReport = (bookingId: string) =>
  apiCore.post<EventReport>(`/events/faculty/${bookingId}/submit`).then((r) => r.data);

// ── HOD / Admin review ─────────────────────────────────────────────────────
// All current-version reports regardless of status (Admin: institution-wide;
// HOD: own department) — used by the Reports & Evidence screens.
export const listAllReports = () => apiCore.get<EventReport[]>('/events/reviews').then((r) => r.data);
export const listPendingReports = () => apiCore.get<EventReport[]>('/events/reviews/pending').then((r) => r.data);
export const getReportDetail = (reportId: string) =>
  apiCore.get<{ report: EventReport; versions: EventReport[] }>(`/events/reviews/${reportId}`).then((r) => r.data);
export const approveReport = (reportId: string) =>
  apiCore.post<EventReport>(`/events/reviews/${reportId}/approve`).then((r) => r.data);
export const requestCorrections = (reportId: string, notes: string) =>
  apiCore.post<EventReport>(`/events/reviews/${reportId}/request-corrections`, { notes }).then((r) => r.data);
export const rejectReport = (reportId: string, reason: string) =>
  apiCore.post<EventReport>(`/events/reviews/${reportId}/reject`, { reason }).then((r) => r.data);

// ── Current Activities Register ───────────────────────────────────────────────
export const searchRegister = (params?: Record<string, string>) =>
  apiCore.get<EventReport[]>('/events/register', { params }).then((r) => r.data);
export const exportRegisterUrl = (format: 'pdf' | 'excel', params?: Record<string, string>) => {
  const qs = new URLSearchParams(params).toString();
  return `/api/events/register/export/${format}${qs ? `?${qs}` : ''}`;
};
