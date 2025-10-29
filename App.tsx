

import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import UpdatePassword from './pages/auth/UpdatePassword';
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import UserManagement from './pages/admin/UserManagement';
import { ApiSettings } from './pages/developer/ApiSettings';
import OperationsDashboard from './pages/operations/OperationsDashboard';
import SiteDashboard from './pages/site/OrganizationDashboard';
import Forbidden from './pages/Forbidden';
import { Loader2 } from 'lucide-react';
import Splash from './pages/Splash';
import AddEmployee from './pages/onboarding/AddEmployee';
import OnboardingHome from './pages/OnboardingHome';
import PersonalDetails from './pages/onboarding/PersonalDetails';
import AddressDetails from './pages/onboarding/AddressDetails';
// FIX: Changed to a named import as FamilyDetails is not a default export.
import { FamilyDetails } from './pages/onboarding/FamilyDetails';
import EducationDetails from './pages/onboarding/EducationDetails';
import BankDetails from './pages/onboarding/BankDetails';
import UanDetails from './pages/onboarding/UanDetails';
import EsiDetails from './pages/onboarding/EsiDetails';
import GmcDetails from './pages/onboarding/GmcDetails';
import OrganizationDetails from './pages/onboarding/OrganizationDetails';
import Documents from './pages/onboarding/Documents';
import Biometrics from './pages/onboarding/Biometrics';
import Review from './pages/onboarding/Review';
import VerificationDashboard from './pages/verification/VerificationDashboard';
import OnboardingPdfOutput from './pages/onboarding/OnboardingPdfOutput';
import SiteManagement from './pages/admin/OrganizationManagement';
import EntityManagement from './pages/hr/EntityManagement';
import RoleManagement from './pages/admin/RoleManagement';
import ProfilePage from './pages/profile/ProfilePage';
import AttendanceDashboard from './pages/attendance/AttendanceDashboard';
import AttendanceSettings from './pages/hr/AttendanceSettings';
import LeaveDashboard from './pages/leaves/LeaveDashboard';
import LeaveManagement from './pages/hr/LeaveManagement';
import ApprovalWorkflow from './pages/admin/ApprovalWorkflow';
import TaskManagement from './pages/tasks/TaskManagement';
import PoliciesAndInsurance from './pages/hr/PoliciesAndInsurance';
import SelectOrganization from './pages/onboarding/SelectOrganization';
import EnrollmentRules from './pages/hr/EnrollmentRules';
import UniformDashboard from './pages/uniforms/UniformDashboard';
import UniformDetails from './pages/onboarding/UniformDetails';
import InvoiceSummary from './pages/billing/InvoiceSummary';
import PreUpload from './pages/onboarding/PreUpload';
import MySubmissions from './pages/onboarding/MySubmissions';
import UniformRequests from './pages/onboarding/UniformRequests';
import Tasks from './pages/onboarding/MyTasks';
import FieldOfficerTracking from './pages/hr/FieldOfficerTracking';
import { useEnrollmentRulesStore } from './store/enrollmentRulesStore';
import InsurancePdfView from './pages/InsurancePdfView';
import { useMediaQuery } from './hooks/useMediaQuery';
import Logo from './components/ui/Logo';
import CostAnalysis from './pages/billing/CostAnalysis';
import { useThemeStore } from './store/themeStore';
import ModuleManagement from './pages/admin/ModuleManagement';
import { usePermissionsStore } from './store/permissionsStore';
import SupportDashboard from './pages/support/SupportDashboard';
import TicketDetail from './pages/support/TicketDetail';

const ThemeManager = () => {
  const { theme, isAutomatic, _setThemeInternal } = useThemeStore();
  const isMobile = useMediaQuery('(max-width: 767px)');

  useEffect(() => {
    // If mode is automatic, the theme should follow the device size.
    if (isAutomatic) {
      const deviceTheme = isMobile ? 'dark' : 'light';
      if (theme !== deviceTheme) {
        _setThemeInternal(deviceTheme);
      }
    }
  }, [isMobile, isAutomatic, theme, _setThemeInternal]);

  useEffect(() => {
    if (!theme) return; // Wait until theme is determined

    const body = document.body;
    body.classList.remove('pro-dark-theme');

    if (theme === 'dark') {
      body.classList.add('pro-dark-theme');
    }
  }, [theme]);

  return null; // This component only manages side effects
};


