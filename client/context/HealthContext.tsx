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
    }
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
    getProfessionalRatings: (professionalId: string, page?: number, limit?: number) => Promise<void>;
    updateProfessionalAvailability: (available: boolean) => Promise<void>;
    updateProfessionalProfile: (data: Partial<User['healthcareProfile']>) => Promise<void>;
    clearSelectedProfessional: () => void;
}

export const HealthcareContext = createContext<HealthcareContextProps | undefined>(undefined);

export const HealthcareProvider = ({ children }: { children: ReactNode }) => {
    const [healthcare, dispatch] = useReducer(healthcareReducer, initialState);
    const { showAlert } = useToast();

    const handleError = (title: string, err: any) => {
        const msg = err?.message || 'Something went wrong';
        showAlert({ message: `${title}: ${msg}`, type: 'error' });
        throw err;
    };

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
    }, [healthcare.filters, healthcare.cache, showAlert]);

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
            const newRating = await apiFetch<IRating>(`/healthcare/professionals/${professionalId}/rate`, {
                method: 'POST',
                body: { rating, comment, appointmentId }
            });

            dispatch({ type: 'ADD_RATING', payload: newRating });

            // Update professional in list if exists
            const updatedProfessional = await apiFetch<HealthcareProfessional>(
                `/healthcare/professionals/${professionalId}`
            );
            dispatch({ type: 'UPDATE_PROFESSIONAL', payload: updatedProfessional });

            showAlert({ message: 'Rating submitted successfully!', type: 'success' });
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
    const getProfessionalRatings = async (professionalId: string, page: number = 1, limit: number = 10) => {
        try {
            const response = await apiFetch<{ ratings: IRating[]; total: number; page: number; limit: number }>(
                `/healthcare/professionals/${professionalId}/ratings?page=${page}&limit=${limit}`
            );
            dispatch({ type: 'SET_RATINGS', payload: response.ratings });
        } catch (err: any) {
            handleError('Failed to load ratings', err);
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