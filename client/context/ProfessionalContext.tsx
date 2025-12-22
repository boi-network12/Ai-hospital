// src/context/ProfessionalContext.tsx
'use client';

import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { apiFetch } from '@/Utils/api';
import { User, IHealthcareCertification, IRating, ITip } from '@/types/auth.d';
import { useAuth } from '@/Hooks/authHook.d';
import { useToast } from '@/Hooks/useToast.d';

interface ProfessionalState {
    profile: User | null;
    certifications: IHealthcareCertification[];
    ratings: IRating[];
    tips: ITip[];
    loading: boolean;
    stats: {
        totalEarnings: number;
        totalConsultations: number;
        averageRating: number;
        pendingAppointments: number;
    };
}

type Action =
    | { type: 'SET_PROFILE'; payload: User }
    | { type: 'SET_CERTIFICATIONS'; payload: IHealthcareCertification[] }
    | { type: 'SET_RATINGS'; payload: IRating[] }
    | { type: 'SET_TIPS'; payload: ITip[] }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_STATS'; payload: ProfessionalState['stats'] }
    | { type: 'ADD_CERTIFICATION'; payload: IHealthcareCertification }
    | { type: 'UPDATE_CERTIFICATION'; payload: IHealthcareCertification }
    | { type: 'UPDATE_PROFILE'; payload: Partial<User> }
    | { type: 'RESET' };

const initialState: ProfessionalState = {
    profile: null,
    certifications: [],
    ratings: [],
    tips: [],
    loading: false,
    stats: {
        totalEarnings: 0,
        totalConsultations: 0,
        averageRating: 0,
        pendingAppointments: 0
    }
};

function professionalReducer(state: ProfessionalState, action: Action): ProfessionalState {
    switch (action.type) {
        case 'SET_PROFILE':
            return { ...state, profile: action.payload };
        case 'SET_CERTIFICATIONS':
            return { ...state, certifications: action.payload };
        case 'SET_RATINGS':
            return { ...state, ratings: action.payload };
        case 'SET_TIPS':
            return { ...state, tips: action.payload };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_STATS':
            return { ...state, stats: action.payload };
        case 'ADD_CERTIFICATION':
            return { ...state, certifications: [...state.certifications, action.payload] };
        case 'UPDATE_CERTIFICATION':
            return {
                ...state,
                certifications: state.certifications.map(cert =>
                    cert.id === action.payload.id ? action.payload : cert
                )
            };
        case 'UPDATE_PROFILE':
            return {
                ...state,
                profile: state.profile ? { ...state.profile, ...action.payload } : null
            };
        case 'RESET':
            return initialState;
        default:
            return state;
    }
}

interface ProfessionalContextProps {
    professional: ProfessionalState;
    fetchProfessionalProfile: () => Promise<void>;
    updateProfessionalDetails: (
        data: Partial<User['healthcareProfile']> & {
            specialization?: string;
            department?: string;
        }
    ) => Promise<void>;
    addCertification: (certification: Omit<IHealthcareCertification, 'id' | 'verificationStatus'>) => Promise<void>;
    updateCertification: (certificationId: string, updates: Partial<IHealthcareCertification>) => Promise<void>;
    updateAvailability: (available: boolean) => Promise<void>;
    updateOnlineStatus: (online: boolean) => Promise<void>;
    getEarningsReport: (startDate: string, endDate: string) => Promise<any>;
    getProfessionalRatings: (page?: number, limit?: number) => Promise<void>;
    getProfessionalTips: (page?: number, limit?: number) => Promise<void>;
    refreshStats: () => Promise<void>;
}

export const ProfessionalContext = createContext<ProfessionalContextProps | undefined>(undefined);

