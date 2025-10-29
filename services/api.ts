import { mockUsers } from '../mocks/userData';
import { 
  OnboardingData, 
  User, 
  Organization,
  OrganizationGroup,
  AttendanceEvent,
  AttendanceSettings,
  Holiday,
  LeaveBalance,
  LeaveRequest,
  LeaveRequestStatus,
  Task,
  Notification,
  VerificationResult,
  PerfiosVerificationData,
  SiteConfiguration,
  Entity,
  Policy,
  Insurance,
  ManpowerDetail,
  BackOfficeIdSeries,
  SiteStaffDesignation,
  Asset,
  MasterTool,
  MasterToolsList,
  SiteGentsUniformConfig,
  MasterGentsUniforms,
  SiteLadiesUniformConfig,
  MasterLadiesUniforms,
  UniformRequest,
  SiteUniformDetailsConfig,
  EnrollmentRules,
  InvoiceData,
  InvoiceLineItem,
  UserRole,
  UploadedFile,
  SalaryChangeRequest,
  SiteStaff,
  Fingerprints,
  SubmissionCostBreakdown,
  VerificationUsageItem,
  AppModule,
  Role,
  BankDetails,
  SupportTicket,
  TicketPost,
  TicketComment
} from '../types';
// Fix: Removed unused imports from @google/genai to resolve type errors.
import { Type } from "@google/genai";
import { format, addDays } from 'date-fns';
import { useSettingsStore } from '../store/settingsStore';


