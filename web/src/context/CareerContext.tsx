'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { apiFetch } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { AuthContext } from './AuthContext';
import { UserRole } from '@/types/auth';

/* -------------------------------------------------
   Types
   ------------------------------------------------- */
export interface CareerApplication {
  _id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  desiredRole: UserRole;
  specialization: string;
  status: 'pending' | 'under_review' | 'interview_scheduled' | 'approved' | 'rejected';
  resumeUrl: string;
  profilePictureUrl: string;
  applicationDate: string;
  interviewDate?: string;
  interviewLink?: string;
  createdUserId?: string;
  yearsOfExperience?: number;
  licenseDocumentUrl?: string;
  preferredLocations?: string[] | undefined;
  dateOfBirth?: string;
  willingToRelocate?: boolean;
  gender: string;
  nationality: string;
  coverLetter?: string;
  currentPosition?: string;
  currentEmployer?: string;
  expectedSalary?: string;
}

export interface CareerApplicationFormData {
  email: string;
  phoneNumber: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  desiredRole: UserRole;
  specialization: string;
  yearsOfExperience: number;
  resume: File;
  profilePicture: File;
  coverLetter?: string;
  licenseDocument?: File;
  privacyConsent: boolean;
  termsAccepted: boolean;
}

export interface ApplicationsResponse {
  applications: CareerApplication[];
  total: number;
  page: number;
  limit: number;
}

/* -------------------------------------------------
   State & Reducer
   ------------------------------------------------- */
interface CareerState {
  applications: ApplicationsResponse | null;
  loading: boolean;
  submitting: boolean;
}

type Action =
  | { type: 'SET_APPLICATIONS'; payload: ApplicationsResponse }
  | { type: 'LOADING'; payload: boolean }
  | { type: 'SUBMITTING'; payload: boolean }
  | { type: 'UPDATE_APPLICATION'; payload: CareerApplication }
  | { type: 'RESET' };

const initialState: CareerState = {
  applications: null,
  loading: false,
  submitting: false,
};

