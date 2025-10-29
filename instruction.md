# Paradigm Employee Onboarding: Backend Development Guide

## 1. Introduction

### 1.1. Purpose

This document provides a comprehensive, step-by-step guide for building the backend services for the Paradigm Employee Onboarding application. The frontend is a fully functional prototype built with React, TypeScript, and Zustand, currently operating on a mock data layer. This guide details the frontend's architecture and provides a clear plan for creating a robust backend to replace this mock layer.

Adherence to this guide will ensure seamless integration with the existing frontend, as it is based on the exact data structures and API calls the client-side code expects.

### 1.2. The API Contract: `services/api.ts`

**This file is the single most important reference for the backend team.** It is the contract that the backend API must fulfill.

- **Centralized Logic:** All frontend data fetching and mutation logic is centralized in `services/api.ts`.
- **In-Memory Database:** It currently simulates a database using an in-memory `db` object, loaded from JSON files in the `/mocks` directory.
- **Contract Definition:** The function signatures (arguments, return types, and data structures from `types/index.ts`) in `api.ts` define the **exact endpoints, request payloads, and response structures** the backend needs to implement.

**The primary task of the backend team is to replace every function in `services/api.ts` with a real `fetch` call to a corresponding backend endpoint detailed in this guide.**

---

## 2. Core Architecture & Setup

### 2.1. Recommended Technology Stack

- **Runtime/Framework:** Node.js with **NestJS** or **Express** (with TypeScript). NestJS is recommended for its modular, opinionated architecture which aligns well with this project's feature set.
- **Database:** **PostgreSQL** is highly recommended for its support for relational data, powerful indexing, and robust `JSONB` column type.
- **ORM:** **Prisma** is the recommended Object-Relational Mapper. Its schema-first approach and excellent TypeScript integration provide unparalleled type safety, mirroring the frontend's stack.
- **Authentication:** **JWT (JSON Web Tokens)** for stateless authentication. Store tokens in `HttpOnly`, `Secure` cookies for security.
- **Asynchronous Jobs:** A queue system like **BullMQ** with Redis for handling long-running tasks like the "Portal Sync" verification process without blocking API requests.

### 2.2. Environment Variables

All sensitive information and environment-specific configurations **must** be managed via environment variables (a `.env` file). Never hardcode these values.

```env
# .env

# --- Database ---
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# --- Authentication ---
JWT_SECRET="YOUR_SUPER_SECRET_JWT_KEY"
JWT_EXPIRES_IN="7d"

# --- Third-Party API Keys ---
# IMPORTANT: This is the ONLY place the Gemini API key should be defined.
API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"

# Add keys for Perfios, Surepass, etc. as they are integrated.
PERFIOS_CLIENT_ID="..."
PERFIOS_CLIENT_SECRET="..."
```

### 2.3. Comprehensive Database Schema (Prisma)

The following Prisma schema is the source of truth for the database structure. It is designed to match the frontend types found in `types/index.ts`.

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// --- 1. Users, Roles & Permissions ---
model User {
  id                 String    @id @default(cuid())
  name               String
  email              String    @unique
  phone              String?
  roleId             String
  role               Role      @relation(fields: [roleId], references: [id])
  organizationId     String? // For site managers, etc.
  organizationName   String?
  reportingManagerId String?
  reportingManager   User?     @relation("ManagerEmployee", fields: [reportingManagerId], references: [id], onDelete: SetNull)
  employees          User[]    @relation("ManagerEmployee")
  photoUrl           String?   @db.Text
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  attendanceEvents   AttendanceEvent[]
  leaveRequests      LeaveRequest[]
  assignedTasks      Task[]            @relation("AssignedTasks")
  createdTasks       Task[]            @relation("CreatedTasks")
  createdNotifications Notification[]
}

model Role {
  id          String   @id @unique // e.g., 'admin', 'hr'
  displayName String
  users       User[]
  permissions String[] // Array of permission keys
}

model AppModule {
  id          String       @id @unique
  name        String
  description String
  permissions String[] // Array of permission keys
}


// --- 2. Onboarding & Submissions ---
model OnboardingSubmission {
  id                         String    @id @default(cuid())
  employeeId                 String    @unique
  status                     String    // 'draft', 'pending', 'verified', 'rejected'
  portalSyncStatus           String?   // 'pending_sync', 'synced', 'failed'
  organizationId             String?   @index
  organizationName           String?
  enrollmentDate             DateTime
  requiresManualVerification Boolean   @default(false)
  formsGenerated             Boolean   @default(false)

  // JSON blobs for flexible, nested data from the multi-step form
  // These map directly to the interfaces in `types/index.ts`
  personal          Json
  address           Json
  family            Json
  education         Json
  bank              Json
  uan               Json
  esi               Json
  gmc               Json
  organization      Json
  uniforms          Json
  biometrics        Json
  salaryChangeRequest Json?
  verificationUsage Json
  
  // To link to the User record after verification and user creation
  createdUserId String? @unique
}