// --- In-memory mock database ---
let db = {
  onboardingSubmissions: [] as OnboardingData[],
  organizations: [] as Organization[],
  organizationGroups: [] as OrganizationGroup[],
  attendanceEvents: [] as AttendanceEvent[],
  leaveRequests: [] as LeaveRequest[],
  tasks: [] as Task[],
  notifications: [] as Notification[],
  siteConfigs: [] as SiteConfiguration[],
  policies: [] as Policy[],
  insurances: [] as Insurance[],
  manpowerDetails: {} as Record<string, ManpowerDetail[]>,
  backOfficeIdSeries: [] as BackOfficeIdSeries[],
  siteStaffDesignations: [] as SiteStaffDesignation[],
  siteStaff: [] as SiteStaff[],
  salaryChangeRequests: [] as SalaryChangeRequest[],
  siteAssets: {} as Record<string, Asset[]>,
  masterTools: {} as MasterToolsList,
  siteIssuedTools: {} as Record<string, any[]>,
  masterGentsUniforms: { pants: [], shirts: [] } as MasterGentsUniforms,
  siteGentsUniforms: {} as Record<string, SiteGentsUniformConfig>,
  masterLadiesUniforms: { pants: [], shirts: [] } as MasterLadiesUniforms,
  // FIX: Added missing siteLadiesUniforms property to the mock database.
  siteLadiesUniforms: {} as Record<string, SiteLadiesUniformConfig>,
  uniformRequests: [] as UniformRequest[],
  siteUniformDetails: {} as Record<string, SiteUniformDetailsConfig>,
  enrollmentRules: {} as EnrollmentRules,
  invoiceStatuses: {} as Record<string, any>,
  modules: [] as AppModule[],
  roles: [] as Role[],
  supportTickets: [] as SupportTicket[],
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


// --- Initialize Mock Data ---
let dataInitializationPromise: Promise<void> | null = null;

const initializeData = async () => {
    try {
        const responses = await Promise.all([
            fetch('./mocks/sampleData.json'),
            fetch('./mocks/attendanceData.json'),
            fetch('./mocks/leaveData.json'),
            fetch('./mocks/tasks.json'),
            fetch('./mocks/notifications.json'),
            fetch('./mocks/siteStaffData.json'),
            fetch('./mocks/uniformRequestData.json'),
            fetch('./mocks/salaryChangeRequestsData.json'),
            fetch('./mocks/entityData.json'),
            fetch('./mocks/policies.json'),
            fetch('./mocks/insurance.json'),
            fetch('./mocks/manpowerData.json'),
            fetch('./mocks/siteStaffDesignationData.json'),
            fetch('./mocks/gentsUniformData.json'),
            fetch('./mocks/ladiesUniformData.json'),
            fetch('./mocks/moduleData.json'),
            fetch('./mocks/rolesData.json'),
            fetch('./mocks/supportData.json'),
        ]);

        for (const res of responses) {
            if (!res.ok) {
                throw new Error(`Failed to fetch mock data from ${res.url}: ${res.statusText}`);
            }
        }

        const [
            sampleData, attendanceData, leaveData, tasksData, notificationsData,
            siteStaffData, uniformRequestData, salaryChangeData, entityData,
            policiesData, insuranceData, manpowerData, siteStaffDesignationData,
            gentsUniformData, ladiesUniformData, moduleData, rolesData, supportData
        ] = await Promise.all(responses.map(res => res.json()));
        
        // --- DYNAMIC DATE SHIFTING LOGIC ---
        const MOCK_LATEST_DATE = new Date('2024-07-30T12:00:00Z');
        const today = new Date();
        const timeDiff = today.getTime() - MOCK_LATEST_DATE.getTime();

        const shiftDate = (dateString?: string | null) => {
            if (!dateString) return dateString;
            try {
                const originalDate = new Date(dateString.includes('T') ? dateString : dateString.replace(/-/g, '/'));
                const newDate = new Date(originalDate.getTime() + timeDiff);
                if (dateString.includes('T')) {
                    return newDate.toISOString();
                }
                return format(newDate, 'yyyy-MM-dd');
            } catch(e) {
                return dateString;
            }
        };

        // Helper to reconstruct file objects
        const reconstructFile = (file: { name: string } | null): UploadedFile | null => {
            if (!file || !file.name) return null;
            return {
                name: file.name, type: 'image/jpeg', size: 1024,
                preview: `https://picsum.photos/seed/${file.name}/200/300`, // Using a placeholder image service
                file: new File([], file.name, { type: 'image/jpeg' })
            };
        };

        // Populate DB with shifted dates
        db.onboardingSubmissions = (sampleData.onboardingSubmissions || []).map((s: any) => ({
            ...s,
            enrollmentDate: shiftDate(s.enrollmentDate),
            personal: { ...s.personal, photo: reconstructFile(s.personal.photo) },
            bank: { ...s.bank, bankProof: reconstructFile(s.bank.bankProof) },
            biometrics: {
                signatureImage: reconstructFile(s.biometrics.signatureImage),
                fingerprints: Object.entries(s.biometrics.fingerprints || {}).reduce((acc, [key, value]) => {
                    acc[key as keyof Fingerprints] = reconstructFile(value as any);
                    return acc;
                }, {} as Fingerprints)
            }
        }));
        
        db.attendanceEvents = (attendanceData || []).map((e: AttendanceEvent) => ({ ...e, timestamp: shiftDate(e.timestamp)! }));
        db.leaveRequests = (leaveData || []).map((l: LeaveRequest) => ({ ...l, startDate: shiftDate(l.startDate)!, endDate: shiftDate(l.endDate)! }));
        db.tasks = (tasksData || []).map((t: Task) => ({ ...t, dueDate: shiftDate(t.dueDate) }));
        db.supportTickets = (supportData || []).map((t: any) => ({
            ...t,
            raisedAt: shiftDate(t.raisedAt),
            resolvedAt: shiftDate(t.resolvedAt),
            closedAt: shiftDate(t.closedAt),
            posts: (t.posts || []).map((p: any) => ({
                ...p,
                createdAt: shiftDate(p.createdAt),
                comments: (p.comments || []).map((c: any) => ({
                    ...c,
                    createdAt: shiftDate(c.createdAt)
                }))
            }))
        }));


        db.organizations = sampleData.organizations || [];
        db.organizationGroups = entityData.groups || [];
        db.siteConfigs = sampleData.siteConfigs || [];
        db.notifications = notificationsData || [];
        db.siteStaff = siteStaffData || [];
        db.uniformRequests = uniformRequestData || [];
        db.salaryChangeRequests = salaryChangeData || [];
        db.policies = policiesData || [];
        db.insurances = insuranceData || [];
        db.manpowerDetails = manpowerData || {};
        db.siteStaffDesignations = siteStaffDesignationData.designations || [];
        db.masterTools = {}; // Set to empty as source file is removed
        db.masterGentsUniforms = gentsUniformData || { pants: [], shirts: [] };
        db.masterLadiesUniforms = ladiesUniformData || { pants: [], shirts: [] };
        db.backOfficeIdSeries = entityData.backOfficeIdSeries || [];
        db.modules = moduleData || [];
        db.roles = rolesData || [];
        
    } catch (error) {
        console.error("Critical error: Failed to load mock data JSON files.", error);
        // Fallback to minimal data if loading fails
        db.organizations = [
            { id: 'org_1', shortName: 'Prestige Falcon City', fullName: 'Prestige Falcon City Phase 1', address: 'Kanakapura Road, Bengaluru' },
            { id: 'org_2', shortName: 'Brigade Gateway', fullName: 'Brigade Gateway Enclave', address: 'Malleswaram, Bengaluru', manpowerApprovedCount: 150 },
        ];
    }
};

const ensureDataInitialized = () => {
    if (!dataInitializationPromise) {
        dataInitializationPromise = initializeData();
    }
    return dataInitializationPromise;
};

// --- API Implementation ---
export const api = {
  // Onboarding & Verification
  getVerificationSubmissions: async (status?: string, organizationId?: string): Promise<OnboardingData[]> => {
    await ensureDataInitialized();
    await delay(500);
    let results = db.onboardingSubmissions;
    if (status) {
        results = results.filter(s => s.status === status);
    }
    if (organizationId) {
        results = results.filter(s => s.organizationId === organizationId);
    }
    return JSON.parse(JSON.stringify(results));
  },
  getOnboardingDataById: async (id: string): Promise<OnboardingData | null> => {
      await ensureDataInitialized();
      await delay(300);
      const submission = db.onboardingSubmissions.find(s => s.id === id);
      return submission ? JSON.parse(JSON.stringify(submission)) : null;
  },
  saveDraft: async (data: OnboardingData): Promise<{ draftId: string }> => {
      await ensureDataInitialized();
      await delay(400);
      let draftId = data.id;
      const index = db.onboardingSubmissions.findIndex(s => s.id === data.id);
      if (index > -1) {
          db.onboardingSubmissions[index] = data;
      } else {
          draftId = `draft_${Date.now()}`;
          db.onboardingSubmissions.push({ ...data, id: draftId });
      }
      return { draftId };
  },
  submitOnboarding: async (data: OnboardingData): Promise<OnboardingData> => {
      await ensureDataInitialized();
      await delay(600);
      const newData = { ...data, id: `sub_${Date.now()}`, status: 'pending' as const };
      db.onboardingSubmissions.push(newData);
      return newData;
  },
  updateOnboarding: async (data: OnboardingData): Promise<OnboardingData> => {
      await ensureDataInitialized();
      await delay(500);
      const index = db.onboardingSubmissions.findIndex(s => s.id === data.id);
      if (index === -1) throw new Error("Submission not found");
      db.onboardingSubmissions[index] = data;
      return data;
  },
  verifySubmission: async (id: string): Promise<void> => {
      await ensureDataInitialized();
      await delay(500);
      const submission = db.onboardingSubmissions.find(s => s.id === id);
      if (submission) {
          submission.status = 'verified';
          submission.portalSyncStatus = 'pending_sync';
      }
  },
  requestChanges: async (id: string, reason: string): Promise<void> => {
      await ensureDataInitialized();
      await delay(500);
      const submission = db.onboardingSubmissions.find(s => s.id === id);
      if (submission) {
          submission.status = 'rejected';
      }
  },
  syncPortals: async (id: string): Promise<OnboardingData> => {
      await ensureDataInitialized();
      await delay(2500); // Simulate multiple API calls
      const submissionIndex = db.onboardingSubmissions.findIndex(s => s.id === id);
      if (submissionIndex === -1) {
          throw new Error("Submission not found");
      }
      const submission = db.onboardingSubmissions[submissionIndex];

      if (submission.status !== 'verified') {
          return submission;
      }

      // Helper to log usage
      const logUsage = (serviceName: string) => {
          submission.verificationUsage = submission.verificationUsage || [];
          const existing = submission.verificationUsage.find(item => item.name === serviceName);
          if (existing) {
              existing.count += 1;
          } else {
              submission.verificationUsage.push({ name: serviceName, count: 1 });
          }
      };

      // Run verifications
      logUsage('Aadhaar Verification');
      const aadhaarResult = await api.verifyAadhaar(submission.personal.idProofNumber);
      
      logUsage('Bank AC Verification Advanced');
      const bankResult = await api.verifyBankAccountWithPerfios({
          accountNumber: submission.bank.accountNumber,
          ifscCode: submission.bank.ifscCode,
          accountHolderName: submission.bank.accountHolderName,
      });

      let uanResult = { success: true, message: '', verifiedFields: { uanNumber: true as boolean | null } };
      if (submission.uan.hasPreviousPf && submission.uan.uanNumber) {
          logUsage('EPF UAN Lookup');
          uanResult = await api.lookupUan(submission.uan.uanNumber);
      }

      // Update statuses
      submission.personal.verifiedStatus = submission.personal.verifiedStatus || {};
      submission.bank.verifiedStatus = submission.bank.verifiedStatus || {};
      submission.uan.verifiedStatus = submission.uan.verifiedStatus || {};

      submission.personal.verifiedStatus.idProofNumber = aadhaarResult.success;
      submission.bank.verifiedStatus.accountNumber = bankResult.verifiedFields.accountNumber;
      submission.bank.verifiedStatus.accountHolderName = bankResult.verifiedFields.accountHolderName;
      if (submission.uan.hasPreviousPf) {
          submission.uan.verifiedStatus.uanNumber = uanResult.verifiedFields.uanNumber;
      }

      // Update overall sync status
      const allSuccess = aadhaarResult.success && bankResult.success && uanResult.success;
      submission.portalSyncStatus = allSuccess ? 'synced' : 'failed';
      
      // If any verification fails, revert the main status to 'pending'
      if (!allSuccess) {
          submission.status = 'pending';
      }
      
      // Save back to DB
      db.onboardingSubmissions[submissionIndex] = submission;

      return JSON.parse(JSON.stringify(submission));
  },
  getPincodeDetails: async (pincode: string): Promise<{ city: string, state: string }> => {
      await delay(400);
      if (pincode.startsWith('560')) return { city: 'Bengaluru', state: 'Karnataka' };
      if (pincode.startsWith('600')) return { city: 'Chennai', state: 'Tamil Nadu' };
      throw new Error("Invalid pincode");
  },
  verifyProfilePhoto: async (base64: string, type: string): Promise<{ isValid: boolean, reason: string }> => {
    await delay(1000);
    return { isValid: true, reason: '' };
  },
  crossVerifyNames: async (name1: string, name2: string): Promise<{ isMatch: boolean, reason: string }> => {
      await delay(500);
      if (name1.toLowerCase() === name2.toLowerCase()) {
          return { isMatch: true, reason: 'Names are an exact match.' };
      }
      if (name1.toLowerCase().split(' ')[0] === name2.toLowerCase().split(' ')[0]) {
           return { isMatch: false, reason: 'First names match, but full names differ.' };
      }
      return { isMatch: false, reason: 'Names do not appear to match.' };
  },
  verifyAadhaar: async (aadhaarNumber: string | null | undefined): Promise<{ success: boolean; message: string }> => {
    await delay(800);
    if (aadhaarNumber && aadhaarNumber.length === 12 && Math.random() > 0.1) { // 90% success
        return { success: true, message: 'Aadhaar details verified (mocked).' };
    }
    return { success: false, message: 'Aadhaar verification failed (mocked).' };
  },
  verifyBankAccountWithPerfios: async (bankDetails: Pick<BankDetails, 'accountNumber' | 'ifscCode' | 'accountHolderName'>): Promise<{ success: boolean; message: string; verifiedFields: { accountHolderName: boolean | null; accountNumber: boolean | null; } }> => {
    await delay(1500);
    const success = Math.random() > 0.1; // 90% success rate
    if (success) {
        return { success: true, message: 'Bank account verified (mocked).', verifiedFields: { accountHolderName: true, accountNumber: true } };
    }
    return { success: false, message: 'Bank name mismatch found (mocked).', verifiedFields: { accountHolderName: false, accountNumber: true } };
  },
  lookupUan: async (uan: string | null | undefined): Promise<{ success: boolean; message: string; verifiedFields: { uanNumber: boolean | null; } }> => {
    await delay(1000);
    if (uan && uan.length === 12 && Math.random() > 0.2) { // 80% success
        return { success: true, message: 'UAN lookup successful (mocked).', verifiedFields: { uanNumber: true } };
    }
    return { success: false, message: 'UAN not found (mocked).', verifiedFields: { uanNumber: false } };
  },
  exportAllData: async (): Promise<any> => {
      await ensureDataInitialized();
      return { users: mockUsers, ...db };
  },
  uploadDocument: async (file: File): Promise<{ url: string }> => {
    await delay(750);
    return { url: `https://mockstorage.com/uploads/${Date.now()}-${file.name}` };
  },

  // Users & Orgs
  getUsers: async (): Promise<User[]> => {
    await delay(300);
    return JSON.parse(JSON.stringify(mockUsers));
  },
  getUsersWithManagers: async (): Promise<(User & { managerName?: string })[]> => {
    await delay(300);
    return JSON.parse(JSON.stringify(mockUsers.map(u => ({...u, managerName: mockUsers.find(m => m.id === u.reportingManagerId)?.name }))));
  },
  getFieldOfficers: async (): Promise<User[]> => {
      await delay(300);
      return mockUsers.filter(u => u.role === 'field_officer');
  },
  getNearbyUsers: async (): Promise<User[]> => {
    await delay(400);
    // Mock: return a subset of users
    return JSON.parse(JSON.stringify(mockUsers.filter(u => ['hr', 'operation_manager', 'site_manager'].includes(u.role))));
  },
  updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
    await delay(400);
    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) throw new Error("User not found");
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...updates };
    return mockUsers[userIndex];
  },
  createUser: async (user: User): Promise<User> => {
      await delay(400);
      const newUser = { ...user, id: `user_${Date.now()}` };
      mockUsers.push(newUser);
      return newUser;
  },
  deleteUser: async (id: string): Promise<void> => {
      await delay(400);
      const index = mockUsers.findIndex(u => u.id === id);
      if (index > -1) {
          mockUsers.splice(index, 1);
      }
  },
  updateUserReportingManager: async (userId: string, managerId: string | null): Promise<void> => {
    await delay(100);
    const user = mockUsers.find(u => u.id === userId);
    if(user) user.reportingManagerId = managerId || undefined;
  },
  getOrganizations: async (): Promise<Organization[]> => {
    await ensureDataInitialized();
    await delay(200);
    return JSON.parse(JSON.stringify(db.organizations));
  },
  createOrganization: async (org: Organization): Promise<Organization> => {
    await ensureDataInitialized();
    await delay(400);
    db.organizations.push(org);
    return org;
  },
  getOrganizationStructure: async (): Promise<OrganizationGroup[]> => {
    await ensureDataInitialized();
    await delay(400);
    return JSON.parse(JSON.stringify(db.organizationGroups));
  },
  getSiteConfigurations: async (): Promise<SiteConfiguration[]> => {
    await ensureDataInitialized();
    await delay(300);
    return JSON.parse(JSON.stringify(db.siteConfigs));
  },
  bulkUploadOrganizations: async(orgs: Organization[]): Promise<{ count: number }> => {
      await ensureDataInitialized();
      await delay(500);
      orgs.forEach(newOrg => {
          const index = db.organizations.findIndex(o => o.id === newOrg.id);
          if (index > -1) {
              db.organizations[index] = newOrg;
          } else {
              db.organizations.push(newOrg);
          }
      });
      return { count: orgs.length };
  },
  getModules: async (): Promise<AppModule[]> => {
    await ensureDataInitialized();
    await delay(200);
    return JSON.parse(JSON.stringify(db.modules));
  },
  saveModules: async (modules: AppModule[]): Promise<void> => {
    await ensureDataInitialized();
    await delay(400);
    db.modules = modules;
  },
  getRoles: async (): Promise<Role[]> => {
    await ensureDataInitialized();
    await delay(100);
    return JSON.parse(JSON.stringify(db.roles));
  },
  saveRoles: async (roles: Role[]): Promise<void> => {
    await ensureDataInitialized();
    await delay(400);
    db.roles = roles;
  },

  // Attendance, Leave, Tasks, Notifications
  getAttendanceEvents: async (userId: string, start: string, end: string): Promise<AttendanceEvent[]> => {
      await ensureDataInitialized();
      const startDate = new Date(start);
      const endDate = new Date(end);
      return db.attendanceEvents.filter(e => e.userId === userId && new Date(e.timestamp) >= startDate && new Date(e.timestamp) <= endDate);
  },
  getAllAttendanceEvents: async(start: string, end: string): Promise<AttendanceEvent[]> => {
    await ensureDataInitialized();
    const startDate = new Date(start);
    const endDate = new Date(end);
    return db.attendanceEvents.filter(e => new Date(e.timestamp) >= startDate && new Date(e.timestamp) <= endDate);
  },
  addAttendanceEvent: async (event: Omit<AttendanceEvent, 'id'>): Promise<void> => {
      await ensureDataInitialized();
      db.attendanceEvents.push({ ...event, id: `evt_${Date.now()}` });
  },
  createAssignment: async (officerId: string, siteId: string, date: string): Promise<void> => {
      await delay(400);
      console.log(`(Mock) Assigned officer ${officerId} to site ${siteId} for date ${date}`);
  },
  getLeaveBalancesForUser: async (userId: string): Promise<LeaveBalance> => {
    await delay(300);
    return { userId, earnedTotal: 12, earnedUsed: 2, sickTotal: 7, sickUsed: 1, floatingTotal: 3, floatingUsed: 0 };
  },
  submitLeaveRequest: async(data: Omit<LeaveRequest, 'id' | 'status' | 'currentApproverId' | 'approvalHistory'>): Promise<LeaveRequest> => {
    await ensureDataInitialized();
    const manager = mockUsers.find(u => u.id === data.userId)?.reportingManagerId;
    const newRequest: LeaveRequest = {
        ...data, id: `leave_${Date.now()}`, status: manager ? 'pending_manager_approval' : 'pending_hr_confirmation',
        currentApproverId: manager || mockUsers.find(u => u.role === 'hr')?.id || null, approvalHistory: [],
    };
    db.leaveRequests.push(newRequest);
    return newRequest;
  },
  getLeaveRequests: async (filter?: { userId?: string, status?: string, forApproverId?: string }): Promise<LeaveRequest[]> => {
    await ensureDataInitialized();
    let results = db.leaveRequests;
    if(filter?.userId) results = results.filter(r => r.userId === filter.userId);
    if(filter?.status) results = results.filter(r => r.status === filter.status);
    if(filter?.forApproverId) results = results.filter(r => r.currentApproverId === filter.forApproverId);
    return JSON.parse(JSON.stringify(results));
  },
  getTasks: async (): Promise<Task[]> => { await ensureDataInitialized(); return JSON.parse(JSON.stringify(db.tasks)); },
  createTask: async (data: any): Promise<Task> => {
      await ensureDataInitialized();
      const newTask: Task = { ...data, id: `task_${Date.now()}`, createdAt: new Date().toISOString(), status: 'To Do', escalationStatus: 'None' };
      db.tasks.push(newTask);
      return newTask;
  },
  updateTask: async (id: string, updates: Partial<Task>): Promise<Task> => {
    await ensureDataInitialized();
    const taskIndex = db.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) throw new Error("Task not found");
    db.tasks[taskIndex] = { ...db.tasks[taskIndex], ...updates };
    return db.tasks[taskIndex];
  },
  deleteTask: async (id: string): Promise<void> => { await ensureDataInitialized(); db.tasks = db.tasks.filter(t => t.id !== id); },
  runAutomaticEscalations: async(): Promise<{ updatedTasks: Task[], newNotifications: Notification[] }> => { return { updatedTasks: [], newNotifications: [] }; },
  // FIX: Added missing api.runProvisionalSiteChecks method to simulate background jobs.
  runProvisionalSiteChecks: async (): Promise<void> => {
      await ensureDataInitialized();
      const { siteManagement } = useSettingsStore.getState();
      if (!siteManagement.enableProvisionalSites) return;

      const provisionalSites = db.organizations.filter(o => o.provisionalCreationDate);
      const today = new Date();
      const adminsAndHr = mockUsers.filter(u => u.role === 'admin' || u.role === 'hr');

      for (const site of provisionalSites) {
          if (!site.provisionalCreationDate) continue;

          const creationDate = new Date(site.provisionalCreationDate);
          const daysSinceCreation = (today.getTime() - creationDate.getTime()) / (1000 * 3600 * 24);
          
          const daysLeft = 90 - daysSinceCreation;

          // Send one reminder when there are 15 days or less left.
          if (daysLeft > 0 && daysLeft <= 15) {
              for (const user of adminsAndHr) {
                  // This is a simple check to prevent spamming notifications on every page load.
                  // A real backend would have a more robust notification scheduling system.
                  const existingNotification = db.notifications.find(n => 
                      n.userId === user.id && 
                      n.type === 'provisional_site_reminder' &&
                      n.message.includes(`'${site.shortName}'`)
                  );

                  if (!existingNotification) {
                      const newNotif: Notification = {
                          id: `notif_${Date.now()}_${site.id}_${user.id}`,
                          userId: user.id,
                          type: 'provisional_site_reminder',
                          message: `The provisional site '${site.shortName}' is due for full configuration. ${Math.ceil(daysLeft)} days remaining.`,
                          linkTo: '/admin/sites',
                          isRead: false,
                          createdAt: new Date().toISOString(),
                      };
                      db.notifications.push(newNotif);
                  }
              }
          }
      }
  },
  getNotifications: async(userId: string): Promise<Notification[]> => { await ensureDataInitialized(); return JSON.parse(JSON.stringify(db.notifications.filter(n => n.userId === userId))); },
  createNotification: async(data: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<Notification> => {
      await ensureDataInitialized();
      const newNotif: Notification = { ...data, id: `notif_${Date.now()}`, isRead: false, createdAt: new Date().toISOString() };
      db.notifications.push(newNotif);
      return newNotif;
  },
  markNotificationAsRead: async(id: string): Promise<void> => { await ensureDataInitialized(); const notif = db.notifications.find(n => n.id === id); if(notif) notif.isRead = true; },
  markAllNotificationsAsRead: async(userId: string): Promise<void> => { await ensureDataInitialized(); db.notifications.forEach(n => { if (n.userId === userId) n.isRead = true; }); },

  // HR / Admin settings
  getPolicies: async(): Promise<Policy[]> => { await ensureDataInitialized(); return db.policies; },
  createPolicy: async(data: Omit<Policy, 'id'>): Promise<Policy> => { await ensureDataInitialized(); const newPol = { ...data, id: `pol_${Date.now()}` }; db.policies.push(newPol); return newPol; },
  getInsurances: async(): Promise<Insurance[]> => { await ensureDataInitialized(); return db.insurances; },
  createInsurance: async(data: Omit<Insurance, 'id'>): Promise<Insurance> => { await ensureDataInitialized(); const newIns = { ...data, id: `ins_${Date.now()}` }; db.insurances.push(newIns); return newIns; },
  getApprovalWorkflowSettings: async(): Promise<{finalConfirmationRole: UserRole}> => { return { finalConfirmationRole: 'hr' }; },
  updateApprovalWorkflowSettings: async(role: UserRole): Promise<void> => { await delay(200); },
  approveLeaveRequest: async(id: string, approverId: string): Promise<void> => { await ensureDataInitialized(); const req = db.leaveRequests.find(r => r.id === id); if(!req) return; req.status = 'pending_hr_confirmation'; req.currentApproverId = mockUsers.find(u => u.role === 'hr')?.id || null; },
  rejectLeaveRequest: async(id: string, approverId: string): Promise<void> => { await ensureDataInitialized(); const req = db.leaveRequests.find(r => r.id === id); if(!req) return; req.status = 'rejected'; },
  confirmLeaveByHR: async(id: string, hrId: string): Promise<void> => { await ensureDataInitialized(); const req = db.leaveRequests.find(r => r.id === id); if(!req) return; req.status = 'approved'; },
  getManpowerDetails: async(siteId: string): Promise<ManpowerDetail[]> => { await ensureDataInitialized(); return db.manpowerDetails[siteId] || []; },
  updateManpowerDetails: async(siteId: string, details: ManpowerDetail[]): Promise<void> => { await ensureDataInitialized(); db.manpowerDetails[siteId] = details; },
  getBackOfficeIdSeries: async(): Promise<BackOfficeIdSeries[]> => { await ensureDataInitialized(); return db.backOfficeIdSeries; },
  updateBackOfficeIdSeries: async(series: BackOfficeIdSeries[]): Promise<void> => { await ensureDataInitialized(); db.backOfficeIdSeries = series; },
  getSiteStaffDesignations: async(): Promise<SiteStaffDesignation[]> => { await ensureDataInitialized(); return db.siteStaffDesignations; },
  updateSiteStaffDesignations: async(designations: SiteStaffDesignation[]): Promise<void> => { await ensureDataInitialized(); db.siteStaffDesignations = designations; },
  getAllSiteAssets: async(): Promise<Record<string, Asset[]>> => { await ensureDataInitialized(); return db.siteAssets; },
  updateSiteAssets: async(siteId: string, assets: Asset[]): Promise<void> => { await ensureDataInitialized(); db.siteAssets[siteId] = assets; },
  getToolsList: async(): Promise<MasterToolsList> => { await ensureDataInitialized(); return db.masterTools; },
  getAllSiteIssuedTools: async(): Promise<Record<string, any[]>> => { await ensureDataInitialized(); return db.siteIssuedTools; },
  updateSiteIssuedTools: async(siteId: string, tools: any[]): Promise<void> => { await ensureDataInitialized(); db.siteIssuedTools[siteId] = tools; },
  getEnrollmentRules: async (): Promise<EnrollmentRules> => { await ensureDataInitialized(); return db.enrollmentRules.enforceManpowerLimit !== undefined ? db.enrollmentRules : { esiCtcThreshold: 21000, enforceManpowerLimit: true, manpowerLimitRule: 'warn', allowSalaryEdit: true, salaryThreshold: 21000, defaultPolicySingle: '1L', defaultPolicyMarried: '2L', enableEsiRule: true, enableGmcRule: true, enforceFamilyValidation: true, rulesByDesignation: { 'Security Guard': { documents: { aadhaar: true, pan: true, bankProof: true, educationCertificate: false, salarySlip: false, uanProof: false, familyAadhaar: false }, verifications: { requireBengaluruAddress: true, requireDobVerification: true } } } }; },
  
  // Uniforms
  getMasterGentsUniforms: async(): Promise<MasterGentsUniforms> => { await ensureDataInitialized(); return db.masterGentsUniforms; },
  getAllSiteGentsUniforms: async(): Promise<Record<string, SiteGentsUniformConfig>> => { await ensureDataInitialized(); return db.siteGentsUniforms; },
  updateSiteGentsUniforms: async(siteId: string, config: SiteGentsUniformConfig): Promise<void> => { await ensureDataInitialized(); db.siteGentsUniforms[siteId] = config; },
  getMasterLadiesUniforms: async(): Promise<MasterLadiesUniforms> => { await ensureDataInitialized(); return db.masterLadiesUniforms; },
  getAllSiteLadiesUniforms: async(): Promise<Record<string, SiteLadiesUniformConfig>> => { await ensureDataInitialized(); return db.siteLadiesUniforms; },
  updateSiteLadiesUniforms: async(siteId: string, config: SiteLadiesUniformConfig): Promise<void> => { await ensureDataInitialized(); db.siteLadiesUniforms[siteId] = config; },
  getAllSiteUniformDetails: async(): Promise<Record<string, SiteUniformDetailsConfig>> => { await ensureDataInitialized(); return db.siteUniformDetails; },
  updateSiteUniformDetails: async(siteId: string, config: SiteUniformDetailsConfig): Promise<void> => { await ensureDataInitialized(); db.siteUniformDetails[siteId] = config; },
  getUniformRequests: async(): Promise<UniformRequest[]> => { await ensureDataInitialized(); return db.uniformRequests; },
  submitUniformRequest: async(req: UniformRequest): Promise<void> => { await ensureDataInitialized(); db.uniformRequests.unshift(req); },
  updateUniformRequest: async(req: UniformRequest): Promise<void> => { await ensureDataInitialized(); const index = db.uniformRequests.findIndex(r => r.id === req.id); if(index > -1) db.uniformRequests[index] = req; },
  deleteUniformRequest: async(id: string): Promise<void> => { await ensureDataInitialized(); db.uniformRequests = db.uniformRequests.filter(r => r.id !== id); },

  // Gemini API
  extractDataFromImage: async (base64: string, mimeType: string, schema: any, docType?: string): Promise<any> => {
      console.log(`(Mock) Simulating Gemini OCR for docType: ${docType}`);
      await delay(1500); // Simulate AI processing time

      // This mock simulates a call to ai.models.generateContent
      // The real backend would make this call.
      const mockAiCall = async () => {
          // This structure mirrors the real Gemini API call for JSON output
          const imagePart = { inlineData: { data: base64, mimeType } };
          const request = {
              model: 'gemini-2.5-flash',
              contents: { parts: [imagePart] },
              config: {
                  responseMimeType: "application/json",
                  responseSchema: schema,
              },
          };
          console.log("Mock Gemini Request:", request);

          let mockResponseData = {};
          if (docType === 'Aadhaar') {
              mockResponseData = { name: "Ravi Kumar", dob: "1990-01-15", aadhaarNumber: "123456789012" };
          } else if (docType === 'Bank') {
              mockResponseData = { accountHolderName: "Ravi Kumar", accountNumber: "0987654321", ifscCode: "SBIN0001234", bankName: "State Bank of India", branchName: "Main Branch" };
          } else if (docType === 'UAN') {
              mockResponseData = { uanNumber: "100123456789" };
          } else if (docType === 'Salary') {
              mockResponseData = { uanNumber: "100123456789", esiNumber: "3100123456" };
          }

          // The real API returns a response object with a `text` property containing the JSON string.
          return {
              text: JSON.stringify(mockResponseData)
          };
      };

      const response = await mockAiCall();
      try {
          return JSON.parse(response.text);
      } catch (e) {
          console.error("Failed to parse mock Gemini response:", e);
          return {};
      }
  },
  enhanceDocumentPhoto: async(base64: string, mimeType: string): Promise<string> => {
      await delay(1000); return base64;
  },
  verifyFingerprintImage: async (base64: string, mimeType: string): Promise<{ containsFingerprints: boolean; reason: string }> => {
      await delay(800); return { containsFingerprints: true, reason: '' };
  },

  getVerificationCostBreakdown: async (startDate: string, endDate: string): Promise<SubmissionCostBreakdown[]> => {
    await ensureDataInitialized();
    await delay(700);
    
    const start = new Date(startDate.replace(/-/g, '/'));
    const end = new Date(endDate.replace(/-/g, '/'));
    
    const relevantSubmissions = db.onboardingSubmissions.filter(s => {
      if (s.status !== 'verified') return false;
      const subDate = new Date(s.enrollmentDate.replace(/-/g, '/'));
      return subDate >= start && subDate <= end;
    });

    return relevantSubmissions.map(s => {
      return {
        id: s.id!,
        employeeId: s.personal.employeeId,
        employeeName: `${s.personal.firstName} ${s.personal.lastName}`,
        enrollmentDate: s.enrollmentDate,
        totalCost: 0, // This will be calculated on the frontend
        breakdown: s.verificationUsage || [],
      };
    });
  },

  // Billing
  getInvoiceStatuses: async(date: Date): Promise<Record<string, any>> => { await ensureDataInitialized(); await delay(400); const statuses: Record<string, any> = {}; db.organizations.forEach(org => { const rand = Math.random(); if (rand < 0.2) statuses[org.id] = 'Not Generated'; else if (rand < 0.6) statuses[org.id] = 'Generated'; else if (rand < 0.8) statuses[org.id] = 'Sent'; else statuses[org.id] = 'Paid'; }); return statuses; },
  getInvoiceSummaryData: async(siteId: string, date: Date): Promise<InvoiceData> => {
    await ensureDataInitialized();
    await delay(800);
    const site = db.organizations.find(o => o.id === siteId);
    if (!site) throw new Error("Site not found");
    const lineItems: InvoiceLineItem[] = [ { id: '1', description: 'Security Guard', deployment: 10, noOfDays: 31, ratePerDay: 800, ratePerMonth: 24000 }, { id: '2', description: 'Security Supervisor', deployment: 2, noOfDays: 31, ratePerDay: 1000, ratePerMonth: 30000 }, { id: '3', description: 'Uniform Deduction', deployment: 0, noOfDays: 1, ratePerDay: 0, ratePerMonth: 500 }, ];
    return { siteName: site.fullName, siteAddress: site.address, invoiceNumber: `INV-${format(date, 'yyyyMM')}-${siteId.slice(-3)}`, invoiceDate: format(addDays(date, 5), 'dd-MM-yyyy'), statementMonth: format(date, 'MMMM yyyy'), lineItems, };
  },
  suggestDepartmentForDesignation: async(designation: string): Promise<string | null> => {
      console.log(`(Mock) Gemini suggestion for: ${designation}`);
      await delay(500);

      const lowerDesignation = designation.toLowerCase();
      if (lowerDesignation.includes('security') || lowerDesignation.includes('guard')) {
          return "Security";
      }
      if (lowerDesignation.includes('housekeep') || lowerDesignation.includes('clean')) {
          return "Housekeeping";
      }
      if (lowerDesignation.includes('manager') || lowerDesignation.includes('supervisor')) {
          return "Management";
      }
      
      return 'Other';
  },
  
  // Support Desk
  getSupportTickets: async (): Promise<SupportTicket[]> => {
    await ensureDataInitialized();
    await delay(500);
    return JSON.parse(JSON.stringify(db.supportTickets));
  },
  getSupportTicketById: async(id: string): Promise<SupportTicket | null> => {
    await ensureDataInitialized();
    await delay(300);
    const ticket = db.supportTickets.find(t => t.id === id);
    return ticket ? JSON.parse(JSON.stringify(ticket)) : null;
  },
  createSupportTicket: async(data: Omit<SupportTicket, 'id' | 'ticketNumber' | 'raisedAt' | 'posts'>): Promise<SupportTicket> => {
    await ensureDataInitialized();
    const newTicket: SupportTicket = {
      ...data,
      id: `ticket_${Date.now()}`,
      ticketNumber: `TICKET-${format(new Date(), 'yyyyMM')}-${String(db.supportTickets.length + 1).padStart(3, '0')}`,
      raisedAt: new Date().toISOString(),
      posts: [],
    };
    db.supportTickets.unshift(newTicket);
    return newTicket;
  },
  updateSupportTicket: async(id: string, updates: Partial<SupportTicket>, currentUserId: string, currentUserRole: string): Promise<SupportTicket> => {
    await ensureDataInitialized();
    const index = db.supportTickets.findIndex(t => t.id === id);
    if (index === -1) throw new Error("Ticket not found");

    const existingTicket = db.supportTickets[index];

    // Permission check for status change
    if (updates.status && updates.status !== existingTicket.status) {
      const isCreator = existingTicket.raisedById === currentUserId;
      const isAdmin = currentUserRole === 'admin';
      const isAssignedTo = existingTicket.assignedToId === currentUserId;

      if (!isAdmin) { // Admin can always change status
        if (updates.status === 'In Progress' && existingTicket.status === 'Open') {
          // Only creator or admin can assign to themselves
          if (!isCreator && !isAssignedTo) { // If not creator, must be assigning to self
            throw new Error("You do not have permission to assign this post.");
          }
        } else if (updates.status === 'Resolved' && existingTicket.status === 'In Progress') {
          // Only assigned user or admin can mark as resolved
          if (!isAssignedTo) {
            throw new Error("You do not have permission to resolve this post.");
          }
        } else if (updates.status === 'Closed' && existingTicket.status === 'Resolved') {
          // Only creator or admin can close the post
          if (!isCreator) {
            throw new Error("You do not have permission to close this post.");
          }
        } else {
          // Prevent other unauthorized status changes
          throw new Error("You do not have permission to change the status of this post.");
        }
      }
    }

    db.supportTickets[index] = { ...db.supportTickets[index], ...updates };
    const updatedTicket = db.supportTickets[index];

    // Notification logic for status changes
    if (updates.status && updates.status !== existingTicket.status) {
      // Send notification to the creator if status changed by someone else
      if (currentUserId !== updatedTicket.raisedById) {
        const creator = mockUsers.find(u => u.id === updatedTicket.raisedById);
        if (creator) {
          await api.createNotification({
            userId: creator.id,
            type: 'support_ticket_update',
            message: `Your support post "${updatedTicket.title}" status changed to ${updatedTicket.status}.`,
            linkTo: `/support/ticket/${updatedTicket.id}`,
          });
        }
      }
    }
    return updatedTicket;
  },
  addTicketPost: async(ticketId: string, postData: Omit<TicketPost, 'id' | 'createdAt' | 'likes' | 'comments'>): Promise<TicketPost> => {
    await ensureDataInitialized();
    const ticket = db.supportTickets.find(t => t.id === ticketId);
    if (!ticket) throw new Error("Ticket not found");
    const newPost: TicketPost = {
      ...postData,
      id: `post_${Date.now()}`,
      createdAt: new Date().toISOString(),
      likes: [],
      comments: [],
    };
    ticket.posts.push(newPost);
    return newPost;
  },
  togglePostLike: async(postId: string, userId: string): Promise<void> => {
    await ensureDataInitialized();
    const ticket = db.supportTickets.find(t => t.posts.some(p => p.id === postId));
    const post = ticket?.posts.find(p => p.id === postId);
    if (post) {
      const likeIndex = post.likes.indexOf(userId);
      if (likeIndex > -1) {
        post.likes.splice(likeIndex, 1);
      } else {
        post.likes.push(userId);
      }
    }
  },
  addPostComment: async(postId: string, commentData: Omit<TicketComment, 'id' | 'createdAt'>): Promise<TicketComment> => {
    await ensureDataInitialized();
    const ticket = db.supportTickets.find(t => t.posts.some(p => p.id === postId));
    const post = ticket?.posts.find(p => p.id === postId);
    if (!post) throw new Error("Post not found");
    const newComment: TicketComment = {
      ...commentData,
      id: `comment_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    post.comments.push(newComment);
    return newComment;
  },
  deleteTicketPost: async(postId: string, deletedById: string): Promise<void> => {
    await ensureDataInitialized();
    let postCreatorId: string | null = null;
    db.supportTickets = db.supportTickets.map(ticket => {
      const originalPostCount = ticket.posts.length;
      const updatedPosts = ticket.posts.filter(post => {
        if (post.id === postId) {
          postCreatorId = post.authorId;
          return false; // Remove the post
        }
        return true;
      });
      if (updatedPosts.length < originalPostCount) {
        // If a post was deleted from this ticket, send a notification
        if (postCreatorId && postCreatorId !== deletedById) {
          api.createNotification({
            userId: postCreatorId,
            type: 'support_ticket_update',
            message: `Your post in ticket "${ticket.title}" was deleted by an admin due to policy violations.`,
            linkTo: `/support/ticket/${ticket.id}`,
          });
        }
        return { ...ticket, posts: updatedPosts };
      }
      return ticket;
    });
  },
};