import { apiRoot } from './api';

export interface UnlockRequest {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
  };
  requestNo: string;
  requestType: 'field_correction' | 'full_unlock';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string;
  correctionFields?: Array<{
    section: string;
    field: string;
    currentValue: any;
    requestedValue: any;
  }>;
  formData?: Record<string, any>;
  createdAt: string;
}

export interface ProfileUpdateRequest {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
  };
  requestNo: string;
  status: 'pending' | 'approved' | 'rejected';
  changes: Record<string, any>;
  remarks?: string;
  createdAt: string;
}

export interface DropdownRequest {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
  };
  requestNo: string;
  dropdownKey: string;
  requestedValue: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedValue?: string;
  remarks?: string;
  createdAt: string;
}

export interface ForgotPasswordRequest {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
  };
  requestNo: string;
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string;
  createdAt: string;
}

export const studentRequestApi = {
  // Unlock Requests
  getUnlockRequestsPending: async (department: string): Promise<UnlockRequest[]> => {
    const res = await apiRoot.get<UnlockRequest[]>(`/unlock-request/pending?department=${encodeURIComponent(department)}`, { data: { department } });
    return res.data;
  },
  getUnlockRequestById: async (id: string): Promise<UnlockRequest> => {
    const res = await apiRoot.get<UnlockRequest>(`/unlock-request/${id}`);
    return res.data;
  },
  approveUnlockRequest: async (id: string): Promise<any> => {
    const res = await apiRoot.post(`/unlock-request/${id}/approve`);
    return res.data;
  },
  rejectUnlockRequest: async (id: string, reason: string): Promise<any> => {
    const res = await apiRoot.post(`/unlock-request/${id}/reject`, { reason });
    return res.data;
  },

  // Profile Update Requests
  getProfileUpdateRequestsPending: async (department: string): Promise<ProfileUpdateRequest[]> => {
    const res = await apiRoot.get<ProfileUpdateRequest[]>(`/profile-update-request/pending?department=${encodeURIComponent(department)}`, { data: { department } });
    return res.data;
  },
  getProfileUpdateRequestById: async (id: string): Promise<{ request: ProfileUpdateRequest; currentProfile: any }> => {
    const res = await apiRoot.get<{ request: ProfileUpdateRequest; currentProfile: any }>(`/profile-update-request/${id}`);
    return res.data;
  },
  approveProfileUpdateRequest: async (id: string): Promise<any> => {
    const res = await apiRoot.post(`/profile-update-request/${id}/approve`);
    return res.data;
  },
  rejectProfileUpdateRequest: async (id: string, reason: string): Promise<any> => {
    const res = await apiRoot.post(`/profile-update-request/${id}/reject`, { reason });
    return res.data;
  },

  // Dropdown Requests
  getDropdownRequestsPending: async (department: string): Promise<DropdownRequest[]> => {
    const res = await apiRoot.get<DropdownRequest[]>(`/dropdown-request/pending?department=${encodeURIComponent(department)}`, { data: { department } });
    return res.data;
  },
  approveDropdownRequest: async (id: string, approvedValue: string): Promise<any> => {
    const res = await apiRoot.put(`/dropdown-request/${id}/approve`, { approvedValue });
    return res.data;
  },
  rejectDropdownRequest: async (id: string): Promise<any> => {
    const res = await apiRoot.put(`/dropdown-request/${id}/reject`);
    return res.data;
  },

  // Forgot Password Requests
  getForgotPasswordRequestsPending: async (department: string): Promise<ForgotPasswordRequest[]> => {
    const res = await apiRoot.post<ForgotPasswordRequest[]>(`/forgot-password-request/pending?department=${encodeURIComponent(department)}`, {
      department
    });
    return res.data;
  },
  resetForgotPassword: async (id: string, newPassword: string): Promise<any> => {
    const res = await apiRoot.put(`/forgot-password-request/${id}/reset`, { newPassword });
    return res.data;
  },
  rejectForgotPassword: async (id: string): Promise<any> => {
    const res = await apiRoot.put(`/forgot-password-request/${id}/reject`);
    return res.data;
  }
};
