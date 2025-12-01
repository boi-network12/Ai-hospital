import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { apiFetch } from '@/Utils/api';
import { useAuth } from '@/Hooks/authHook.d';

export interface HydrationLog {
  _id: string;
  amount: number;
  beverageType: 'water' | 'tea' | 'coffee' | 'juice' | 'soda' | 'sports_drink' | 'other';
  timestamp: string;
  notes?: string;
}

export interface HydrationStats {
  totalIntake: number;
  goal: number;
  percentage: number;
  remaining: number;
  lastIntakeTime?: string;
  averageDailyIntake: number;
  streak: number;
  history: {
    date: string;
    intake: number;
    goal: number;
    metGoal: boolean;
  }[];
}

export interface HydrationGoal {
  dailyGoal: number;
  adjustedGoal?: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'heavy' | 'extreme';
  climate: 'temperate' | 'hot' | 'very_hot' | 'humid';
  healthConditions: string[];
}

interface HydrationState {
  isLoading: boolean;
  stats: HydrationStats | null;
  goal: HydrationGoal | null;
  todayLogs: HydrationLog[];
  recommendation: any | null;
}

type HydrationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_STATS'; payload: HydrationStats | null }
  | { type: 'SET_GOAL'; payload: HydrationGoal | null }
  | { type: 'SET_LOGS'; payload: HydrationLog[] }
  | { type: 'ADD_LOG'; payload: HydrationLog }
  | { type: 'DELETE_LOG'; payload: string }
  | { type: 'SET_RECOMMENDATION'; payload: any }
  | { type: 'UPDATE_STATS'; payload: Partial<HydrationStats> }
  | { type: 'RESET_STATE' }; 

const initialState: HydrationState = {
  isLoading: false,
  stats: null,
  goal: null,
  todayLogs: [],
  recommendation: null,
};

function hydrationReducer(state: HydrationState, action: HydrationAction): HydrationState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_STATS':
      return { ...state, stats: action.payload ?? null, isLoading: false };
    case 'SET_GOAL':
      return { ...state, goal: action.payload ?? null };
    case 'SET_LOGS':
      return { ...state, todayLogs: action.payload ?? [] };
    case 'ADD_LOG':
      return { ...state, todayLogs: [...state.todayLogs, action.payload] };
    case 'DELETE_LOG':
      return { ...state, todayLogs: state.todayLogs.filter(log => log._id !== action.payload) };
    case 'SET_RECOMMENDATION':
      return { ...state, recommendation: action.payload };
    case 'UPDATE_STATS':
      return { ...state, stats: state.stats ? { ...state.stats, ...action.payload } : null };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

interface HydrationContextType {
  state: HydrationState;
  logWaterIntake: (amount: number, beverageType?: string, notes?: string) => Promise<void>;
  setHydrationGoal: (goalData: Partial<HydrationGoal>) => Promise<void>;
  getTodayStats: () => Promise<void>;
  getHydrationLogs: (page?: number, limit?: number) => Promise<any>;
  generateRecommendation: (bodyMetrics: any) => Promise<void>;
  deleteLog: (logId: string) => Promise<void>;
  addQuickIntake: (amount: number) => Promise<void>;
  refreshHydrationData: () => Promise<void>;
}

const HydrationContext = createContext<HydrationContextType | undefined>(undefined);