// --- 3. Organization & Site Management ---
model OrganizationGroup {
  id        String    @id @default(cuid())
  name      String
  companies Company[]
}

model Company {
  id        String             @id @default(cuid())
  name      String
  groupId   String
  group     OrganizationGroup  @relation(fields: [groupId], references: [id], onDelete: Cascade)
  entities  Entity[]
}

model Entity {
  id                        String  @id @default(cuid())
  name                      String
  organizationId            String? @unique // Links to an Organization (Site)
  location                  String?
  registeredAddress         String?
  registrationType          String?
  registrationNumber        String?
  gstNumber                 String?
  panNumber                 String?
  email                     String?
  eShramNumber              String?
  shopAndEstablishmentCode  String?
  epfoCode                  String?
  esicCode                  String?
  psaraLicenseNumber        String?
  psaraValidTill            String?
  companyId                 String
  company                   Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  insuranceIds              String[]
  policyIds                 String[]
}

model Organization {
  id                    String @id @unique // The site ID, e.g., SITE-TATA
  shortName             String
  fullName              String
  address               String
  manpowerApprovedCount Int?
}

model SiteConfiguration {
  id             String @id @default(cuid())
  organizationId String @unique
  configData     Json   // Stores the entire SiteConfiguration object
}


// --- 4. Attendance, Leave, Tasks & Notifications ---
model AttendanceEvent {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  timestamp DateTime
  type      String   // 'check-in', 'check-out'
  latitude  Float?
  longitude Float?
}

model LeaveRequest {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  leaveType         String   // 'Earned', 'Sick', 'Floating'
  startDate         DateTime
  endDate           DateTime
  reason            String
  status            String   // 'pending_manager_approval', 'pending_hr_confirmation', 'approved', 'rejected'
  dayOption         String?  // 'full', 'half'
  currentApproverId String?
  approvalHistory   Json
  doctorCertificate Json?    // Store UploadedFile object
}

model Task {
  id                          String    @id @default(cuid())
  name                        String
  description                 String?
  dueDate                     DateTime?
  priority                    String    // 'Low', 'Medium', 'High'
  status                      String    // 'To Do', 'In Progress', 'Done'
  createdAt                   DateTime  @default(now())
  createdById                 String?
  createdBy                   User?     @relation("CreatedTasks", fields: [createdById], references: [id], onDelete: SetNull)
  assignedToId                String?
  assignedTo                  User?     @relation("AssignedTasks", fields: [assignedToId], references: [id], onDelete: SetNull)
  completionNotes             String?
  completionPhoto             Json?
  escalationStatus            String
  escalationLevel1UserId      String?
  escalationLevel1DurationDays Int?
  escalationLevel2UserId      String?
  escalationLevel2DurationDays Int?
  escalationEmail             String?
  escalationEmailDurationDays Int?
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  message   String
  type      String   // 'task_assigned', 'task_escalated'
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
  linkTo    String?
}


// --- 5. System Settings & HR Data ---
model Settings {
  id                      String @id @default("singleton") // Guarantees only one settings row
  attendanceSettings      Json
  gmcPolicy               Json
  enrollmentRules         Json
  apiSettings             Json   // Store enabled status, client IDs (NOT secrets)
  verificationCosts       Json
  backOfficeIdSeries      Json
  siteStaffDesignations   Json
  masterTools             Json
  masterGentsUniforms     Json
  masterLadiesUniforms    Json
}

model Holiday {
  id   String   @id @default(cuid())
  date String   @unique // YYYY-MM-DD
  name String
}

model Policy {
  id          String  @id @default(cuid())
  name        String
  description String?
}

model Insurance {
  id           String @id @default(cuid())
  type         String // 'GMC', 'GPA', 'WCA', 'Other'
  provider     String
  policyNumber String
  validTill    String // YYYY-MM-DD
}

model UniformRequest {
  id              String   @id @default(cuid())
  siteId          String
  siteName        String
  gender          String   // 'Gents' or 'Ladies'
  requestedDate   DateTime
  status          String   // 'Pending', 'Approved', 'Rejected', 'Issued'
  items           Json
  source          String?  // 'Bulk', 'Enrollment', 'Individual'
  requestedById   String?
  requestedByName String?
  employeeDetails Json?
}

// Store site-specific uniform configurations as JSON
model SiteGentsUniformConfig {
  id             String @id @default(cuid())
  organizationId String @unique
  configData     Json
}

