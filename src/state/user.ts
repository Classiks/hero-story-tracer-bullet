import { create } from "zustand";

interface User {
  name: string
}

interface UserAction {
  setName: (name: string) => void
}

export const useUserStore = create<User & UserAction>()((set) => ({
  name: "...",
  setName: (name) => set((state) => ({ ...state, name }))
}));
