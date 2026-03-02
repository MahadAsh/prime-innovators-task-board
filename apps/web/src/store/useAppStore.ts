import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface AppState {
    theme: Theme;
    activeUserId: string | null;
    setTheme: (theme: Theme) => void;
    setActiveUser: (userId: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
    theme: 'light',
    activeUserId: 'usr-1', // Default assigned to "Mahad" for mockup purposes
    setTheme: (theme) => set({ theme }),
    setActiveUser: (activeUserId) => set({ activeUserId }),
}));
