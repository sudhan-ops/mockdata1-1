import { create } from 'zustand';
import { authService } from '../services/authService';
import { mockUsers } from '../mocks/userData';
import type { User } from '../types';
import { api } from '../services/api';

interface AuthState {
  user: User | null;
  loading: boolean;
  isCheckedIn: boolean;
  isAttendanceLoading: boolean;
  lastCheckInTime: string | null;
  lastCheckOutTime: string | null;
  loginWithEmail: (email: string, password: string) => Promise<{ error: { message: string } | null; user: User | null }>;
  loginWithGoogle: () => Promise<{ error: { message: string } | null; user: User | null; }>;
  sendPasswordReset: (email: string) => Promise<{ error: { message: string } | null }>;
  logout: () => Promise<void>;
  isInitialized: boolean;
  init: () => void;
  updateUserProfile: (updates: Partial<User>) => void;
  checkAttendanceStatus: () => Promise<void>;
  toggleCheckInStatus: () => Promise<{ success: boolean; message: string }>;
}


// Fix: Removed generic type argument from create() to avoid untyped function call error.
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  isInitialized: false,
  isCheckedIn: false,
  isAttendanceLoading: true,
  lastCheckInTime: null,
  lastCheckOutTime: null,
  
  init: () => {
    authService.onAuthStateChanged((event: string, session: { user: User | null } | null) => {
      const user = session?.user ?? null;
      set({ user, isInitialized: true, loading: false });
    });
  },

  loginWithEmail: async (email, password) => {
    set({ loading: true });
    try {
      const { data, error } = await authService.signInWithPassword(email, password);
      const appUser = data?.user;
      
      if (error) {
        set({ loading: false });
        return { error: { message: error.message }, user: null };
      }
      
      if (!appUser) {
          await authService.signOut();
          set({ loading: false, user: null });
          return { error: { message: "User not found in the application." }, user: null };
      }
      // On success, the onAuthStateChanged listener will handle setting the user state.
      set({ loading: false });
      return { error: null, user: appUser };

    } catch (e: any) {
        set({ loading: false });
        return { error: { message: e.message || "An unexpected error occurred." }, user: null };
    }
  },

  loginWithGoogle: async () => {
    set({ loading: true });
    try {
        const { data, error } = await authService.signInWithGoogle();
        const appUser = data?.user;

        if (error) {
            set({ loading: false });
            return { error: { message: error.message }, user: null };
        }
        
        if (!appUser) {
            await authService.signOut();
            set({ loading: false, user: null });
            return { error: { message: "Your Google account is not registered for this application." }, user: null };
        }
        
        set({ loading: false });
        return { error: null, user: appUser };
    } catch (e: any) {
        set({ loading: false });
        return { error: { message: e.message || "An unexpected error occurred." }, user: null };
    }
  },
  
  sendPasswordReset: async (email: string) => {
      const { error } = await authService.resetPasswordForEmail(email);
      if (error) {
          return { error: { message: error.message } };
      }
      return { error: null };
  },

  logout: async () => {
    await authService.signOut();
    set({ user: null, isCheckedIn: false, lastCheckInTime: null, lastCheckOutTime: null }); // Reset state on logout
  },

  updateUserProfile: (updates) => set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null
  })),

  checkAttendanceStatus: async () => {
    const { user } = get();
    if (!user) {
        set({ isAttendanceLoading: false });
        return;
    }
    set({ isAttendanceLoading: true });
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
        const events = await api.getAttendanceEvents(user.id, startOfDay, endOfDay);
        
        // Sort events by time to find the last one
        events.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        const lastEvent = events[0];
        const checkInsToday = events.filter(e => e.type === 'check-in');
        // Since 'events' is sorted descending, the last element of 'checkInsToday' is the earliest check-in.
        const firstCheckIn = checkInsToday.length > 0 ? checkInsToday[checkInsToday.length - 1] : null;
        const lastCheckOut = events.find(e => e.type === 'check-out');

        set({ 
            isCheckedIn: lastEvent?.type === 'check-in',
            lastCheckInTime: firstCheckIn ? firstCheckIn.timestamp : null,
            lastCheckOutTime: lastCheckOut ? lastCheckOut.timestamp : null
        });
    } catch (error) {
        console.error("Failed to check attendance status:", error);
    } finally {
        set({ isAttendanceLoading: false });
    }
  },

  toggleCheckInStatus: async () => {
      const { user, isCheckedIn } = get();
      if (!user) return { success: false, message: 'User not found' };
      
      const newType = isCheckedIn ? 'check-out' : 'check-in';

      return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
              async (position) => {
                  const { latitude, longitude } = position.coords;
                  try {
                      await api.addAttendanceEvent({
                          userId: user.id,
                          timestamp: new Date().toISOString(),
                          type: newType,
                          latitude,
                          longitude
                      });
                      await get().checkAttendanceStatus();
                      resolve({ success: true, message: `Successfully ${newType.replace('-', ' ')}!` });
                  } catch (err) {
                      resolve({ success: false, message: 'Failed to update attendance.' });
                  }
              },
              async (error) => {
                  console.warn(`Geolocation error: ${error.message}`);
                  // Proceed without location
                   try {
                      await api.addAttendanceEvent({
                          userId: user.id,
                          timestamp: new Date().toISOString(),
                          type: newType,
                      });
                      await get().checkAttendanceStatus();
                      resolve({ success: true, message: `Successfully ${newType.replace('-', ' ')}! (Location not captured)` });
                  } catch (err) {
                      resolve({ success: false, message: 'Failed to update attendance.' });
                  }
              },
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
      });
  },
}));