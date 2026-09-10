// src/lib/institutionalApi.ts
//
// Typed wrappers for the Library and MMTTC endpoints, following the exact
// same pattern already established in lib/studentRequestApi.ts (a plain
// object of typed async methods built on an existing axios client).
//
// Uses `apiRoot` (from lib/api.ts) rather than the default `api` client:
// `api`'s baseURL is scoped to /api/faculty, but Library/MMTTC live at
// /api/library and /api/mmttc on the same merged backend. `apiRoot`'s
// baseURL is `${VITE_STUDENT_API_URL}/api` - once that env var points at
// the merged backend (Phase 5 configuration change), apiRoot.get('/library')
// resolves to exactly <merged-backend>/api/library. This reuses an
// existing client rather than introducing a third one; `apiRoot` already
// carries the same auth-token interceptor and 401-handling behavior these
// calls need.
import { apiRoot } from './api';

export interface LibraryRecord {
  _id: string;
  academicYear: string;
  librarian: {
    name: string;
    qualifications: string;
    joiningDate?: string;
    yearsOfService: number;
  };
  infrastructure: {
    totalFloorAreaSqFt: number;
    seatingCapacity: { readingRooms: number; studyCarrels: number; digitalLabs: number };
    accessibility: { ramps: number; lifts: number; wheelchairs: number };
    safetyMeasures: { fireAlarms: number; cctv: number; emergencyExits: number };
    discussionRooms: number;
    computers: number;
    timing: { daysPerWeek: number; fromTime: string; toTime: string; closedOnSaturday: boolean; closedOnSunday: boolean };
  };
  collections: {
    totalBooks: { subject: string; number: number };
    journalsAndPeriodicals: { print: number; electronic: number; national: number; international: number };
    digitalResources: { databases: number; ebooks: number; institutionalRepository: number };
    specialCollections: { rareBooks: number; theses: number; manuscripts: number };
    annualAdditions: { newTitlesPurchased: number; subscribed: number };
    contributionsByStudents: number;
    donations: { byAlumni: number; byStaff: number; byOthers: number };
  };
  technology: {
    libraryManagementSoftware: string;
    opacAvailable: boolean;
    institutionalRepositoryAccess: boolean;
    remoteAccessFacilities: string;
    digitalLiteracyPrograms: { from?: string; to?: string };
  };
  staffing: {
    supportStaffCount: number;
    qualificationsAndTraining: string;
    userServices: string;
    orientationPrograms: { date?: string; photoUploads: string[] };
    workshopsAndSeminars: Array<{ title: string; date?: string; topic: string }>;
    plagiarismChecks: Array<{ date?: string; articlesOrThesesChecked: number; scope: string }>;
  };
  usage: {
    footfall: { daily: number; annual: number };
    circulation: { booksIssued: number; booksReturned: number; source: 'manual' | 'auto' };
    digitalResourceUsage: { date?: string; totalDownloadsOrLogins: number };
    feedbackMechanisms: string;
  };
  compliance: {
    copyrightCompliance: boolean;
    dataPrivacyCompliance: boolean;
    disasterPreparedness: { fireSafety: string; digitalBackup: boolean };
    preservationMeasures: string[];
  };
  financial: { annualBudgetAllocation: number; subscriptionsAndMemberships: string };
  bestPractices: { practices: string; innovations: string; details: string };
  uploads: Array<{ url: string; caption: string }>;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const libraryApi = {
  list: async (): Promise<LibraryRecord[]> => {
    const res = await apiRoot.get<{ success: boolean; count: number; records: LibraryRecord[] }>('/library');
    return res.data.records;
  },
  getByYear: async (academicYear: string): Promise<LibraryRecord> => {
    const res = await apiRoot.get<{ success: boolean; record: LibraryRecord }>(`/library/${encodeURIComponent(academicYear)}`);
    return res.data.record;
  },
  create: async (payload: Partial<LibraryRecord> & { academicYear: string }): Promise<LibraryRecord> => {
    const res = await apiRoot.post<{ success: boolean; record: LibraryRecord }>('/library', payload);
    return res.data.record;
  },
  update: async (academicYear: string, payload: Partial<LibraryRecord>): Promise<LibraryRecord> => {
    const res = await apiRoot.put<{ success: boolean; record: LibraryRecord }>(`/library/${encodeURIComponent(academicYear)}`, payload);
    return res.data.record;
  },
  remove: async (academicYear: string): Promise<void> => {
    await apiRoot.delete(`/library/${encodeURIComponent(academicYear)}`);
  }
};

export interface MMTTCCourse {
  _id?: string;
  year: number;
  courseType: 'refresher' | 'orientation' | 'short_term';
  courseCode: string;
  periodFrom?: string;
  periodTo?: string;
  durationDays?: number;
  subjects: string[];
  courseTitle: string;
  coordinator: { name: string; department: string; qualification: string };
  eligibility: string;
  participants: { total: number; outsideUniversity: number; outsideState: number; outsideIndia: number };
  facultyParticipants: number;
  mode: 'online' | 'offline';
  fundingSource: 'govt' | 'private' | 'trust';
  expenditure: number;
  publications: string;
  feedbackFormUrl: string;
}

export interface MMTTCRecord {
  _id: string;
  academicYear: string;
  centre: {
    name: string;
    affiliationDetails: string;
    parentInstitution: string;
    yearOfEstablishment?: number;
    recognitionStatus: { status: boolean; date?: string };
    accreditationStatus: { status: boolean; date?: string };
    accreditationNumber: string;
  };
  director: { name: string; academicQualification: string; dateOfJoining?: string };
  infrastructure: {
    numberOfClassrooms: number;
    totalSeatingCapacity: number;
    numberOfLabs: number;
    library: { numberOfBooks: number; spaceSqFt: number };
    digitalResourcesDetails: string;
    equipment: Array<{ name: string; count: number }>;
    numberOfSupportingStaff: number;
    roomsAvailableToStay: number;
    stayCapacity: number;
    annualBudgetAllocation: number;
  };
  courses: MMTTCCourse[];
  impact: { collaborations: string; communityOutreach: string };
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const mmttcApi = {
  list: async (): Promise<MMTTCRecord[]> => {
    const res = await apiRoot.get<{ success: boolean; count: number; records: MMTTCRecord[] }>('/mmttc');
    return res.data.records;
  },
  getByYear: async (academicYear: string): Promise<MMTTCRecord> => {
    const res = await apiRoot.get<{ success: boolean; record: MMTTCRecord }>(`/mmttc/${encodeURIComponent(academicYear)}`);
    return res.data.record;
  },
  create: async (payload: Partial<MMTTCRecord> & { academicYear: string }): Promise<MMTTCRecord> => {
    const res = await apiRoot.post<{ success: boolean; record: MMTTCRecord }>('/mmttc', payload);
    return res.data.record;
  },
  update: async (academicYear: string, payload: Partial<MMTTCRecord>): Promise<MMTTCRecord> => {
    const res = await apiRoot.put<{ success: boolean; record: MMTTCRecord }>(`/mmttc/${encodeURIComponent(academicYear)}`, payload);
    return res.data.record;
  },
  remove: async (academicYear: string): Promise<void> => {
    await apiRoot.delete(`/mmttc/${encodeURIComponent(academicYear)}`);
  },
  addCourse: async (academicYear: string, course: MMTTCCourse): Promise<MMTTCRecord> => {
    const res = await apiRoot.post<{ success: boolean; record: MMTTCRecord }>(`/mmttc/${encodeURIComponent(academicYear)}/courses`, course);
    return res.data.record;
  },
  updateCourse: async (academicYear: string, courseId: string, course: Partial<MMTTCCourse>): Promise<MMTTCRecord> => {
    const res = await apiRoot.put<{ success: boolean; record: MMTTCRecord }>(`/mmttc/${encodeURIComponent(academicYear)}/courses/${courseId}`, course);
    return res.data.record;
  },
  removeCourse: async (academicYear: string, courseId: string): Promise<MMTTCRecord> => {
    const res = await apiRoot.delete<{ success: boolean; record: MMTTCRecord }>(`/mmttc/${encodeURIComponent(academicYear)}/courses/${courseId}`);
    return res.data.record;
  }
};
