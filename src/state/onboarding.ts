import { create } from "zustand";

interface Onboarding {
  name: string
  goal: string
  mainProblem: string
  storyRequestId: string
}

interface OnboardingAction {
  refreshStoryRequestId: () => void
  reset: () => void
  setName: (name: string) => void
  setGoal: (goal: string) => void
  setMainProblem: (mainProblem: string) => void
}

export const useOnboardingStore = create<Onboarding & OnboardingAction>()((set) => ({
  name: "",
  goal: "",
  mainProblem: "",
  storyRequestId: crypto.randomUUID(),
  refreshStoryRequestId: () => set((state) => ({ ...state, storyRequestId: crypto.randomUUID() })),
  reset: () =>
    set((state) => ({
      ...state,
      // Keep the hero name so a returning user can start another story as the same hero.
      goal: "",
      mainProblem: "",
      storyRequestId: crypto.randomUUID(),
    })),
  setName: (name) => set((state) => ({ ...state, name })),
  setGoal: (goal) => set((state) => ({ ...state, goal })),
  setMainProblem: (problem) => set((state) => ({ ...state, mainProblem: problem })),
}));
