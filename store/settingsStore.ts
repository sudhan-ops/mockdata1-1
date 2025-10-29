import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AddressSettings, AttendanceSettings, Holiday, GmcPolicySettings, PerfiosApiSettings, GeminiApiSettings, OtpSettings, NotificationSettings, VerificationCosts, VerificationCostSetting, SiteManagementSettings } from '../types';

interface SettingsState {
  address: AddressSettings;
  attendance: AttendanceSettings;
  holidays: Holiday[];
  gmcPolicy: GmcPolicySettings;
  perfiosApi: PerfiosApiSettings;
  geminiApi: GeminiApiSettings;
  otp: OtpSettings;
  notifications: NotificationSettings;
  verificationCosts: VerificationCosts;
  siteManagement: SiteManagementSettings;
  updateAddressSettings: (settings: Partial<AddressSettings>) => void;
  updateAttendanceSettings: (settings: Partial<AttendanceSettings>) => void;
  updateGmcPolicySettings: (settings: Partial<GmcPolicySettings>) => void;
  updatePerfiosApiSettings: (settings: Partial<PerfiosApiSettings>) => void;
  updateGeminiApiSettings: (settings: Partial<GeminiApiSettings>) => void;
  updateOtpSettings: (settings: Partial<OtpSettings>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  updateVerificationCosts: (costs: VerificationCosts) => void;
  updateSiteManagementSettings: (settings: Partial<SiteManagementSettings>) => void;
  addHoliday: (holiday: Omit<Holiday, 'id'>) => void;
  removeHoliday: (id: string) => void;
}

const initialAddress: AddressSettings = {
    enablePincodeVerification: true,
};

const initialAttendance: AttendanceSettings = {
    minimumHoursFullDay: 8,
    minimumHoursHalfDay: 4,
    annualEarnedLeaves: 5,
    annualSickLeaves: 12,
    monthlyFloatingLeaves: 1,
    enableAttendanceNotifications: false,
    sickLeaveCertificateThreshold: 2,
};

const initialHolidays: Holiday[] = [
    { id: 'hol_1', date: '2024-08-15', name: 'Independence Day' },
    { id: 'hol_2', date: '2024-10-02', name: 'Gandhi Jayanti' },
    { id: 'hol_3', date: '2024-12-25', name: 'Christmas' },
];

const initialGmcPolicy: GmcPolicySettings = {
  applicability: 'Optional - Opt-in Default',
  optInDisclaimer: 'Please note that currently the GMC facility covers only spouse and two children. If you would like to continue, please select below relationships and submit.',
  coverageDetails: 'Spouse and two children',
  optOutDisclaimer: 'Please note that you are opting out of the GMC Facility. You will have to submit a declaration to the company towards the same along with proof of your existing insurance.',
  requireAlternateInsurance: true,
  collectProvider: true,
  collectStartDate: true,
  collectEndDate: true,
  collectExtentOfCover: true,
};

const initialPerfiosApi: PerfiosApiSettings = {
    enabled: true,
    clientId: '',
    clientSecret: '',
};

const initialGeminiApi: GeminiApiSettings = {
    enabled: true,
};

const initialOtp: OtpSettings = {
    enabled: true,
};

const initialNotifications: NotificationSettings = {
    email: {
        enabled: false,
    }
};

const initialVerificationCosts: VerificationCostSetting[] = [
  { id: 'cost_1', name: 'Profile Picture', cost: 0 },
  { id: 'cost_2', name: 'Mobile to Form Prefill', cost: 7 },
  { id: 'cost_3', name: 'KYC OCR (Plus)', cost: 1.50 },
  { id: 'cost_4', name: 'Aadhaar Mobile Link', cost: 2.5 },
  { id: 'cost_5', name: 'EPF UAN Lookup', cost: 2.50 },
  { id: 'cost_6', name: 'Cheque OCR', cost: 3 },
  { id: 'cost_7', name: 'Bank AC Verification Advanced', cost: 2.25 },
  { id: 'cost_8', name: 'PAN Profile Detailed', cost: 5 },
  { id: 'cost_9', name: 'Aadhaar Verification', cost: 1.75 },
  { id: 'cost_10', name: 'Voter ID OCR', cost: 1.50 },
  { id: 'cost_11', name: 'Driving License OCR', cost: 1.50 },
  { id: 'cost_12', name: 'Education Certificate OCR', cost: 2.00 },
  { id: 'cost_13', name: 'Experience/Salary Slip OCR', cost: 2.00 },
  { id: 'cost_14', name: 'ESI Card OCR', cost: 1.50 },
];

const initialSiteManagement: SiteManagementSettings = {
    enableProvisionalSites: false,
};

// Fix: Removed generic type argument from create() and persist() to avoid untyped function call error.
export const useSettingsStore = create(
  persist<SettingsState>(
    (set) => ({
      address: initialAddress,
      attendance: initialAttendance,
      holidays: initialHolidays,
      gmcPolicy: initialGmcPolicy,
      perfiosApi: initialPerfiosApi,
      geminiApi: initialGeminiApi,
      otp: initialOtp,
      notifications: initialNotifications,
      verificationCosts: initialVerificationCosts,
      siteManagement: initialSiteManagement,
      updateAddressSettings: (settings) => set((state) => ({
        address: { ...state.address, ...settings }
      })),
      updateAttendanceSettings: (settings) => set((state) => ({
          attendance: { ...state.attendance, ...settings }
      })),
      updateGmcPolicySettings: (settings) => set((state) => ({
          gmcPolicy: { ...state.gmcPolicy, ...settings }
      })),
      updatePerfiosApiSettings: (settings) => set((state) => ({
          perfiosApi: { ...state.perfiosApi, ...settings }
      })),
      updateGeminiApiSettings: (settings) => set((state) => ({
        geminiApi: { ...state.geminiApi, ...settings }
      })),
      updateOtpSettings: (settings) => set((state) => ({
        otp: { ...state.otp, ...settings }
      })),
      updateNotificationSettings: (settings) => set((state) => ({
        notifications: { 
            ...state.notifications, 
            ...settings,
            email: { ...state.notifications.email, ...settings.email }
        }
      })),
      updateVerificationCosts: (costs) => set({ verificationCosts: costs }),
      updateSiteManagementSettings: (settings) => set((state) => ({
        siteManagement: { ...state.siteManagement, ...settings }
      })),
      addHoliday: (holiday) => set((state) => ({
          holidays: [...state.holidays, { ...holiday, id: `hol_${Date.now()}` }].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      })),
      removeHoliday: (id) => set((state) => ({
          holidays: state.holidays.filter(h => h.id !== id)
      })),
    }),
    {
      name: 'paradigm_app_settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);