export const HydrationProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(hydrationReducer, initialState);
  const { auth } = useAuth();


  const getTodayStats = useCallback(async () => {
    try {
      const stats = await apiFetch('/hydration/stats/today');
      
      // Make sure we're getting the right data
      if (stats && stats.data) {
        dispatch({ type: 'SET_STATS', payload: stats.data });
      } else if (stats) {
        dispatch({ type: 'SET_STATS', payload: stats });
      } else {
        console.warn('No stats data received');
        dispatch({ type: 'SET_STATS', payload: null });
      }
    } catch (error) {
      console.error('Error fetching hydration stats:', error);
      dispatch({ type: 'SET_STATS', payload: null });
    }
  }, []);

  

 const getHydrationGoal = useCallback(async () => {
    try {
      // Fetch user's actual saved goal
      const goalData = await apiFetch('/hydration/goal'); // You need this endpoint!
      
      if (goalData?.data) {
        dispatch({ type: 'SET_GOAL', payload: goalData.data });
        return;
      }
    } catch  {
      console.log('No goal set yet');
    }

    // Fallback: try recommendation
    try {
      const recommendation = await apiFetch('/hydration/recommendation');
      if (recommendation) {
        const fallbackGoal = {
          dailyGoal: recommendation.totalRecommended || 2000,
          activityLevel: recommendation.factors?.activityLevel || 'moderate',
          climate: recommendation.factors?.climate || 'temperate',
          healthConditions: recommendation.factors?.healthConditions || [],
        };
        dispatch({ type: 'SET_GOAL', payload: fallbackGoal });
      }
    } catch {
      dispatch({ type: 'SET_GOAL', payload: { dailyGoal: 2000, activityLevel: 'moderate', climate: 'temperate', healthConditions: [] } });
    }
  }, []);

  const getTodayLogs = useCallback(async () => {
    try {
      const result = await apiFetch('/hydration/logs?limit=50');
      
      if (result && result.logs) {
        // Filter to show only today's logs on the main screen
        const today = new Date().toISOString().split('T')[0];
        const todayLogs = result.logs.filter((log: HydrationLog) => {
          if (!log.timestamp) return false;
          const logDate = new Date(log.timestamp).toISOString().split('T')[0];
          return logDate === today;
        });
        
        dispatch({ type: 'SET_LOGS', payload: todayLogs });
      } else {
        dispatch({ type: 'SET_LOGS', payload: [] });
      }
    } catch (error) {
      console.error('Error fetching hydration logs:', error);
      dispatch({ type: 'SET_LOGS', payload: [] });
    }
  }, []);

  // Memoize refresh function to fix exhaustive-deps
  const refreshHydrationData = useCallback(async () => {
    if (!auth.isAuth || !auth.user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await Promise.all([
        getTodayStats(),
        getHydrationGoal(),
        getTodayLogs(),
      ]);
    } catch (error) {
      console.error('Error refreshing hydration data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [auth.isAuth, auth.user, getTodayStats, getTodayLogs, getHydrationGoal]);

  // Load hydration data when user is authenticated
  useEffect(() => {
    if (auth.isAuth && auth.user) {
      refreshHydrationData();
    } else {
      // Reset state when user logs out
      dispatch({ type: 'RESET_STATE' });
    }
  }, [auth.isAuth, auth.user, refreshHydrationData]);

  const logWaterIntake = async (amount: number, beverageType: string = 'water', notes?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true }); // Add loading
      
      const response = await apiFetch('/hydration/log', {
        method: 'POST',
        body: {  
          amount, 
          beverageType, 
          notes 
        },
      });

      if (response?.data) {
        dispatch({ type: 'ADD_LOG', payload: response.data });
        // Refresh ALL data - this is critical
        await Promise.all([
          getTodayStats(),
          getTodayLogs(),
          getHydrationGoal(), // Also refresh goal if needed
        ]);
      }
    } catch (error) {
      console.error('Error logging water intake:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };


  const addQuickIntake = async (amount: number) => {
  await logWaterIntake(amount, 'water', 'Quick intake');
    // No need to do anything else — logWaterIntake already refreshes logs
  };

  // In your hydration context
  const setHydrationGoal = async (goalData: Partial<HydrationGoal>) => {
    try {
      const updatedGoal = await apiFetch('/hydration/goal', {
        method: 'POST',
        body: goalData, // ← Pass object directly
      });

      if (updatedGoal && updatedGoal.success) {
        dispatch({ type: 'SET_GOAL', payload: updatedGoal.data });
        await getTodayStats();
        return updatedGoal;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error setting hydration goal:', error);
      throw error;
    }
  };

  const getHydrationLogs = async (page: number = 1, limit: number = 10) => {
    try {
      const result = await apiFetch(`/hydration/logs?page=${page}&limit=${limit}`);
      return result;
    } catch (error) {
      console.error('Error fetching hydration logs:', error);
      throw error;
    }
  };

  const generateRecommendation = async (bodyMetrics: any) => {
  try {
    const recommendation = await apiFetch('/hydration/recommendation', {
      method: 'POST',
      body: bodyMetrics, // ← Pass object directly
    });

    dispatch({ type: 'SET_RECOMMENDATION', payload: recommendation });
    
    if (state.goal) {
      const updatedGoal = { ...state.goal, dailyGoal: recommendation.totalRecommended };
      dispatch({ type: 'SET_GOAL', payload: updatedGoal });
      await setHydrationGoal(updatedGoal);
    }

    return recommendation;
  } catch (error) {
    console.error('Error generating recommendation:', error);
    throw error;
  }
};

  const deleteLog = async (logId: string) => {
    try {
      await apiFetch(`/hydration/log/${logId}`, {
        method: 'DELETE',
      });

      dispatch({ type: 'DELETE_LOG', payload: logId });
      await getTodayStats(); // Refresh stats after deletion
    } catch (error) {
      console.error('Error deleting hydration log:', error);
      throw error;
    }
  };

  const value: HydrationContextType = {
    state,
    logWaterIntake,
    setHydrationGoal,
    getTodayStats,
    getHydrationLogs,
    generateRecommendation,
    deleteLog,
    addQuickIntake,
    refreshHydrationData,
  };

  return (
    <HydrationContext.Provider value={value}>
      {children}
    </HydrationContext.Provider>
  );
};

export const useHydration = () => {
  const context = useContext(HydrationContext);
  if (context === undefined) {
    throw new Error('useHydration must be used within a HydrationProvider');
  }
  return context;
};