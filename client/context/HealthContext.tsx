// src/context/HealthcareContext.tsx
'use client';

import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { apiFetch } from '@/Utils/api';
import {
    HealthcareProfessional,
    ProfessionalsFilter,
    ProfessionalsResponse,
    IRating,
    ITip,
    User
} from '@/types/auth.d';
import { useToast } from '@/Hooks/useToast.d';

// ---------- NEW TYPES ----------
export interface Appointment {
    id: string;
    patientId: any;
    professionalId: any;
    type: 'virtual' | 'physical';
    date: string;
    duration: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
    notes?: string;
    createdAt: string;
    updatedAt: string;
    endDate?: string;
    patient?: {
        name: string;
        profile?: { avatar?: string };
        phoneNumber?: string;
        email?: string;
    };
    professional?: {
        name: string;
        profile?: { avatar?: string; specialization?: string };
        healthcareProfile?: any;
    };
}

interface PastAppointment {
  id: string;
  patientId: any;
  professionalId: any;
  type: 'virtual' | 'physical';
  date: string;
  endDate?: string;
  duration: number;
  status: 'completed' | 'cancelled' | 'rejected';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  patient?: {
    name: string;
    profile?: { avatar?: string };
    phoneNumber?: string;
    email?: string;
  };
  professional?: {
    name: string;
    profile?: { 
      avatar?: string; 
      specialization?: string;
      department?: string;
    };
    healthcareProfile?: {
      averageRating?: number;
      totalRatings?: number;
    };
  };
}