export const ProfessionalProvider = ({ children }: { children: ReactNode }) => {
    const [professional, dispatch] = useReducer(professionalReducer, initialState);
    const { auth } = useAuth()!;
    const { showAlert } = useToast();

    const handleError = useCallback((title: string, err: any) => {
        const msg = err?.message || 'Something went wrong';
        showAlert({ message: `${title}: ${msg}`, type: 'error' });
        throw err;
    }, [showAlert]);

    /* ---------- Check if user is healthcare professional ---------- */
    const isHealthcareProfessional = useCallback(() => {
        return auth.user?.role === 'doctor' || auth.user?.role === 'nurse';
    }, [auth.user?.role]);

    /* ---------- Fetch professional profile ---------- */
    const fetchProfessionalProfile = useCallback(async () => {
        if (!isHealthcareProfessional()) return;

        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            const profile = await apiFetch<User>('/user/me/profile');
            dispatch({ type: 'SET_PROFILE', payload: profile });

        } catch (err: any) {
            if (err.status === 404) {
                console.warn('Professional endpoints not implemented yet');

                // Simple mock with optional healthcareProfile
                const mockProfile: User = {
                    ...auth.user!,
                    healthcareProfile: undefined // Just don't include it
                };
                dispatch({ type: 'SET_PROFILE', payload: mockProfile });
                return;
            }
            handleError('Failed to load professional profile', err);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [isHealthcareProfessional, auth.user, handleError]);


    /* ---------- Get professional ratings ---------- */
    const getProfessionalRatings = async (page: number = 1, limit: number = 10) => {
        try {
            const response = await apiFetch<{ ratings: IRating[]; total: number }>(
                `/user/me/ratings?page=${page}&limit=${limit}`
            );
            dispatch({ type: 'SET_RATINGS', payload: response.ratings });
        } catch (err: any) {
            handleError('Failed to load ratings', err);
        }
    };

    /* ---------- Get professional tips ---------- */
    const getProfessionalTips = async (page: number = 1, limit: number = 10) => {
        try {
            const response = await apiFetch<{ tips: ITip[]; total: number }>(
                `/user/me/tips?page=${page}&limit=${limit}`
            );
            dispatch({ type: 'SET_TIPS', payload: response.tips });
        } catch (err: any) {
            handleError('Failed to load tips', err);
        }
    };

    /* ---------- Update professional details ---------- */
    const updateProfessionalDetails = async (data: Partial<User['healthcareProfile']> & {
        specialization?: string;
        department?: string;
    }) => {
        try {
            const mapToDotted = (input: typeof data) => ({
                ...(input.bio !== undefined && { 'healthcareProfile.bio': input.bio }),
                ...(input.hourlyRate !== undefined && { 'healthcareProfile.hourlyRate': input.hourlyRate }),
                ...(input.services !== undefined && { 'healthcareProfile.services': input.services }),
                ...(input.languages !== undefined && { 'healthcareProfile.languages': input.languages }),
                ...(input.specialization !== undefined && { 'profile.specialization': input.specialization }),
                ...(input.department !== undefined && { 'profile.department': input.department }),
            });

            const updatedProfile = await apiFetch<User>('/user/me/professional-profile', {
                method: 'PATCH',
                body: mapToDotted(data)
            });

            dispatch({ type: 'UPDATE_PROFILE', payload: updatedProfile });
            showAlert({ message: 'Professional details updated successfully!', type: 'success' });
        } catch (err: any) {
            handleError('Failed to update professional details', err);
            throw err;
        }
    };

    /* ---------- Add certification ---------- */
    const addCertification = async (certification: Omit<IHealthcareCertification, 'id' | 'verificationStatus'>) => {
        try {
            const newCertification = await apiFetch<IHealthcareCertification>('/user/me/certifications', {
                method: 'POST',
                body: certification
            });

            dispatch({ type: 'ADD_CERTIFICATION', payload: newCertification });
            showAlert({ message: 'Certification added successfully!', type: 'success' });
        } catch (err: any) {
            handleError('Failed to add certification', err);
            throw err;
        }
    };

    /* ---------- Update certification ---------- */
    const updateCertification = async (certificationId: string, updates: Partial<IHealthcareCertification>) => {
        try {
            const updatedCertification = await apiFetch<IHealthcareCertification>(
                `/user/me/certifications/${certificationId}`,
                {
                    method: 'PATCH',
                    body: updates
                }
            );

            dispatch({ type: 'UPDATE_CERTIFICATION', payload: updatedCertification });
            showAlert({ message: 'Certification updated successfully!', type: 'success' });
        } catch (err: any) {
            handleError('Failed to update certification', err);
            throw err;
        }
    };

    /* ---------- Update availability ---------- */
    const updateAvailability = async (available: boolean) => {
        try {
            await apiFetch('/user/me/availability', {
                method: 'PATCH',
                body: { available }
            });

            dispatch({
                type: 'UPDATE_PROFILE', payload: {
                    healthcareProfile: {
                        ...professional.profile?.healthcareProfile, availability: {
                            ...professional.profile?.healthcareProfile?.availability,
                            isAvailable: available
                        }
                    }
                } as Partial<User>
            });

            showAlert({
                message: `You are now ${available ? 'available' : 'unavailable'} for consultations`,
                type: 'success'
            });
        } catch (err: any) {
            handleError('Failed to update availability', err);
            throw err;
        }
    };

    /* ---------- Update online status ---------- */
    const updateOnlineStatus = async (online: boolean) => {
        try {
            await apiFetch('/user/me/online-status', {
                method: 'PATCH',
                body: { online }
            });

            dispatch({
                type: 'UPDATE_PROFILE', payload: {
                    healthcareProfile: { ...professional.profile?.healthcareProfile, isOnline: online }
                } as Partial<User>
            });
        } catch (err: any) {
            handleError('Failed to update online status', err);
            throw err;
        }
    };

    /* ---------- Get earnings report ---------- */
    const getEarningsReport = async (startDate: string, endDate: string) => {
        try {
            const report = await apiFetch<any>(
                `/user/me/earnings-report?startDate=${startDate}&endDate=${endDate}`
            );
            return report;
        } catch (err: any) {
            handleError('Failed to load earnings report', err);
            throw err;
        }
    };

    /* ---------- Refresh stats ---------- */
    const refreshStats = async () => {
        try {
            const stats = await apiFetch<ProfessionalState['stats']>('/user/me/professional-stats');
            dispatch({ type: 'SET_STATS', payload: stats });
        } catch (err: any) {
            handleError('Failed to load stats', err);
        }
    };

    // Auto-fetch profile when user is healthcare professional
    React.useEffect(() => {
        if (auth.isAuth && isHealthcareProfessional()) {
            fetchProfessionalProfile();
        }
    }, [auth.isAuth, isHealthcareProfessional, fetchProfessionalProfile]);

    return (
        <ProfessionalContext.Provider
            value={{
                professional,
                fetchProfessionalProfile,
                updateProfessionalDetails,
                addCertification,
                updateCertification,
                updateAvailability,
                updateOnlineStatus,
                getEarningsReport,
                getProfessionalRatings,
                getProfessionalTips,
                refreshStats,
            }}
        >
            {children}
        </ProfessionalContext.Provider>
    );
};

/* -------------------------------------------------
   Hook
   ------------------------------------------------- */
export const useProfessional = (): ProfessionalContextProps => {
    const context = useContext(ProfessionalContext);
    if (!context) {
        throw new Error('useProfessional must be used within ProfessionalProvider');
    }
    return context;
};