import { create } from "zustand";

interface Problem {
  mainProblem: string
}

interface ProblemAction {
  setMainProblem: (name: string) => void
}

export const useProblemStore = create<Problem & ProblemAction>()((set) => ({
  mainProblem: "...",
  setMainProblem: (mainProblem) => set((state) => ({ ...state, mainProblem }))
}));