model SiteLadiesUniformConfig {
  id             String @id @default(cuid())
  organizationId String @unique
  configData     Json
}

model SiteUniformDetailsConfig {
  id             String @id @default(cuid())
  organizationId String @unique
  configData     Json
}
```

---

## 4. Model-wise API & Logic Specification

This section details the required API endpoints, grouped by application module.

### 4.1. Authentication & User Profile

- **Frontend Logic:** The `useAuthStore` manages the user state. `Login.tsx`, `ForgotPassword.tsx`, and `UpdatePassword.tsx` handle auth forms. The `authService.ts` file is the mock implementation to replace. `ProfilePage.tsx` allows users to view/edit their own basic details.
- **Database Models:** `User`, `Role`.
- **API Endpoints:**
  - `POST /api/auth/login`
    - **Logic:** Find user by email. Compare provided password with stored hash using `bcrypt`. If valid, generate a JWT containing `userId` and `roleId`. Set JWT in an `HttpOnly` cookie and return the user object.
  - `POST /api/auth/google`
    - **Logic:** Handle Google OAuth flow. Use the returned email to find a `User` in your database. If found, generate JWT and proceed as with password login. If not found, return `403 Forbidden`.
  - `POST /api/auth/logout`
    - **Logic:** Clear the `HttpOnly` cookie.
  - `GET /api/auth/me`
    - **Logic:** Authenticated endpoint. Extract `userId` from JWT, retrieve user from DB, and return it.
  - `PATCH /api/auth/me`
    - **Logic:** Authenticated endpoint. Update the logged-in user's `name` and `phone`.

### 4.2. User Management

- **Frontend Logic:** `UserManagement.tsx` displays a table of users and uses a modal (`UserForm.tsx`) for create/edit operations.
- **Database Model:** `User`.
- **API Endpoints:**
  - `GET /api/users`: Returns `User[]`.
  - `POST /api/users`: Creates a new user. The frontend does not handle password creation; the body will be `Partial<User>`. The backend should set a temporary password or integrate with a "welcome email" flow.
  - `PATCH /api/users/:id`: Updates a user's details (name, role, etc.).
  - `DELETE /api/users/:id`: Deletes a user.

### 4.3. Role & Module Management

- **Frontend Logic:** `RoleManagement.tsx` and `ModuleManagement.tsx` allow admins to define roles and group permissions into modules. Changes are saved to the `usePermissionsStore` and then sent to the API.
- **Database Models:** `Role`, `AppModule`.
- **API Endpoints:**
  - `GET /api/roles`: Returns `Role[]`.
  - `PUT /api/roles`: Replaces the entire list of roles. Body: `Role[]`.
  - `GET /api/modules`: Returns `AppModule[]`.
  - `PUT /api/modules`: Replaces the entire list of modules. Body: `AppModule[]`.

### 4.4. Onboarding & Submissions

- **Frontend Logic:** This is the core workflow. `useOnboardingStore` holds the state for a single submission. The multi-step form is in `/pages/onboarding/AddEmployee.tsx` with child routes for each step. `PreUpload.tsx` uses OCR to pre-fill the store. `VerificationDashboard.tsx` is the admin view.
- **Database Model:** `OnboardingSubmission`.
- **API Endpoints:**
  - `GET /api/submissions`: Returns `OnboardingSubmission[]`. Supports `?status` and `?organizationId` query params for filtering.
  - `GET /api/submissions/:id`: Returns a single `OnboardingSubmission`.
  - `POST /api/submissions/draft`: Saves or updates a draft. The frontend sends the entire `OnboardingData` object. If the `id` in the object already exists, update it (`UPSERT`). Otherwise, create a new record and return its new `id`.
  - `POST /api/submissions`: Submits a completed form. Logic is similar to draft, but sets `status` to `'pending'`.
  - `PATCH /api/submissions/:id/verify`: Sets `status` to `'verified'` and `portalSyncStatus` to `'pending_sync'`.
  - `POST /api/submissions/:id/sync`
    - **CRITICAL LOGIC:** This must be an asynchronous, non-blocking operation.
    1.  Immediately respond with `202 Accepted`.
    2.  Add a job to a queue (e.g., BullMQ).
    3.  The background job worker will:
        a. Fetch the submission from the DB.
        b. Call external APIs (Perfios, etc.) using keys from environment variables.
        c. Log API usage by updating the `verificationUsage` JSON.
        d. Update the `verifiedStatus` fields within the `personal`, `bank`, and `uan` JSON blobs.
        e. If all verifications succeed, set `portalSyncStatus` to `'synced'`.
        f. If any verification fails, set `portalSyncStatus` to `'failed'` and revert the main `status` to `'pending'` so it reappears in the admin's queue for review.

### 4.5. Client, Site & HR Management

- **Frontend Logic:** `EntityManagement.tsx` is a complex dashboard for managing a hierarchy of Groups -> Companies -> Clients (Entities). `SiteManagement.tsx` manages Organizations (Sites), which are deployable locations linked to a Client. `PoliciesAndInsurance.tsx` and `EnrollmentRules.tsx` manage system-wide HR rules.
- **Database Models:** `OrganizationGroup`, `Company`, `Entity`, `Organization`, `SiteConfiguration`, `Policy`, `Insurance`, `Settings`.
- **API Endpoints:**
  - `GET /api/organization-structure`: Returns the full nested structure of groups, companies, and entities.
  - `GET /api/organizations`: Returns a flat list of `Organization[]` (sites).
  - `PUT /api/hr/site-configurations/:siteId`: Upsert a `SiteConfiguration` record. The body is the entire `SiteConfiguration` object, which will be stored in the `configData` JSONB column.
  - `GET /api/hr/manpower/:siteId`: Read manpower details (likely from `SiteConfiguration`).
  - `PUT /api/hr/manpower/:siteId`: Update manpower details.
  - `GET/POST /api/hr/policies`.
  - `GET/POST /api/hr/insurances`.
  - `GET/PUT /api/settings/enrollment-rules`: Read/write the `enrollmentRules` JSON from the `Settings` table.
  - `GET/PUT /api/settings/back-office-ids`, `GET/PUT /api/settings/site-staff-designations`: Similar to above, for their respective settings.

### 4.6. Attendance & Leave

- **Frontend Logic:** `AttendanceDashboard.tsx` for viewing records. `ProfilePage.tsx` for check-in/out. `LeaveDashboard.tsx` for employees to apply, and `LeaveManagement.tsx` for managers/HR to approve.
- **Database Models:** `AttendanceEvent`, `LeaveRequest`, `User` (for `reportingManagerId`).
- **API Endpoints:**
  - `GET /api/attendance/events`: Fetches events for a specific user and date range.
  - `POST /api/attendance/events`: Creates a new check-in/out event.
  - `GET /api/leaves/requests`: A flexible endpoint. If `forApproverId` is passed, it returns requests where `currentApproverId` matches. If `userId` is passed, it returns requests for that employee.
  - `POST /api/leaves/requests/:id/approve`:
    - **Logic:** Find the request. Find the requester's `reportingManagerId`. If the current approver is the manager, update `currentApproverId` to the HR user's ID and set status to `'pending_hr_confirmation'`. If the current approver is HR, set status to `'approved'` and `currentApproverId` to null.
  - All other leave endpoints are straightforward CRUD.

### 4.7. Billing & Costing

- **Frontend Logic:** `InvoiceSummary.tsx` generates monthly invoices per site. `CostAnalysis.tsx` aggregates API usage costs.
- **Database Models:** `OnboardingSubmission`, `Settings`.
- **API Endpoints:**
  - `GET /api/billing/cost-analysis`:
    - **Logic:** Query `OnboardingSubmission` within the date range. For each submission, read the `verificationUsage` JSON blob. Aggregate the counts for each verification type. Fetch costs from the `verificationCosts` JSON in the `Settings` table. Combine and return the final report.
  - `GET /api/billing/invoice-summary/:siteId`:
    - **Logic:** This is a complex report. It needs to calculate active manpower for the month, apply billing rates, and generate line items. The logic should be derived from the frontend's calculation in `InvoiceSummary.tsx`.

### 4.8. AI & Utilities

- **Frontend Logic:** `PreUpload.tsx` and various `UploadDocument` components call these endpoints.
- **Database Models:** None.
- **API Endpoints:**
  - `POST /api/utils/ocr/extract`
    - **Logic:**
      1.  This is a secure, backend-only endpoint.
      2.  Load the Gemini API key from `process.env.API_KEY`.
      3.  Receive `imageBase64`, `mimeType`, and `schema` from the request body.
      4.  Use `new GoogleGenAI({ apiKey: process.env.API_KEY })`.
      5.  Call `ai.models.generateContent` with the model, image part, text prompt (if any), and a `config` object containing `responseMimeType: "application/json"` and the provided `responseSchema`.
      6.  The response's `.text` property will be a JSON string. Parse it and return the resulting object to the client.
      7.  Implement robust error handling for API failures.
  - `POST /api/utils/ocr/enhance`: Similar to above, but using an image-to-image model or prompt.
  - `POST /api/utils/verify/names`: Can use a simple string-similarity library or another AI call to compare two names.

This comprehensive guide covers all aspects requested. By following it, your backend team will be able to build a server that is a perfect one-to-one replacement for the mock API, ensuring a smooth and successful project completion.