function careerReducer(state: CareerState, action: Action): CareerState {
  switch (action.type) {
    case 'SET_APPLICATIONS':
      return { ...state, applications: action.payload };
    case 'LOADING':
      return { ...state, loading: action.payload };
    case 'SUBMITTING':
      return { ...state, submitting: action.payload };
    case 'UPDATE_APPLICATION':
      if (!state.applications) return state;
      return {
        ...state,
        applications: {
          ...state.applications,
          applications: state.applications.applications.map(app =>
            app._id === action.payload._id ? action.payload : app
          ),
        },
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

/* -------------------------------------------------
   Context
   ------------------------------------------------- */
interface CareerContextProps {
  career: CareerState;
  
  // Public actions
  submitApplication: (formData: FormData) => Promise<{ success: boolean; applicationId?: string }>;
  
  // Admin actions
  fetchApplications: (filters?: { status?: string; role?: string; page?: number }) => Promise<void>;
  updateStatus: (id: string, status: string, notes?: string) => Promise<void>;
  scheduleInterview: (id: string, date: string, link: string, notes?: string) => Promise<void>;
  approveApplication: (id: string, password: string) => Promise<void>;
  
  // Helper
  clearApplications: () => void;
}

const CareerContext = createContext<CareerContextProps | undefined>(undefined);

/* -------------------------------------------------
   Provider Component
   ------------------------------------------------- */
export const CareerProvider = ({ children }: { children: ReactNode }) => {
  const [career, dispatch] = useReducer(careerReducer, initialState);
  const { auth } = useContext(AuthContext)!;

  /* ---------- Submit Application (Public) ---------- */
  const submitApplication = useCallback(async (formData: FormData) => {
    dispatch({ type: 'SUBMITTING', payload: true });
    try {
      const result = await apiFetch<{ applicationId: string }>('/career/apply', {
        method: 'POST',
        body: formData,  // apiFetch handles FormData correctly (no JSON header)
      });
      toast.success('Application submitted successfully!');
      return { success: true, applicationId: result.applicationId };
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit application');
      return { success: false };
    } finally {
      dispatch({ type: 'SUBMITTING', payload: false });
    }
  }, []);

  /* ---------- Fetch Applications (Admin) ---------- */
  const fetchApplications = useCallback(async (
    filters: { status?: string; role?: string; page?: number } = {}
  ) => {
    // Only admins can fetch applications
    if (!auth.isAuth || auth.user?.role !== 'admin') return;
    
    dispatch({ type: 'LOADING', payload: true });
    
    try {
      const query = new URLSearchParams();
      if (filters.status) query.append('status', filters.status);
      if (filters.role) query.append('role', filters.role);
      if (filters.page) query.append('page', filters.page.toString());
      
      const endpoint = `/career/applications${query.toString() ? `?${query}` : ''}`;
      const data = await apiFetch<ApplicationsResponse>(endpoint);
      
      dispatch({ type: 'SET_APPLICATIONS', payload: data });
    } catch (error: any) {
      toast.error(error.message || 'Failed to load applications');
    } finally {
      dispatch({ type: 'LOADING', payload: false });
    }
  }, [auth.isAuth, auth.user?.role]);

  /* ---------- Update Status (Admin) ---------- */
  const updateStatus = useCallback(async (
    id: string,
    status: string,
    notes?: string
  ) => {
    if (!auth.isAuth || auth.user?.role !== 'admin') {
      throw new Error('Admin access required');
    }
    
    try {
      const updated = await apiFetch<CareerApplication>(`/career/applications/${id}/status`, {
        method: 'PATCH',
        body: { status, notes },
      });
      
      dispatch({ type: 'UPDATE_APPLICATION', payload: updated });
      toast.success(`Status updated to ${status}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
      throw error;
    }
  }, [auth.isAuth, auth.user?.role]);

  /* ---------- Schedule Interview (Admin) ---------- */
  const scheduleInterview = useCallback(async (
    id: string,
    date: string,
    link: string,
    notes?: string
  ) => {
    if (!auth.isAuth || auth.user?.role !== 'admin') {
      throw new Error('Admin access required');
    }
    
    try {
      const updated = await apiFetch<CareerApplication>(
        `/career/applications/${id}/schedule-interview`,
        {
          method: 'POST',
          body: { interviewDate: date, interviewLink: link, notes },
        }
      );
      
      dispatch({ type: 'UPDATE_APPLICATION', payload: updated });
      toast.success('Interview scheduled');
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule interview');
      throw error;
    }
  }, [auth.isAuth, auth.user?.role]);

  /* ---------- Approve Application (Admin) ---------- */
  const approveApplication = useCallback(async (
    id: string,
    password: string
  ) => {
    if (!auth.isAuth || auth.user?.role !== 'admin') {
      throw new Error('Admin access required');
    }
    
    try {
      const result = await apiFetch<{ application: CareerApplication; user: any }>(
        `/career/applications/${id}/approve`,
        {
          method: 'POST',
          body: { password },
        }
      );
      
      dispatch({ type: 'UPDATE_APPLICATION', payload: result.application });
      toast.success('Application approved and user account created');
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve application');
      throw error;
    }
  }, [auth.isAuth, auth.user?.role]);

  /* ---------- Clear Applications ---------- */
  const clearApplications = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  /* ---------- Auto-fetch for admins ---------- */
  useEffect(() => {
    if (auth.isReady && auth.isAuth && auth.user?.role === 'admin') {
      fetchApplications();
    }
  }, [auth.isReady, auth.isAuth, auth.user?.role, fetchApplications]);

  /* -------------------------------------------------
     Context Value
     ------------------------------------------------- */
  const contextValue: CareerContextProps = {
    career,
    submitApplication,
    fetchApplications,
    updateStatus,
    scheduleInterview,
    approveApplication,
    clearApplications,
  };

  return (
    <CareerContext.Provider value={contextValue}>
      {children}
    </CareerContext.Provider>
  );
};

/* -------------------------------------------------
   Hook
   ------------------------------------------------- */
export const useCareer = (): CareerContextProps => {
  const context = useContext(CareerContext);
  if (!context) {
    throw new Error('useCareer must be used within CareerProvider');
  }
  return context;
};