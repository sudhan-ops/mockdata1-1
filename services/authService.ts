import type { User as AppUser } from "../types";
import { mockUsers } from '../mocks/userData';

// --- MOCK AUTHENTICATION SERVICE ---
// This service simulates user authentication using mock data for development and testing.
// It uses sessionStorage to persist the login state across page reloads.

let currentAppUser: AppUser | null = null;
let authStateListener: ((event: string, session: { user: AppUser | null } | null) => void) | null = null;

const SESSION_KEY = 'mock_user_session';

// Initialize session from sessionStorage
try {
    const savedUserJson = sessionStorage.getItem(SESSION_KEY);
    if (savedUserJson) {
        currentAppUser = JSON.parse(savedUserJson);
    }
} catch (e) {
    console.error("Could not parse mock user session from sessionStorage", e);
    currentAppUser = null;
}

const findAppUserByEmail = (email: string | null): AppUser | null => {
  if (!email) return null;
  return mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
};

const notifyListener = () => {
    if (authStateListener) {
        if (currentAppUser) {
            authStateListener('SIGNED_IN', { user: currentAppUser });
        } else {
            authStateListener('SIGNED_OUT', null);
        }
    }
};

const signInWithPassword = async (email: string, password: string): Promise<{ data: { user: AppUser } | null, error: { message: string } | null }> => {
    // Mock implementation ignores the password
    const appUser = findAppUserByEmail(email);
    
    if (!appUser) {
        return { data: null, error: { message: "auth/user-not-found" } };
    }
    
    currentAppUser = appUser;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentAppUser));
    notifyListener();
    
    return { data: { user: appUser }, error: null };
};

const signInWithGoogle = async (): Promise<{ data: { user: AppUser } | null, error: { message: string } | null }> => {
    // For mock Google sign in, let's log in the admin user for ease of testing.
    const adminUser = mockUsers.find(u => u.role === 'admin');
    
    if (!adminUser) {
         return { data: null, error: { message: "auth/unauthorized-app-user" } };
    }

    currentAppUser = adminUser;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentAppUser));
    notifyListener();

    return { data: { user: currentAppUser }, error: null };
};

const resetPasswordForEmail = async (email: string): Promise<{ error: { message: string } | null }> => {
    console.log(`(Mock) Password reset instructions sent to ${email}`);
    // Simulate a successful response
    return { error: null };
};

const updateUserPassword = async (password: string): Promise<{ error: { message: string } | null }> => {
    console.log(`(Mock) User password has been updated.`);
    if (!currentAppUser) {
      return { error: { message: 'auth/requires-recent-login' } };
    }
    return { error: null };
};

const signOut = async (): Promise<void> => {
    currentAppUser = null;
    sessionStorage.removeItem(SESSION_KEY);
    notifyListener();
};

const onAuthStateChanged = (callback: (event: string, session: { user: AppUser | null } | null) => void) => {
    authStateListener = callback;
    // Immediately notify with the current state upon subscription
    notifyListener();
    
    return { data: { subscription: { unsubscribe: () => { authStateListener = null; } } } };
};

export const authService = {
    signInWithPassword,
    signInWithGoogle,
    resetPasswordForEmail,
    updateUserPassword,
    signOut,
    onAuthStateChanged,
};