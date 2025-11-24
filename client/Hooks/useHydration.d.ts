// Hooks/useHydration.d.ts
import { useHydration } from '@/context/HydrationContext';

export const useHydrationData = () => {
  const hydration = useHydration();
  
  // Calculate current intake
  const currentIntake = hydration.state.stats?.totalIntake || 0;
  
  // Get daily goal
  const dailyGoal = hydration.state.goal?.dailyGoal || 2000;
  
  // Calculate progress percentage
  const progressPercentage = Math.min(100, Math.round((currentIntake / dailyGoal) * 100));
  
  // Check if goal is met
  const isGoalMet = progressPercentage >= 100;
  
  // Get remaining amount
  const remaining = Math.max(0, dailyGoal - currentIntake);
  
  // Enhanced quick add with validation
  const addQuickIntake = async (amount: number) => {
    if (amount <= 0 || amount > 5000) {
      console.warn('Invalid intake amount:', amount);
      return;
    }
    try {
      await hydration.addQuickIntake(amount);
    } catch (error) {
      console.error('Failed to add intake:', error);
      throw error; // Re-throw to handle in UI
    }
  };

  // Set goal function - FIXED
  const setGoal = async (dailyGoal: number) => {
    try {
      await hydration.setHydrationGoal({ dailyGoal });
    } catch (error) {
      console.error('Failed to set goal:', error);
      throw error;
    }
  };

  // Proper log water intake function
  const logWaterIntake = async (amount: number, beverageType: string = 'water', notes?: string) => {
    try {
      await hydration.logWaterIntake(amount, beverageType, notes);
    } catch (error) {
      console.error('Failed to log intake:', error);
      throw error;
    }
  };

  return {
    ...hydration,
    progressPercentage,
    currentIntake,
    dailyGoal,
    isGoalMet,
    remaining,
    addQuickIntake,
    setGoal,
    logWaterIntake, // Add this
    isLoading: hydration.state.isLoading,
    stats: hydration.state.stats,
    goal: hydration.state.goal,
    logs: hydration.state.todayLogs,
    recommendation: hydration.state.recommendation,
  };
};