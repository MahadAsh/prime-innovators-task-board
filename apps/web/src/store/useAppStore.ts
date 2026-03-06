import { create } from "zustand";

type Theme = "light" | "dark";

interface AppState {
  theme: Theme;
  activeUserId: string | null;
  setTheme: (theme: Theme) => void;
  setActiveUser: (userId: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: "light",
  activeUserId:
    typeof window !== "undefined" ? localStorage.getItem("prime_userId") : null,
  setTheme: (theme) => set({ theme }),
  setActiveUser: (activeUserId) => {
    if (activeUserId) {
      localStorage.setItem("prime_userId", activeUserId);
    } else {
      localStorage.removeItem("prime_userId");
    }
    set({ activeUserId });
  },
}));
