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
    tips: []
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

            const queryParams = new URLSearchParams();
            const effectiveFilters = { ...healthcare.filters, ...filters };

            Object.entries(effectiveFilters).forEach(([key, value]) => {
                if (value !== undefined && value !== '' && value !== null) {
                    queryParams.append(key, value.toString());
                }
            });

            const endpoint = `/healthcare/professionals?${queryParams.toString()}`;
            const data = await apiFetch<ProfessionalsResponse>(endpoint);

            dispatch({ type: 'SET_PROFESSIONALS', payload: data.professionals });
            dispatch({ type: 'SET_FILTERS', payload: effectiveFilters });
        } catch (err: any) {
            handleError('Failed to fetch professionals', err);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [healthcare.filters]);

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