const App: React.FC = () => {
  const { user, isInitialized, init } = useAuthStore();
  const location = useLocation();
  const checkAttendanceStatus = useAuthStore((state) => state.checkAttendanceStatus);
  const { init: initRules } = useEnrollmentRulesStore();
  const { initRoles } = usePermissionsStore();
  
  useEffect(() => {
    init(); // Main auth listener in store
    initRules(); // Initialize enrollment rules
    initRoles(); // Initialize dynamic roles for permissions
  }, [init, initRules, initRoles]);

  useEffect(() => {
    if (user) {
      checkAttendanceStatus();
    }
  }, [user, checkAttendanceStatus]);

  const getHomeRoute = () => {
      if (!user) return "/auth/login";
      // After login, all users land on their profile page.
      return "/profile";
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <Logo className="h-16 mb-8 splash-logo" />
      </div>
    );
  }

  return (
    <>
      <ThemeManager />
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route element={<AuthLayout />}>
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/update-password" element={<UpdatePassword />} />
        </Route>
        
        <Route path="/forbidden" element={<Forbidden />} />
        
        {/* All protected routes are wrapped in MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route element={<ProtectedRoute requiredPermission="manage_users" />}>
            <Route path="/admin/users" element={<UserManagement />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="manage_sites" />}>
            <Route path="/admin/sites" element={<SiteManagement />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="manage_roles_and_permissions" />}>
            <Route path="/admin/roles" element={<RoleManagement />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="manage_modules" />}>
            <Route path="/admin/modules" element={<ModuleManagement />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="manage_approval_workflow" />}>
            <Route path="/admin/approval-workflow" element={<ApprovalWorkflow />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="view_all_submissions" />}>
            <Route path="/verification/dashboard" element={<VerificationDashboard />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="view_entity_management" />}>
            <Route path="/hr/entities" element={<EntityManagement />} />
          </Route>
           <Route element={<ProtectedRoute requiredPermission="manage_attendance_rules" />}>
            <Route path="/hr/attendance-settings" element={<AttendanceSettings />} />
          </Route>
           <Route element={<ProtectedRoute requiredPermission="manage_leave_requests" />}>
            <Route path="/hr/leave-management" element={<LeaveManagement />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="manage_insurance" />}>
            <Route path="/hr/policies-and-insurance" element={<PoliciesAndInsurance />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="manage_enrollment_rules" />}>
            <Route path="/hr/enrollment-rules" element={<EnrollmentRules />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="manage_tasks" />}>
            <Route path="/tasks" element={<TaskManagement />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="manage_uniforms" />}>
            <Route path="/uniforms" element={<UniformDashboard />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="view_invoice_summary" />}>
            <Route path="/billing/summary" element={<InvoiceSummary />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="view_verification_costing" />}>
            <Route path="/billing/cost-analysis" element={<CostAnalysis />} />
          </Route>
           <Route element={<ProtectedRoute requiredPermission="view_field_officer_tracking" />}>
            <Route path="/hr/field-officer-tracking" element={<FieldOfficerTracking />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="view_developer_settings" />}>
            <Route path="/developer/api" element={<ApiSettings />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="view_operations_dashboard" />}>
            <Route path="/operations/dashboard" element={<OperationsDashboard />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="view_site_dashboard" />}>
            <Route path="/site/dashboard" element={<SiteDashboard />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="view_own_attendance" />}>
            <Route path="/attendance/dashboard" element={<AttendanceDashboard />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="apply_for_leave" />}>
            <Route path="/leaves/dashboard" element={<LeaveDashboard />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="access_support_desk" />}>
            <Route path="/support" element={<SupportDashboard />} />
            <Route path="/support/ticket/:id" element={<TicketDetail />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="create_enrollment" />}>
            <Route path="/onboarding" element={<OnboardingHome />} />
            <Route path="/onboarding/select-organization" element={<SelectOrganization />} />
            <Route path="/onboarding/pre-upload" element={<PreUpload />} />
            <Route path="/onboarding/submissions" element={<MySubmissions />} />
            <Route path="/onboarding/uniforms" element={<UniformRequests />} />
            <Route path="/onboarding/tasks" element={<Tasks />} />
            <Route path="/onboarding/add" element={<AddEmployee />}>
              <Route path="personal" element={<PersonalDetails />} />
              <Route path="address" element={<AddressDetails />} />
              <Route path="family" element={<FamilyDetails />} />
              <Route path="education" element={<EducationDetails />} />
              <Route path="bank" element={<BankDetails />} />
              <Route path="uan" element={<UanDetails />} />
              <Route path="esi" element={<EsiDetails />} />
              <Route path="gmc" element={<GmcDetails />} />
              <Route path="organization" element={<OrganizationDetails />} />
              <Route path="uniform" element={<UniformDetails />} />
              <Route path="documents" element={<Documents />} />
              <Route path="biometrics" element={<Biometrics />} />
              <Route path="review" element={<Review />} />
              <Route index element={<Navigate to="personal" replace />} />
            </Route>
          </Route>
           
           {/* PDF generation routes */}
           <Route path="/onboarding/pdf/:id" element={<OnboardingPdfOutput />} />
           <Route path="/insurance-card/:id" element={<InsurancePdfView />} />
        </Route>
        
        <Route path="*" element={<Navigate to={getHomeRoute()} />} />
      </Routes>
    </>
  );
};

export default App;