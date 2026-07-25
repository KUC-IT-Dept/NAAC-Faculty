import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/AppLayout';
import { studentRequestApi, UnlockRequest, ProfileUpdateRequest, DropdownRequest, ForgotPasswordRequest } from '../../lib/studentRequestApi';
import api, { apiRoot } from '../../lib/api';
import toast from 'react-hot-toast';
import { 
  LockOpen, 
  UserCheck, 
  ChevronDown, 
  KeyRound, 
  Search, 
  RefreshCw, 
  Eye, 
  Check, 
  X, 
  EyeOff, 
  ChevronRight, 
  HelpCircle,
  Clock
} from 'lucide-react';

type TabType = 'unlock' | 'profile' | 'dropdown' | 'forgot';

export default function StudentRequest() {
  const [activeTab, setActiveTab] = useState<TabType>('unlock');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Department dropdown filter list
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  // Data lists
  const [unlockRequests, setUnlockRequests] = useState<UnlockRequest[]>([]);
  const [profileRequests, setProfileRequests] = useState<ProfileUpdateRequest[]>([]);
  const [dropdownRequests, setDropdownRequests] = useState<DropdownRequest[]>([]);
  const [forgotRequests, setForgotPasswordRequests] = useState<ForgotPasswordRequest[]>([]);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Selected Requests for detail view
  const [selectedUnlock, setSelectedUnlock] = useState<UnlockRequest | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<{ request: ProfileUpdateRequest; currentProfile: any } | null>(null);
  const [selectedDropdown, setSelectedDropdown] = useState<DropdownRequest | null>(null);
  const [selectedForgot, setSelectedForgot] = useState<ForgotPasswordRequest | null>(null);

  // Modals / Action States
  const [actioning, setActioning] = useState(false);
  
  // Reject reason prompt modal
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; type: TabType; id: string; reason: string }>({
    isOpen: false,
    type: 'unlock',
    id: '',
    reason: ''
  });

  // Approve dropdown modal
  const [approveDropdownModal, setApproveDropdownModal] = useState<{ isOpen: boolean; request: DropdownRequest | null; value: string }>({
    isOpen: false,
    request: null,
    value: ''
  });

  // Reset password modal
  const [resetPwdModal, setResetPwdModal] = useState({
    isOpen: false,
    request: null as ForgotPasswordRequest | null,
    newPassword: '',
    confirmPassword: '',
    showPassword: false
  });

  // Confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Helper to ensure data is an array
  const ensureArray = (val: any): any[] => {
    if (Array.isArray(val)) return val;
    if (val && typeof val === 'object') {
      if (Array.isArray(val.data)) return val.data;
      if (Array.isArray(val.requests)) return val.requests;
      if (Array.isArray(val.unlockRequests)) return val.unlockRequests;
      if (Array.isArray(val.profileRequests)) return val.profileRequests;
      if (Array.isArray(val.dropdownRequests)) return val.dropdownRequests;
      if (Array.isArray(val.forgotRequests)) return val.forgotRequests;
    }
    return [];
  };

  // Fetch departments list from Faculty backend
  useEffect(() => {
    api.get('/departments')
      .then((res: any) => {
        const names = Array.isArray(res.data) ? res.data.map((d: any) => d.name) : [];
        setDepartments(names);
        if (names.length > 0) {
          setSelectedDepartment(names[0]);
        } else {
          const defaults = ['Department Of Information Technology', 'Department Of Computer Science'];
          setDepartments(defaults);
          setSelectedDepartment(defaults[0]);
        }
      })
      .catch((err: any) => {
        console.error('Failed to fetch departments:', err);
        const defaults = ['Department Of Information Technology', 'Department Of Computer Science'];
        setDepartments(defaults);
        setSelectedDepartment(defaults[0]);
      });
  }, []);

  // Fetch functions
  const fetchData = async (tab: TabType, deptVal?: string) => {
    const dept = deptVal || selectedDepartment;
    if (!dept) return; // Wait until department is loaded
    setLoading(true);
    setError(null);
    try {
      if (tab === 'unlock') {
        const data = await studentRequestApi.getUnlockRequestsPending(dept);
        setUnlockRequests(ensureArray(data));
      } else if (tab === 'profile') {
        const data = await studentRequestApi.getProfileUpdateRequestsPending(dept);
        setProfileRequests(ensureArray(data));
      } else if (tab === 'dropdown') {
        const data = await studentRequestApi.getDropdownRequestsPending(dept);
        setDropdownRequests(ensureArray(data));
      } else if (tab === 'forgot') {
        const data = await studentRequestApi.getForgotPasswordRequestsPending(dept);
        setForgotPasswordRequests(ensureArray(data));
      }
      setCurrentPage(1);
    } catch (err: any) {
      console.error('Fetch error details:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDepartment) {
      fetchData(activeTab, selectedDepartment);
    }
  }, [activeTab, selectedDepartment]);

  const handleRefresh = () => {
    if (selectedDepartment) {
      fetchData(activeTab, selectedDepartment);
      toast.success('List refreshed');
    }
  };

  // Generic Confirmation Trigger
  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(d => ({ ...d, isOpen: false }));
      }
    });
  };

  // --- ACTIONS: Unlock Requests ---
  const handleApproveUnlock = (id: string) => {
    triggerConfirm('Approve Unlock Request', 'Are you sure you want to approve this unlock request?', async () => {
      setActioning(true);
      try {
        await studentRequestApi.approveUnlockRequest(id);
        toast.success('Unlock Request Approved Successfully');
        fetchData('unlock');
        setSelectedUnlock(null);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Approval failed');
      } finally {
        setActioning(false);
      }
    });
  };

  const handleRejectUnlock = (id: string, reason: string) => {
    setActioning(true);
    studentRequestApi.rejectUnlockRequest(id, reason)
      .then(() => {
        toast.success('Unlock Request Rejected Successfully');
        setRejectModal(m => ({ ...m, isOpen: false }));
        fetchData('unlock');
        setSelectedUnlock(null);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Rejection failed');
      })
      .finally(() => {
        setActioning(false);
      });
  };

  // --- ACTIONS: Profile Update Requests ---
  const handleApproveProfile = (id: string) => {
    triggerConfirm('Approve Profile Update', 'Are you sure you want to approve these profile updates?', async () => {
      setActioning(true);
      try {
        await studentRequestApi.approveProfileUpdateRequest(id);
        toast.success('Profile Update Approved Successfully');
        fetchData('profile');
        setSelectedProfile(null);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Approval failed');
      } finally {
        setActioning(false);
      }
    });
  };

  const handleRejectProfile = (id: string, reason: string) => {
    setActioning(true);
    studentRequestApi.rejectProfileUpdateRequest(id, reason)
      .then(() => {
        toast.success('Profile Update Rejected Successfully');
        setRejectModal(m => ({ ...m, isOpen: false }));
        fetchData('profile');
        setSelectedProfile(null);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Rejection failed');
      })
      .finally(() => {
        setActioning(false);
      });
  };

  // --- ACTIONS: Dropdown Requests ---
  const handleApproveDropdown = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveDropdownModal.request) return;
    const { _id } = approveDropdownModal.request;
    
    triggerConfirm('Approve Dropdown Request', `Are you sure you want to approve this value: "${approveDropdownModal.value}"?`, async () => {
      setActioning(true);
      try {
        await studentRequestApi.approveDropdownRequest(_id, approveDropdownModal.value);
        toast.success('Dropdown Request Approved Successfully');
        setApproveDropdownModal({ isOpen: false, request: null, value: '' });
        fetchData('dropdown');
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Approval failed');
      } finally {
        setActioning(false);
      }
    });
  };

  const handleRejectDropdown = (id: string) => {
    triggerConfirm('Reject Dropdown Request', 'Are you sure you want to reject this dropdown request?', async () => {
      setActioning(true);
      try {
        await studentRequestApi.rejectDropdownRequest(id);
        toast.success('Dropdown Request Rejected Successfully');
        fetchData('dropdown');
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Rejection failed');
      } finally {
        setActioning(false);
      }
    });
  };

  // --- ACTIONS: Forgot Password ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPwdModal.request) return;
    if (resetPwdModal.newPassword !== resetPwdModal.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (resetPwdModal.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    const { _id } = resetPwdModal.request;

    triggerConfirm('Confirm Password Reset', 'Are you sure you want to reset this student\'s password?', async () => {
      setActioning(true);
      try {
        await studentRequestApi.resetForgotPassword(_id, resetPwdModal.newPassword);
        toast.success('Password Reset Successfully');
        setResetPwdModal({ isOpen: false, request: null, newPassword: '', confirmPassword: '', showPassword: false });
        fetchData('forgot');
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Reset failed');
      } finally {
        setActioning(false);
      }
    });
  };

  const handleRejectForgot = (id: string) => {
    triggerConfirm('Reject Password Reset', 'Are you sure you want to reject this forgot password request?', async () => {
      setActioning(true);
      try {
        await studentRequestApi.rejectForgotPassword(id);
        toast.success('Password Reset Request Rejected Successfully');
        fetchData('forgot');
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Rejection failed');
      } finally {
        setActioning(false);
      }
    });
  };

  // --- VIEW DETAILS MODAL FETCHERS ---
  const handleViewUnlockDetails = async (req: UnlockRequest) => {
    setSelectedUnlock(req);
  };

  const handleViewProfileDetails = async (req: ProfileUpdateRequest) => {
    try {
      const details = await studentRequestApi.getProfileUpdateRequestById(req._id);
      setSelectedProfile(details);
    } catch {
      toast.error('Failed to load profile comparison');
    }
  };

  // --- UTILS & SEARCH ---
  const getFilteredData = () => {
    const q = searchQuery.toLowerCase().trim();
    if (activeTab === 'unlock') {
      return unlockRequests.filter(r => 
        r.requestNo.toLowerCase().includes(q) || 
        r.studentId?.name?.toLowerCase().includes(q) || 
        r.studentId?.email?.toLowerCase().includes(q)
      );
    } else if (activeTab === 'profile') {
      return profileRequests.filter(r => 
        r.requestNo.toLowerCase().includes(q) || 
        r.studentId?.name?.toLowerCase().includes(q) || 
        r.studentId?.email?.toLowerCase().includes(q)
      );
    } else if (activeTab === 'dropdown') {
      return dropdownRequests.filter(r => 
        r.requestNo.toLowerCase().includes(q) || 
        r.studentId?.name?.toLowerCase().includes(q) || 
        r.studentId?.email?.toLowerCase().includes(q) ||
        r.dropdownKey.toLowerCase().includes(q) ||
        r.requestedValue.toLowerCase().includes(q)
      );
    } else {
      return forgotRequests.filter(r => 
        r.requestNo.toLowerCase().includes(q) || 
        r.studentId?.name?.toLowerCase().includes(q) || 
        r.studentId?.email?.toLowerCase().includes(q)
      );
    }
  };

  const filteredData = getFilteredData();
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Tab configurations
  const tabsList = [
    { id: 'unlock', label: 'Unlock Requests', icon: <LockOpen size={16} /> },
    { id: 'profile', label: 'Profile Update Requests', icon: <UserCheck size={16} /> },
    { id: 'dropdown', label: 'Dropdown Requests', icon: <ChevronDown size={16} /> },
    { id: 'forgot', label: 'Forgot Password Requests', icon: <KeyRound size={16} /> }
  ];

  // Active tab details
  const getActiveTabTitle = () => {
    switch (activeTab) {
      case 'unlock': return 'Unlock Requests';
      case 'profile': return 'Profile Update Requests';
      case 'dropdown': return 'Dropdown Requests';
      case 'forgot': return 'Forgot Password Requests';
    }
  };

  const getActiveTabDescription = () => {
    switch (activeTab) {
      case 'unlock':
        return 'Unlock requests are raised by students when their accounts are locked. You can approve or reject requests after verifying student details.';
      case 'profile':
        return 'Profile update requests are submitted when students want to change critical information. You can review the side-by-side comparison below.';
      case 'dropdown':
        return 'Dropdown requests allow students to request new options for dropdown menus. You can edit the value to clean it up before approval.';
      case 'forgot':
        return 'Forgot password requests allow you to reset credentials for students who are unable to log in.';
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    return (
      <span className="request-status-badge">
        <span className="badge-dot" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Mock statistics counts for presentation
  const getStats = () => {
    const list = getFilteredData();
    const pending = list.filter(r => r.status === 'pending').length;
    const approved = list.filter(r => r.status === 'approved').length;
    const total = list.length;
    return { total, pending, approved };
  };

  const { total, pending, approved } = getStats();

  return (
    <AppLayout title="Student Request">
      {/* Redesigned local CSS injector for pixel perfect SaaS UI */}
      <style>{`
        /* Spacings */
        .sr-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        /* Breadcrumbs */
        .sr-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #64748B;
          margin-bottom: -12px;
        }
        .sr-breadcrumb span {
          cursor: pointer;
        }
        .sr-breadcrumb span.active {
          color: #1E293B;
          font-weight: 500;
        }

        /* Title Area */
        .sr-title-area {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sr-title {
          font-size: 32px;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
          line-height: 1.2;
        }
        .sr-subtitle {
          font-size: 14px;
          color: #64748B;
          margin: 0;
        }

        /* Navigation Container */
        .sr-nav-container {
          background: #FFFFFF;
          border-radius: 12px;
          padding: 6px;
          display: flex;
          gap: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          border: 1px solid #E2E8F0;
          width: fit-content;
        }
        .sr-nav-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: none;
          background: transparent;
          border-radius: 8px;
          color: #64748B;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        .sr-nav-tab:hover {
          color: #0F172A;
          background: #F8FAFC;
        }
        .sr-nav-tab.active {
          color: #2563EB;
          background: #EFF6FF;
        }
        .sr-nav-tab.active::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 16px;
          right: 16px;
          height: 2px;
          background: #2563EB;
          border-radius: 2px;
          display: none; /* Modern tab style uses pill, user requested blue underline */
        }
        /* Fallback user exact match active styling: active tab has blue underline */
        .sr-nav-tab.active {
          border-bottom: 2px solid #2563EB;
          border-radius: 0px;
          background: transparent;
        }

        /* Content Card */
        .sr-content-card {
          background: #FFFFFF;
          border-radius: 16px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03);
          border: 1px solid #F1F5F9;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Content Header */
        .sr-content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        .sr-content-header-left {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sr-content-header-left h3 {
          font-size: 20px;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }
        .sr-content-header-left p {
          font-size: 14px;
          color: #64748B;
          margin: 0;
        }
        .sr-content-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Search input wrapper */
        .sr-search-wrapper {
          position: relative;
          width: 280px;
        }
        .sr-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
        }
        .sr-search-input {
          width: 100%;
          height: 38px;
          padding: 8px 12px 8px 36px;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
          font-size: 14px;
          color: #0F172A;
          outline: none;
          transition: all 0.2s ease;
        }
        .sr-search-input:focus {
          border-color: #CBD5E1;
        }

        /* Action Buttons */
        .sr-btn-outline {
          height: 38px;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          color: #334155;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sr-btn-outline:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        /* Tables */
        .sr-table-container {
          border-radius: 8px;
          border: 1px solid #E2E8F0;
          overflow: hidden;
        }
        .sr-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .sr-table th {
          background: #F8FAFC;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          border-bottom: 1px solid #E2E8F0;
          letter-spacing: 0.05em;
        }
        .sr-table td {
          padding: 16px;
          font-size: 14px;
          color: #334155;
          border-bottom: 1px solid #E2E8F0;
        }
        .sr-table tr:last-child td {
          border-bottom: none;
        }

        /* Student Card */
        .sr-student-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sr-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #EFF6FF;
          color: #2563EB;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sr-student-info {
          display: flex;
          flex-direction: column;
        }
        .sr-student-name {
          font-weight: 600;
          color: #0F172A;
        }
        .sr-student-email {
          font-size: 12px;
          color: #64748B;
        }

        /* Status Badge */
        .request-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #FFF7ED;
          color: #EA580C;
          font-weight: 600;
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 9999px;
          border: 1px solid #FFEDD5;
        }
        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #EA580C;
        }

        /* Actions Cell */
        .sr-actions-cell {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        .sr-icon-btn {
          width: 34px;
          height: 34px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
        }
        .sr-icon-btn.view {
          color: #64748B;
        }
        .sr-icon-btn.view:hover {
          background: #F1F5F9;
          border-color: #CBD5E1;
        }
        .sr-icon-btn.approve {
          color: #16A34A;
          border-color: #BBF7D0;
        }
        .sr-icon-btn.approve:hover {
          background: #F0FDF4;
          border-color: #86EFAC;
        }
        .sr-icon-btn.reject {
          color: #DC2626;
          border-color: #FECACA;
        }
        .sr-icon-btn.reject:hover {
          background: #FEF2F2;
          border-color: #FCA5A5;
        }

        /* Pagination & Footer */
        .sr-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .sr-footer-text {
          font-size: 14px;
          color: #64748B;
        }
        .sr-pagination {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .sr-page-btn {
          height: 34px;
          min-width: 34px;
          padding: 0 12px;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          color: #334155;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .sr-page-btn:hover:not(:disabled) {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }
        .sr-page-btn.active {
          background: #2563EB;
          color: #FFFFFF;
          border-color: #2563EB;
        }

        /* Bottom Info & Stats Card */
        .sr-bottom-card {
          background: #FFFFFF;
          border-radius: 16px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
          border: 1px solid #F1F5F9;
          padding: 24px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-top: 20px;
        }
        @media(max-width: 900px) {
          .sr-bottom-card {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
        .sr-bottom-left {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sr-bottom-left h4 {
          font-size: 18px;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }
        .sr-bottom-left p {
          font-size: 14px;
          color: #64748B;
          line-height: 1.6;
          margin: 0;
        }
        
        /* Stats grid */
        .sr-bottom-right {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }
        .sr-stat-card {
          background: #FFFFFF;
          border: 1px solid #F1F5F9;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          text-align: center;
        }
        .sr-stat-icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2px;
        }
        .sr-stat-number {
          font-size: 24px;
          font-weight: 700;
          color: #0F172A;
          line-height: 1;
        }
        .sr-stat-label {
          font-size: 12px;
          color: #64748B;
          font-weight: 500;
        }
      `}</style>

      <div className="sr-page">
        {/* 1. Breadcrumbs */}
        <div className="sr-breadcrumb">
          <span>Home</span>
          <ChevronRight size={14} />
          <span className="active">Student Request</span>
        </div>

        {/* 2. Page Title */}
        <div className="sr-title-area">
          <h1 className="sr-title">Student Request</h1>
          <p className="sr-subtitle">Manage all student related requests</p>
        </div>

        {/* 3. Request Type Navigation Tabs */}
        <div className="sr-nav-container">
          {tabsList.map(tab => (
            <button
              key={tab.id}
              className={`sr-nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id as TabType);
                setSearchQuery('');
                setCurrentPage(1);
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* 4. Main Content Card */}
        <div className="sr-content-card">
          
          {/* Card Header */}
          <div className="sr-content-header">
            <div className="sr-content-header-left">
              <h3>Pending {getActiveTabTitle()}</h3>
              <p>Manage student submitted requests</p>
            </div>
            <div className="sr-content-header-right">
              <select
                value={selectedDepartment}
                onChange={e => setSelectedDepartment(e.target.value)}
                className="sr-search-input"
                style={{ width: 'auto', minWidth: '240px', height: '38px', padding: '0 12px', cursor: 'pointer' }}
              >
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <div className="sr-search-wrapper">
                <Search size={16} className="sr-search-icon" />
                <input
                  type="text"
                  placeholder="Search by name, email or ID..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="sr-search-input"
                />
              </div>
              <button className="sr-btn-outline" onClick={handleRefresh}>
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>
          </div>

          {/* Table Area */}
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto', width: 30, height: 30 }} />
              <p className="text-muted text-sm" style={{ marginTop: 12 }}>Fetching pending requests...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--danger)' }}>
              <p style={{ fontWeight: 600 }}>Error loading requests</p>
              <p className="text-sm">{error}</p>
              <button className="btn btn-primary" onClick={() => fetchData(activeTab)} style={{ marginTop: 12 }}>Retry</button>
            </div>
          ) : paginatedData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 24px', color: '#64748b' }}>
              <HelpCircle size={32} style={{ color: '#94A3B8', marginBottom: 12 }} />
              <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>No requests found</p>
              <p className="text-sm">There are no pending {getActiveTabTitle().toLowerCase()} available at the moment.</p>
            </div>
          ) : (
            <div className="sr-table-container">
              <table className="sr-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Request ID</th>
                    <th>Student</th>
                    <th>Department</th>
                    <th>Email</th>
                    <th>Requested On</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((r, idx) => {
                    const studentInitials = (r.studentId?.name || 'S').slice(0, 2).toUpperCase();
                    // Resolve department fallback
                    const department = (r as any).studentId?.department || (r as any).department || 'Computer Science';
                    
                    return (
                      <tr key={r._id}>
                        <td style={{ color: '#64748B', fontWeight: 500 }}>
                          {((currentPage - 1) * itemsPerPage) + idx + 1}
                        </td>
                        <td>
                          <code style={{ background: '#F1F5F9', padding: '3px 7px', borderRadius: 4, fontSize: '13px', color: '#334155', fontWeight: 500 }}>
                            {r.requestNo}
                          </code>
                        </td>
                        <td>
                          <div className="sr-student-cell">
                            <div className="sr-avatar">{studentInitials}</div>
                            <div className="sr-student-info">
                              <span className="sr-student-name">{r.studentId?.name || '—'}</span>
                              <span className="sr-student-email">{r.studentId?.email || '—'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 500 }}>{department}</span>
                        </td>
                        <td>
                          <span style={{ color: '#64748B' }}>{r.studentId?.email || '—'}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontWeight: 500 }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                            <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={11} />
                              {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                        <td>
                          {getStatusBadge(r.status)}
                        </td>
                        <td>
                          <div className="sr-actions-cell">
                            {/* 1. View Icon Button */}
                            {activeTab === 'unlock' && (
                              <button 
                                className="sr-icon-btn view" 
                                onClick={() => handleViewUnlockDetails(r as UnlockRequest)}
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                            )}
                            {activeTab === 'profile' && (
                              <button 
                                className="sr-icon-btn view" 
                                onClick={() => handleViewProfileDetails(r as ProfileUpdateRequest)}
                                title="Compare Changes"
                              >
                                <Eye size={16} />
                              </button>
                            )}

                            {/* 2. Approve Icon Button */}
                            {activeTab === 'unlock' && (
                              <button 
                                className="sr-icon-btn approve" 
                                onClick={() => handleApproveUnlock(r._id)}
                                disabled={actioning}
                                title="Approve"
                              >
                                <Check size={16} />
                              </button>
                            )}
                            {activeTab === 'profile' && (
                              <button 
                                className="sr-icon-btn approve" 
                                onClick={() => handleApproveProfile(r._id)}
                                disabled={actioning}
                                title="Approve"
                              >
                                <Check size={16} />
                              </button>
                            )}
                            {activeTab === 'dropdown' && (
                              <button 
                                className="sr-icon-btn approve" 
                                onClick={() => setApproveDropdownModal({ isOpen: true, request: r as DropdownRequest, value: (r as DropdownRequest).requestedValue })}
                                disabled={actioning}
                                title="Approve"
                              >
                                <Check size={16} />
                              </button>
                            )}
                            {activeTab === 'forgot' && (
                              <button 
                                className="sr-icon-btn approve" 
                                onClick={() => setResetPwdModal({ isOpen: true, request: r as ForgotPasswordRequest, newPassword: '', confirmPassword: '', showPassword: false })}
                                disabled={actioning}
                                title="Reset & Approve"
                              >
                                <Check size={16} />
                              </button>
                            )}

                            {/* 3. Reject Icon Button */}
                            {activeTab === 'unlock' && (
                              <button 
                                className="sr-icon-btn reject" 
                                onClick={() => setRejectModal({ isOpen: true, type: 'unlock', id: r._id, reason: '' })}
                                disabled={actioning}
                                title="Reject"
                              >
                                <X size={16} />
                              </button>
                            )}
                            {activeTab === 'profile' && (
                              <button 
                                className="sr-icon-btn reject" 
                                onClick={() => setRejectModal({ isOpen: true, type: 'profile', id: r._id, reason: '' })}
                                disabled={actioning}
                                title="Reject"
                              >
                                <X size={16} />
                              </button>
                            )}
                            {activeTab === 'dropdown' && (
                              <button 
                                className="sr-icon-btn reject" 
                                onClick={() => handleRejectDropdown(r._id)}
                                disabled={actioning}
                                title="Reject"
                              >
                                <X size={16} />
                              </button>
                            )}
                            {activeTab === 'forgot' && (
                              <button 
                                className="sr-icon-btn reject" 
                                onClick={() => handleRejectForgot(r._id)}
                                disabled={actioning}
                                title="Reject"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer */}
          {!loading && filteredData.length > 0 && (
            <div className="sr-footer">
              <div className="sr-footer-text">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
              </div>
              <div className="sr-pagination">
                <button
                  className="sr-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(c => c - 1)}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => (
                  <button
                    key={pNum}
                    className={`sr-page-btn ${currentPage === pNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pNum)}
                  >
                    {pNum}
                  </button>
                ))}
                <button
                  className="sr-page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(c => c + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 5. Bottom Information Card */}
        <div className="sr-bottom-card">
          <div className="sr-bottom-left">
            <h4>About {getActiveTabTitle()}</h4>
            <p>{getActiveTabDescription()}</p>
          </div>
          
          <div className="sr-bottom-right">
            {/* Stat Card 1 */}
            <div className="sr-stat-card">
              <div className="sr-stat-icon-wrap" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                <HelpCircle size={18} />
              </div>
              <span className="sr-stat-number">{total}</span>
              <span className="sr-stat-label">Total Requests</span>
            </div>

            {/* Stat Card 2 */}
            <div className="sr-stat-card">
              <div className="sr-stat-icon-wrap" style={{ background: '#FFF7ED', color: '#EA580C' }}>
                <Clock size={18} />
              </div>
              <span className="sr-stat-number">{pending}</span>
              <span className="sr-stat-label">Pending</span>
            </div>

            {/* Stat Card 3 */}
            <div className="sr-stat-card">
              <div className="sr-stat-icon-wrap" style={{ background: '#F0FDF4', color: '#16A34A' }}>
                <Check size={18} />
              </div>
              <span className="sr-stat-number">{approved}</span>
              <span className="sr-stat-label">Approved</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS & DIALOGS (kept identical functional forms as requested) --- */}

      {/* --- MODAL: Unlock Request Details --- */}
      {selectedUnlock && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedUnlock(null)}>
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Unlock Request Details</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedUnlock(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 12px', fontSize: '0.9rem', marginBottom: 20 }}>
                <strong>Request No:</strong> <span>{selectedUnlock.requestNo}</span>
                <strong>Student:</strong> <span>{selectedUnlock.studentId?.name}</span>
                <strong>Email:</strong> <span>{selectedUnlock.studentId?.email}</span>
                <strong>Type:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedUnlock.requestType.replace('_', ' ')}</span>
                <strong>Reason:</strong> <span>{selectedUnlock.reason}</span>
                <strong>Created At:</strong> <span>{new Date(selectedUnlock.createdAt).toLocaleString()}</span>
              </div>

              {selectedUnlock.requestType === 'field_correction' && selectedUnlock.correctionFields && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: 8, color: 'var(--primary)' }}>Requested Field Corrections</h4>
                  <div className="table-wrap">
                    <table style={{ fontSize: '0.8rem' }}>
                      <thead>
                        <tr>
                          <th>Section</th>
                          <th>Field Name</th>
                          <th>Current Value</th>
                          <th>Requested Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUnlock.correctionFields.map((f, i) => (
                          <tr key={i}>
                            <td style={{ textTransform: 'capitalize' }}>{f.section}</td>
                            <td>{f.field}</td>
                            <td style={{ color: '#dc2626' }}>{String(f.currentValue || '—')}</td>
                            <td style={{ color: '#059669', fontWeight: 600 }}>{String(f.requestedValue || '—')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setSelectedUnlock(null)}>Close</button>
              <button
                type="button"
                className="btn"
                style={{ background: '#dc2626', color: 'white' }}
                onClick={() => {
                  setSelectedUnlock(null);
                  setRejectModal({ isOpen: true, type: 'unlock', id: selectedUnlock._id, reason: '' });
                }}
              >
                Reject
              </button>
              <button
                type="button"
                className="btn"
                style={{ background: '#059669', color: 'white' }}
                onClick={() => handleApproveUnlock(selectedUnlock._id)}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: Profile Update Comparison Screen --- */}
      {selectedProfile && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedProfile(null)}>
          <div className="modal" style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-header">
              <h3>Profile Update Comparison</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedProfile(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px 12px', fontSize: '0.85rem', marginBottom: 16 }}>
                <strong>Request No:</strong> <span>{selectedProfile.request.requestNo}</span>
                <strong>Student:</strong> <span>{selectedProfile.request.studentId?.name}</span>
                <strong>Email:</strong> <span>{selectedProfile.request.studentId?.email}</span>
              </div>

              <div className="info-banner info-banner-info" style={{ marginBottom: 16, fontSize: '0.8rem' }}>
                <span>Only fields with modifications are highlighted below.</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {Object.entries(selectedProfile.request.changes || {}).map(([sectionKey, fieldsObj]: [string, any]) => {
                  const changedFields = Object.entries(fieldsObj).filter(([fieldKey, value]) => {
                    const currentVal = selectedProfile.currentProfile?.[sectionKey]?.[fieldKey];
                    return JSON.stringify(currentVal) !== JSON.stringify(value);
                  });

                  if (changedFields.length === 0) return null;

                  return (
                    <div key={sectionKey} className="card" style={{ padding: 12 }}>
                      <h4 style={{ textTransform: 'capitalize', fontSize: '0.85rem', marginBottom: 10, color: 'var(--primary)', borderBottom: '1px solid #f1f5f9', paddingBottom: 4 }}>
                        {sectionKey.replace('_', ' ')}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {changedFields.map(([fieldKey, requestedVal]) => {
                          const currentVal = selectedProfile.currentProfile?.[sectionKey]?.[fieldKey];
                          return (
                            <div key={fieldKey} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 8, fontSize: '0.8rem' }}>
                              <strong style={{ alignSelf: 'center', textTransform: 'capitalize' }}>
                                {fieldKey.replace(/([A-Z])/g, ' $1')}
                              </strong>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 24px 1fr', gap: 8, alignItems: 'center' }}>
                                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '6px 10px', borderRadius: 4 }}>
                                  {currentVal === undefined || currentVal === null ? <em>(None)</em> : String(currentVal)}
                                </div>
                                <div style={{ textAlign: 'center', fontWeight: 700 }}>&darr;</div>
                                <div style={{ background: '#dcfce7', color: '#166534', padding: '6px 10px', borderRadius: 4, fontWeight: 500 }}>
                                  {requestedVal === undefined || requestedVal === null ? <em>(Cleared)</em> : String(requestedVal)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setSelectedProfile(null)}>Close</button>
              <button
                type="button"
                className="btn"
                style={{ background: '#dc2626', color: 'white' }}
                onClick={() => {
                  setSelectedProfile(null);
                  setRejectModal({ isOpen: true, type: 'profile', id: selectedProfile.request._id, reason: '' });
                }}
              >
                Reject
              </button>
              <button
                type="button"
                className="btn"
                style={{ background: '#059669', color: 'white' }}
                onClick={() => handleApproveProfile(selectedProfile.request._id)}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: Approve Dropdown & Edit Value --- */}
      {approveDropdownModal.isOpen && approveDropdownModal.request && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setApproveDropdownModal({ isOpen: false, request: null, value: '' })}>
          <div className="modal">
            <div className="modal-header">
              <h3>Approve Dropdown Value</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setApproveDropdownModal({ isOpen: false, request: null, value: '' })}><X size={18} /></button>
            </div>
            <form onSubmit={handleApproveDropdown}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Student Requested Value</label>
                  <input
                    className="form-input"
                    type="text"
                    readOnly
                    value={approveDropdownModal.request.requestedValue}
                    style={{ backgroundColor: 'var(--bg)', color: 'var(--text-muted)' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Final Approved Value (Editable) *</label>
                  <input
                    className="form-input"
                    type="text"
                    required
                    value={approveDropdownModal.value}
                    onChange={e => setApproveDropdownModal(m => ({ ...m, value: e.target.value }))}
                    autoFocus
                  />
                  <p className="form-hint">You can refine or correct the spelling before approving.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setApproveDropdownModal({ isOpen: false, request: null, value: '' })}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actioning}>Approve</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: Reset Password --- */}
      {resetPwdModal.isOpen && resetPwdModal.request && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setResetPwdModal(m => ({ ...m, isOpen: false }))}>
          <div className="modal">
            <div className="modal-header">
              <h3>Reset Student Password</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setResetPwdModal(m => ({ ...m, isOpen: false }))}><X size={18} /></button>
            </div>
            <form onSubmit={handleResetPassword}>
              <div className="modal-body" style={{ position: 'relative' }}>
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">New Password *</label>
                  <input
                    className="form-input"
                    type={resetPwdModal.showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Enter new password"
                    value={resetPwdModal.newPassword}
                    onChange={e => setResetPwdModal(m => ({ ...m, newPassword: e.target.value }))}
                  />
                  <button
                    type="button"
                    style={{ position: 'absolute', right: 10, top: 32, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                    onClick={() => setResetPwdModal(m => ({ ...m, showPassword: !m.showPassword }))}
                  >
                    {resetPwdModal.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password *</label>
                  <input
                    className="form-input"
                    type={resetPwdModal.showPassword ? 'text' : 'password'}
                    required
                    placeholder="Confirm new password"
                    value={resetPwdModal.confirmPassword}
                    onChange={e => setResetPwdModal(m => ({ ...m, confirmPassword: e.target.value }))}
                  />
                </div>

                <div style={{ marginTop: 8 }}>
                  <ul style={{ paddingLeft: 20, fontSize: '0.8rem', color: '#64748b', listStyleType: 'disc' }}>
                    <li style={{ color: resetPwdModal.newPassword.length >= 6 ? '#059669' : '#64748b' }}>Must be at least 6 characters</li>
                    <li style={{ color: resetPwdModal.newPassword && resetPwdModal.newPassword === resetPwdModal.confirmPassword ? '#059669' : '#64748b' }}>Passwords must match</li>
                  </ul>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setResetPwdModal(m => ({ ...m, isOpen: false }))}>Cancel</button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actioning || resetPwdModal.newPassword.length < 6 || resetPwdModal.newPassword !== resetPwdModal.confirmPassword}
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: Rejection Reason Dialog --- */}
      {rejectModal.isOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setRejectModal(m => ({ ...m, isOpen: false }))}>
          <div className="modal">
            <div className="modal-header">
              <h3>Provide Rejection Reason</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setRejectModal(m => ({ ...m, isOpen: false }))}><X size={18} /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (rejectModal.type === 'unlock') {
                handleRejectUnlock(rejectModal.id, rejectModal.reason);
              } else if (rejectModal.type === 'profile') {
                handleRejectProfile(rejectModal.id, rejectModal.reason);
              }
            }}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Reason for Rejection *</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    required
                    placeholder="E.g. Incomplete supporting documents."
                    value={rejectModal.reason}
                    onChange={e => setRejectModal(m => ({ ...m, reason: e.target.value }))}
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setRejectModal(m => ({ ...m, isOpen: false }))}>Cancel</button>
                <button type="submit" className="btn" style={{ background: '#dc2626', color: 'white' }} disabled={actioning}>
                  Reject Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: General Confirmation Dialog --- */}
      {confirmDialog.isOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>{confirmDialog.title}</h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: '#334155' }}>{confirmDialog.message}</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmDialog(d => ({ ...d, isOpen: false }))}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={confirmDialog.onConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