interface PastAppointmentsResponse {
  appointments: PastAppointment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AppointmentsResponse {
    appointments: Appointment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface HealthcareState {
    professionals: HealthcareProfessional[];
    selectedProfessional: HealthcareProfessional | null;
    loading: boolean;
    filters: ProfessionalsFilter;
    ratings: IRating[];
    tips: ITip[];
    cache: {
        professionals: Map<string, HealthcareProfessional[]>;
        lastFetch: number;
    };
}

interface HealthcareState {
  // ... existing state
  pastAppointments: PastAppointment[];
  recentPastAppointment: PastAppointment | null;
  pastAppointmentsLoading: boolean;
}

type Action =
    | { type: 'SET_PROFESSIONALS'; payload: HealthcareProfessional[] }
    | { type: 'SET_SELECTED_PROFESSIONAL'; payload: HealthcareProfessional | null }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_FILTERS'; payload: Partial<ProfessionalsFilter> }
    | { type: 'SET_RATINGS'; payload: IRating[] }
    | { type: 'SET_TIPS'; payload: ITip[] }
    | { type: 'ADD_RATING'; payload: IRating }
    | { type: 'ADD_TIP'; payload: ITip }
    | { type: 'UPDATE_PROFESSIONAL'; payload: HealthcareProfessional }
    | { type: 'UPDATE_CACHE'; payload: { professionals: Map<string, HealthcareProfessional[]>; lastFetch: number } }
    | { type: 'UPDATE_RATING'; payload: { id: string; rating: Partial<IRating> } }
    | { type: 'SET_RECENT_PAST_APPOINTMENT'; payload: PastAppointment | null }
    | { type: 'SET_PAST_APPOINTMENTS'; payload: PastAppointment[] }
    | { type: 'SET_PAST_APPOINTMENTS_LOADING'; payload: boolean }
    | { type: 'RESET' };

const initialState: HealthcareState = {
    professionals: [],
    selectedProfessional: null,
    loading: false,
    filters: {
        role: undefined,
        location: '',
        specialization: '',
        minRating: 0,
        availability: false,
        page: 1,
        limit: 20,
        sortBy: 'rating'
    },
    ratings: [],
    tips: [],
    cache: {
        professionals: new Map(),
        lastFetch: 0
    },
    pastAppointments: [],
    recentPastAppointment: null,
    pastAppointmentsLoading: false,
};

const generateCacheKey = (filters: Partial<ProfessionalsFilter>): string => {
    return JSON.stringify({
        city: filters.city,
        state: filters.state,
        country: filters.country,
        role: filters.role,
        specialization: filters.specialization,
        minRating: filters.minRating,
        sortBy: filters.sortBy,
        latitude: filters.latitude,
        longitude: filters.longitude,
        maxDistance: filters.maxDistance
    });
};

function healthcareReducer(state: HealthcareState, action: Action): HealthcareState {
    switch (action.type) {
        case 'SET_PROFESSIONALS':
            return { ...state, professionals: action.payload };
        case 'SET_SELECTED_PROFESSIONAL':
            return { ...state, selectedProfessional: action.payload };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_FILTERS':
            return { ...state, filters: { ...state.filters, ...action.payload } };
        case 'SET_RECENT_PAST_APPOINTMENT':
             return { ...state, recentPastAppointment: action.payload };
        case 'SET_PAST_APPOINTMENTS':
            return { ...state, pastAppointments: action.payload };
        case 'SET_PAST_APPOINTMENTS_LOADING':
            return { ...state, pastAppointmentsLoading: action.payload };
        case 'SET_RATINGS':
            return { ...state, ratings: action.payload };
        case 'SET_TIPS':
            return { ...state, tips: action.payload };
        case 'ADD_RATING':
            return { ...state, ratings: [action.payload, ...state.ratings] };
        case 'ADD_TIP':
            return { ...state, tips: [action.payload, ...state.tips] };
        case 'UPDATE_PROFESSIONAL':
            return {
                ...state,
                professionals: state.professionals.map(prof =>
                    prof.id === action.payload.id ? action.payload : prof
                ),
                selectedProfessional: state.selectedProfessional?.id === action.payload.id
                    ? action.payload
                    : state.selectedProfessional
            };
        case 'UPDATE_CACHE':
            return {
                ...state,
                cache: {
                    professionals: action.payload.professionals,
                    lastFetch: action.payload.lastFetch
                }
            };
        case 'UPDATE_RATING':
            return {
                ...state,
                ratings: state.ratings.map(rating =>
                    rating.id === action.payload.id 
                        ? { ...rating, ...action.payload.rating }
                        : rating
                )
            };
            
        case 'RESET':
            return initialState;
        default:
            return state;
    }
}

interface HealthcareContextProps {
    healthcare: HealthcareState;
    fetchProfessionals: (filters?: Partial<ProfessionalsFilter>) => Promise<void>;
    getProfessionalProfile: (professionalId: string) => Promise<void>;
    rateProfessional: (professionalId: string, rating: number, comment?: string, appointmentId?: string) => Promise<IRating>;
    tipProfessional: (professionalId: string, amount: number, message?: string, appointmentId?: string) => Promise<ITip>;
    updateFilters: (filters: Partial<ProfessionalsFilter>) => void;
    getProfessionalRatings: (professionalId: string, page?: number, limit?: number) => Promise<{ ratings: IRating[]; total: number; page: number; limit: number }>;
    updateProfessionalAvailability: (available: boolean) => Promise<void>;
    updateProfessionalProfile: (data: Partial<User['healthcareProfile']>) => Promise<void>;
    clearSelectedProfessional: () => void;
    getUserProfessionalRating: (professionalId: string) => Promise<{
        hasRated: boolean;
        id?: string;
        rating: number;
        comment?: string;
        createdAt?: string | null;
        updatedAt?: string | null;
    }>;
    bookAppointment: (
        professionalId: string,
        date: string,
        duration?: number,
        notes?: string,
        type?: 'physical' | 'virtual'
    ) => Promise<Appointment>;

    getMyAppointments: (filters?: {
        status?: string;
        type?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }) => Promise<AppointmentsResponse>;

    getMyBookings: (filters?: {
        status?: string;
        type?: string;
        upcoming?: boolean;
        page?: number;
        limit?: number;
    }) => Promise<AppointmentsResponse>;

    updateBooking: (
        appointmentId: string,
        updates: Partial<{ date: string; duration: number; notes: string; type: 'physical' | 'virtual' }>
    ) => Promise<Appointment>;

    cancelBooking: (appointmentId: string) => Promise<void>;

    updateAppointmentStatus: (appointmentId: string, status: 'confirmed' | 'rejected' | 'completed' | 'cancelled') => Promise<Appointment>;

    getAppointmentById: (appointmentId: string) => Promise<Appointment>; // for professional
    getBookingById: (appointmentId: string) => Promise<Appointment>;    
    getRecentPastAppointment: () => Promise<PastAppointment | null>;
    getPastAppointments: (filters?: {
        page?: number;
        limit?: number;
        type?: string;
        professionalId?: string;
        patientId?: string;
        startDate?: string;
        endDate?: string;
    }) => Promise<PastAppointmentsResponse>;
    
    // State for past appointments
    pastAppointments: PastAppointment[];
    recentPastAppointment: PastAppointment | null;
    pastAppointmentsLoading: boolean;
}

export const HealthcareContext = createContext<HealthcareContextProps | undefined>(undefined);

export const HealthcareProvider = ({ children }: { children: ReactNode }) => {
    const [healthcare, dispatch] = useReducer(healthcareReducer, initialState);
    const { showAlert } = useToast();

    const handleError = useCallback((title: string, err: any) => {
        const msg = err?.message || 'Something went wrong';
        showAlert({ message: `${title}: ${msg}`, type: 'error' });
        throw err;
    }, [showAlert]);

    /* ---------- Fetch healthcare professionals ---------- */
    const fetchProfessionals = useCallback(async (filters?: Partial<ProfessionalsFilter>) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            const effectiveFilters = { ...healthcare.filters, ...filters };
            const cacheKey = generateCacheKey(effectiveFilters);
            const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

            // Check cache
            const now = Date.now();
            const cachedData = healthcare.cache.professionals.get(cacheKey);

            if (cachedData && (now - healthcare.cache.lastFetch) < CACHE_DURATION) {
                dispatch({ type: 'SET_PROFESSIONALS', payload: cachedData });
                dispatch({ type: 'SET_FILTERS', payload: effectiveFilters });
                return;
            }

            // Build query params for cascading search
            const queryParams = new URLSearchParams();

            // Location data for cascading search
            if (effectiveFilters.city) queryParams.append('city', effectiveFilters.city);
            if (effectiveFilters.state) queryParams.append('state', effectiveFilters.state);
            if (effectiveFilters.country) queryParams.append('country', effectiveFilters.country);
            if (effectiveFilters.latitude) queryParams.append('latitude', effectiveFilters.latitude.toString());
            if (effectiveFilters.longitude) queryParams.append('longitude', effectiveFilters.longitude.toString());
            if (effectiveFilters.maxDistance) queryParams.append('maxDistance', effectiveFilters.maxDistance.toString());

            // Other filters
            Object.entries(effectiveFilters).forEach(([key, value]) => {
                if (value !== undefined && value !== '' && value !== null &&
                    !['city', 'state', 'country', 'latitude', 'longitude', 'maxDistance'].includes(key)) {
                    queryParams.append(key, value.toString());
                }
            });

            const endpoint = `/healthcare/professionals?${queryParams.toString()}`;
            const data = await apiFetch<ProfessionalsResponse>(endpoint);

            // Update cache
            const newCache = new Map(healthcare.cache.professionals);
            newCache.set(cacheKey, data.professionals);

            dispatch({ type: 'SET_PROFESSIONALS', payload: data.professionals });
            dispatch({ type: 'SET_FILTERS', payload: effectiveFilters });
            dispatch({
                type: 'UPDATE_CACHE',
                payload: {
                    professionals: newCache,
                    lastFetch: now
                }
            });

            if (data.message) {
                showAlert({
                    message: data.message,
                    type: 'info',
                    duration: 3000
                });
            }
        } catch (err: any) {
            handleError('Failed to fetch professionals', err);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [healthcare.filters, healthcare.cache, showAlert, handleError]);

    /* ---------- Get professional profile ---------- */
    const getProfessionalProfile = async (professionalId: string) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const professional = await apiFetch<HealthcareProfessional>(
                `/healthcare/professionals/${professionalId}`
            );
            dispatch({ type: 'SET_SELECTED_PROFESSIONAL', payload: professional });
        } catch (err: any) {
            handleError('Failed to load professional profile', err);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    /* ---------- Rate professional ---------- */
    const rateProfessional = async (
        professionalId: string,
        rating: number,
        comment?: string,
        appointmentId?: string
    ): Promise<IRating> => {
        try {
            // First, check user's current rating
            const userRating = await getUserProfessionalRating(professionalId);
            
            let endpoint: string;
            let method: 'POST' | 'PUT';
            let body: any = { rating, comment, appointmentId };
            
            if (userRating.hasRated && userRating.id) {
                // Update existing rating - USE THE CORRECT ENDPOINT
                endpoint = `/healthcare/professionals/${professionalId}/rate`;
                method = 'PUT';
            } else {
                // Create new rating
                endpoint = `/healthcare/professionals/${professionalId}/rate`;
                method = 'POST';
            }
            
            const newRating = await apiFetch<IRating>(endpoint, {
                method,
                body
            });

            // Dispatch based on whether it's an update or new
            if (userRating.hasRated && userRating.id) {
                dispatch({ 
                    type: 'UPDATE_RATING', 
                    payload: { 
                        id: userRating.id, 
                        rating: newRating 
                    }
                });
            } else {
                dispatch({ type: 'ADD_RATING', payload: newRating });
            }

            showAlert({ 
                message: `Rating ${userRating.hasRated ? 'updated' : 'submitted'} successfully!`, 
                type: 'success' 
            });

            return newRating;
        } catch (err: any) {
            handleError('Failed to submit rating', err);
            throw err;
        }
    };

    /* ---------- Tip professional ---------- */
    const tipProfessional = async (
        professionalId: string,
        amount: number,
        message?: string,
        appointmentId?: string
    ): Promise<ITip> => {
        try {
            const tip = await apiFetch<ITip>(`/healthcare/professionals/${professionalId}/tip`, {
                method: 'POST',
                body: { amount, message, appointmentId }
            });

            dispatch({ type: 'ADD_TIP', payload: tip });

            // Update professional stats
            const updatedProfessional = await apiFetch<HealthcareProfessional>(
                `/healthcare/professionals/${professionalId}`
            );
            dispatch({ type: 'UPDATE_PROFESSIONAL', payload: updatedProfessional });

            showAlert({ message: 'Tip sent successfully!', type: 'success' });
            return tip;
        } catch (err: any) {
            handleError('Failed to send tip', err);
            throw err;
        }
    };

    /* ---------- Get professional ratings ---------- */
    const getProfessionalRatings = async (
        professionalId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{ ratings: IRating[]; total: number; page: number; limit: number }> => {
        try {
            const response = await apiFetch<{ ratings: IRating[]; total: number; page: number; limit: number }>(
                `/healthcare/professionals/${professionalId}/ratings?page=${page}&limit=${limit}`
            );
            dispatch({ type: 'SET_RATINGS', payload: response.ratings });
            return response;
        } catch (err: any) {
            handleError('Failed to load ratings', err);
            throw err; // ← Add this line!
        }
    };

    /* ---------- Update professional availability ---------- */
    const updateProfessionalAvailability = async (available: boolean) => {
        try {
            const updatedProfessional = await apiFetch<HealthcareProfessional>('/user/me/availability', {
                method: 'PATCH',
                body: { available }
            });

            dispatch({ type: 'UPDATE_PROFESSIONAL', payload: updatedProfessional });
            showAlert({
                message: `You are now ${available ? 'available' : 'unavailable'} for consultations`,
                type: 'success'
            });
        } catch (err: any) {
            handleError('Failed to update availability', err);
            throw err;
        }
    };

    /* ---------- Update professional profile ---------- */
    const updateProfessionalProfile = async (data: Partial<User['healthcareProfile']>) => {
        try {
            const updatedProfessional = await apiFetch<HealthcareProfessional>('/user/me/professional-profile', {
                method: 'PATCH',
                body: data
            });

            dispatch({ type: 'UPDATE_PROFESSIONAL', payload: updatedProfessional });
            showAlert({ message: 'Professional profile updated successfully!', type: 'success' });
        } catch (err: any) {
            handleError('Failed to update professional profile', err);
            throw err;
        }
    };

    /* ---------- Update filters ---------- */
    const updateFilters = (filters: Partial<ProfessionalsFilter>) => {
        dispatch({ type: 'SET_FILTERS', payload: filters });
    };

    /* ---------- Clear selected professional ---------- */
    const clearSelectedProfessional = () => {
        dispatch({ type: 'SET_SELECTED_PROFESSIONAL', payload: null });
    };

    /* ---------- Get user's rating for a professional ---------- */
    const getUserProfessionalRating = async (professionalId: string) => {
        try {
            const response = await apiFetch<{
                hasRated: boolean;
                id?: string;
                rating: number;
                comment?: string;
                createdAt?: string | null;
                updatedAt?: string | null;
            }>(`/healthcare/professionals/${professionalId}/user-rating`);
            
            return {
                hasRated: response.hasRated,
                id: response.id,
                rating: response.rating || 0,
                comment: response.comment || '',
                createdAt: response.createdAt || null,
                updatedAt: response.updatedAt || null
            };
        } catch (error) {
            console.error('Failed to get user rating:', error);
            return { 
                hasRated: false, 
                rating: 0, 
                comment: '', 
                createdAt: null,
                updatedAt: null
            };
        }
    };

    /** Book a new appointment (patient side) */
    const bookAppointment = async (
        professionalId: string,
        date: string,
        duration: number = 60,
        notes?: string,
        type: 'physical' | 'virtual' = 'physical'
    ): Promise<Appointment> => {
        try {
            const appointment = await apiFetch<Appointment>(`/healthcare/professionals/${professionalId}/book`, {
                method: 'POST',
                body: { date, duration, notes, type }
            });

            showAlert({ message: 'Booking request sent! Awaiting confirmation.', type: 'success' });
            return appointment;
        } catch (err: any) {
            handleError('Failed to book appointment', err);
            throw err;
        }
    };

    /** Get professional's appointments */
    const getMyAppointments = async (filters = {}) => {
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) params.append(key, value.toString());
            });

            const response = await apiFetch<AppointmentsResponse>(
                `/healthcare/professionals/appointments/my?${params.toString()}`
            );

            return response;
        } catch (err: any) {
            handleError('Failed to load your appointments', err);
            throw err;
        }
    };

    /** Get patient's bookings */
    const getMyBookings = async (
        filters?: {
            status?: string;
            type?: string;
            upcoming?: boolean;
            page?: number;
            limit?: number;
        }
    ): Promise<AppointmentsResponse> => {
        try {
            // Apply default: upcoming=true if not provided
            const effectiveFilters = { upcoming: true, ...filters };

            const params = new URLSearchParams();
            Object.entries(effectiveFilters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) params.append(key, String(value));
            });

            const response = await apiFetch<AppointmentsResponse>(
                `/healthcare/bookings/my?${params.toString()}`
            );

            return response;
        } catch (err: any) {
            handleError('Failed to load your bookings', err);
            throw err;
        }
    };

    /** Update a pending booking (patient side) */
    const updateBooking = async (
        appointmentId: string,
        updates: Partial<{ date: string; duration: number; notes: string; type: 'physical' | 'virtual' }>
    ): Promise<Appointment> => {
        try {
            const appointment = await apiFetch<Appointment>(`/healthcare/bookings/${appointmentId}`, {
                method: 'PUT',
                body: updates
            });

            showAlert({ message: 'Booking updated successfully', type: 'success' });
            return appointment;
        } catch (err: any) {
            handleError('Failed to update booking', err);
            throw err;
        }
    };

    /** Cancel a booking (patient side) */
    const cancelBooking = async (appointmentId: string): Promise<void> => {
        try {
            await apiFetch(`/healthcare/bookings/${appointmentId}`, {
                method: 'DELETE'
            });

            showAlert({ message: 'Booking cancelled successfully', type: 'info' });
        } catch (err: any) {
            handleError('Failed to cancel booking', err);
            throw err;
        }
    };

    /** Update appointment status (professional side) */
    const updateAppointmentStatus = async (
        appointmentId: string,
        status: 'confirmed' | 'rejected' | 'completed' | 'cancelled'
    ): Promise<Appointment> => {
        try {
            const appointment = await apiFetch<Appointment>(`/healthcare/professionals/appointments/${appointmentId}/status`, {
                method: 'PUT',
                body: { status }
            });

            showAlert({ message: `Appointment ${status} successfully`, type: 'success' });
            return appointment;
        } catch (err: any) {
            handleError('Failed to update appointment status', err);
            throw err;
            }
        };

    /** Get single appointment details (professional view) */
    const getAppointmentById = async (appointmentId: string): Promise<Appointment> => {
        try {
            const appointment = await apiFetch<Appointment>(`/healthcare/professionals/appointments/${appointmentId}`);
            return appointment;
        } catch (err: any) {
            handleError('Failed to load appointment details', err);
            throw err;
        }
    };

    /** Get single booking details (patient view) */
    const getBookingById = async (appointmentId: string): Promise<Appointment> => {
        try {
            const booking = await apiFetch<Appointment>(`/healthcare/bookings/${appointmentId}`);
            return booking;
        } catch (err: any) {
            handleError('Failed to load booking details', err);
            throw err;
        }
    };

    /* ---------- Get recent past appointment ---------- */
    const getRecentPastAppointment = useCallback(async (): Promise<PastAppointment | null> => {
    try {
        dispatch({ type: 'SET_PAST_APPOINTMENTS_LOADING', payload: true });
        
        const response = await apiFetch<{ appointment: PastAppointment | null }>(
        '/healthcare/appointments/past/recent'
        );
        
        dispatch({ type: 'SET_RECENT_PAST_APPOINTMENT', payload: response.appointment });
        return response.appointment;
    } catch (err: any) {
        console.error('Failed to load recent past appointment:', err);
        return null;
    } finally {
        dispatch({ type: 'SET_PAST_APPOINTMENTS_LOADING', payload: false });
    }
    }, []);

    /* ---------- Get all past appointments ---------- */
    const getPastAppointments = useCallback(async (filters = {}): Promise<PastAppointmentsResponse> => {
    try {
        dispatch({ type: 'SET_PAST_APPOINTMENTS_LOADING', payload: true });
        
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            params.append(key, value.toString());
        }
        });
        
        const response = await apiFetch<PastAppointmentsResponse>(
        `/healthcare/appointments/past?${params.toString()}`
        );
        
        dispatch({ type: 'SET_PAST_APPOINTMENTS', payload: response.appointments });
        return response;
    } catch (err: any) {
        handleError('Failed to load past appointments', err);
        throw err;
    } finally {
        dispatch({ type: 'SET_PAST_APPOINTMENTS_LOADING', payload: false });
    }
    }, [handleError]);

    return (
        <HealthcareContext.Provider
            value={{
                healthcare,
                fetchProfessionals,
                getProfessionalProfile,
                rateProfessional,
                tipProfessional,
                updateFilters,
                getProfessionalRatings,
                updateProfessionalAvailability,
                updateProfessionalProfile,
                clearSelectedProfessional,
                getUserProfessionalRating,
                bookAppointment,
                getMyAppointments,
                getMyBookings,
                updateBooking,
                cancelBooking,
                updateAppointmentStatus,
                getAppointmentById,
                getBookingById,
                getRecentPastAppointment,
                getPastAppointments,
                pastAppointments: healthcare.pastAppointments,
                recentPastAppointment: healthcare.recentPastAppointment,
                pastAppointmentsLoading: healthcare.pastAppointmentsLoading
            }}
        >
            {children}
        </HealthcareContext.Provider>
    );
};

/* -------------------------------------------------
   Hook
   ------------------------------------------------- */
export const useHealthcare = (): HealthcareContextProps => {
    const context = useContext(HealthcareContext);
    if (!context) {
        throw new Error('useHealthcare must be used within HealthcareProvider');
    }
    return context;
};