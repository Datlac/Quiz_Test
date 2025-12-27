import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  soundEnabled: boolean;
  toggleSound: () => void;
  setSound: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      setSound: (enabled) => set({ soundEnabled: enabled }),
    }),
    {
      name: 'quiz-settings',
    }
  )
);
