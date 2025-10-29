import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UiSettingsState {
  autoClickOnHover: boolean;
  autoScrollOnHover: boolean;
  setAutoClickOnHover: (value: boolean) => void;
  setAutoScrollOnHover: (value: boolean) => void;
}

// Fix: Removed generic type argument from create() and persist() to avoid untyped function call error.
export const useUiSettingsStore = create(
  persist<UiSettingsState>(
    (set) => ({
      autoClickOnHover: true,
      autoScrollOnHover: true,
      setAutoClickOnHover: (value) => set({ autoClickOnHover: value }),
      setAutoScrollOnHover: (value) => set({ autoScrollOnHover: value }),
    }),
    {
      name: 'paradigm-ui-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);