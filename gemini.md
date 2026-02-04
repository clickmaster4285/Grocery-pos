# Gemini Technical Assistant & Project Documentation

This document serves as the living technical memory, architectural overview, and decision log for the **SuperMaret** project. It is maintained by the Gemini technical assistant.

## 1. Project Overview & Architecture

The project is a full-stack web application designed to serve as a digital platform for a SuperMaret. It follows a modern, decoupled architecture with a separate frontend (Next.js/React) and backend (Node.js/Express).

## 2. Technologies & Frameworks

### Backend
-   **Runtime:** Node.js
-   **Framework:** Express.js (`^4.18.2`)
-   **Database:** MongoDB (Mongoose ODM `^8.0.0`)
-   **Authentication:** JSON Web Tokens (JWT `^9.0.2`)
-   **Validation:** Joi (`^17.11.0`)

### Frontend
-   **Framework:** Next.js (`16.1.1`), React (`19.2.3`)
-   **Styling:** Tailwind CSS (`^4`), shadcn/ui components
-   **API Communication:** Axios (`^1.13.2`)
-   **State Management:** TanStack Query (`^5.90.12`)

## 3. Key Features & Architectural Changes

This section summarizes the significant features and architectural updates implemented.

### 3.1. User Management & Authentication System Enhancements

#### 3.1.1. User Model & Authorization
-   **`User` Model:** Updated to include a single `role` (string) and a `permissions` array (strings) for explicit, permission-based authorization.
-   **Role-Based Mapping Deprecated:** `backend/config/roles.js` (including `ROLE_PERMISSIONS`) removed; permissions are now stored directly on the user.
-   **JWT Payload:** Now includes `userId`, `role`, and `permissions` for client-side authorization checks.
-   **Soft Delete:** Implemented for users (`isDeleted`, `deletedAt`, `deletedBy` fields) to prevent permanent data loss and maintain audit trails. Authentication and query logic respect this status.
-   **Admin Bootstrapping:** `backend/config/bootstrap.js` initializes a default admin user if none exists, assigning all available permissions.

#### 3.1.2. API Endpoints
-   **`/api/users/permissions` (GET):** New endpoint to retrieve all available system permissions, crucial for dynamic UI in user management.
-   **User CRUD Operations:** Implemented/fixed endpoints for creating, reading, updating, and soft-deleting users.
    -   `POST /api/users` (`users:create`)
    -   `GET /api/users` (`users:read`)
    -   `GET /api/users/:id` (`users:read`)
    -   `PATCH /api/users/:id` (`users:update`)
    -   `DELETE /api/users/:id` (`users:delete`)

#### 3.1.3. Middleware
-   **`auth` Middleware:** Ensures user is authenticated and not soft-deleted.
-   **`checkPermission` Middleware:** Validates explicit user permissions against route requirements.

### 3.2. Frontend User Interface & Experience

### 3.2.1. Staff Management Pages Refactor
Refactored staff management from modal-based interactions to dedicated pages for improved UX:
-   `frontend/app/[role]/users/create/page.jsx`: Dedicated page for new users creation.
-   `frontend/app/[role]/users/[id]/page.jsx`: For viewing users details (now includes a redesigned permissions table).
-   `frontend/app/[role]/users/[id]/edit/page.jsx`: For editing existing users.

#### 3.2.2. Component Enhancements
-   **`StaffForm`:** Adapted for page-based use (removed `Dialog` context), integrated `ComboBox` for role selection (supporting custom roles), and streamlined permission handling.
-   **`StaffTable`:** New component replacing `StaffCard` grid for a list-based display of staff members. Table rows are clickable for detail view.
-   **`StaffCard`:** Updated name display (`firstName`, `lastName`) and removed non-existent 'Department' field.
-   **`ComboBox` (`frontend/components/ui/combobox.jsx`):** New reusable UI component for flexible selection with custom input capabilities.
-   **`StaffDetailPage` (`frontend/app/[role]/users/[id]/page.jsx`):** Permissions are now displayed in a structured table with tick/cross icons for clarity.

#### 3.2.3. Authentication & Profile Hooks
-   **`frontend/hooks/useAuth.js`:** Centralized `useGetMe` (fetches current user) and new `useUpdateProfile` (updates user profile) hooks.
-   **`frontend/app/[role]/profile/page.jsx`:** Updated to use new auth hooks, correctly handles `firstName`/`lastName`, and includes `lastName` input.

### 3.3. Branch Management
A new feature for managing store branches has been implemented.

#### 3.3.1. Backend
-   **`Branch` Model:** A new model `backend/models/branch.model.js` has been created. It includes `branch_name`, `tax_region`, `opening_time`, `closing_time`, `status` ('ACTIVE' or 'INACTIVE'), and `address`.
-   **API Endpoints:** New endpoints have been added for branch management under `/api/branches`.
    -   `POST /` (`branches:create`): Create a new branch.
    -   `GET /` (`branches:read`): Retrieve all branches.
    -   `GET /:id` (`branches:read`): Retrieve a single branch.
    -   `PUT /:id` (`branches:update`): Update a branch.
    -   `DELETE /:id` (`branches:delete`): Toggle the status of a branch between 'ACTIVE' and 'INACTIVE'.
-   **Permissions:** New permissions `branches:create`, `branches:read`, `branches:update`, and `branches:delete` have been added to `backend/config/permissions.js`.

#### 3.3.2. Frontend
-   **Branch Management Page:** A new page at `frontend/app/[role]/branches/page.jsx` provides a UI for managing branches.
-   **Components:**
    -   A filterable and searchable table `frontend/components/shared-components/branches/branches-table.jsx` to display branches.
    -   Modals for creating/editing (`branch-modal.jsx`) and confirming status changes (`delete-confirmation-modal.jsx`).
-   **State Management & API:**
    -   API requests and caching are handled using `@tanstack/react-query` in `frontend/features/branch/branch.api.js`. It provides hooks like `useGetAllBranches`, `useCreateBranch`, `useUpdateBranch`, and `useToggleBranchStatus`.
-   **UI Integration:**
    -   The `DynamicSidebar.jsx` and `DashboardModule.jsx` have been modified to integrate the new branch management feature.

### 3.4. General Frontend Improvements & Bug Fixes

*   **Sidebar Icon Integration:**
    *   `frontend/constants/sidebarRoutes.js`: Added icons for 'Branches' and 'Products' modules to `MODULE_ICONS`.
*   **Sidebar Theming Update:**
    *   `frontend/components/layout/DynamicSidebar.jsx`: Reversed the color scheme for active and normal states in sidebar navigation items for better visual distinction.
*   **Next.js Client Component Directives:**
    *   `frontend/components/shared-components/branches/branch-modal.jsx` and `frontend/components/shared-components/branches/branches.jsx`: Added `"use client";` directives to resolve build errors related to React Hooks usage in App Router.

### 3.5. Enhanced User Management

#### 3.5.1. User-Branch Association
-   **Backend Model Update:**
    *   `backend/models/User.js`: Added an optional `branch_id` field (Mongoose `ObjectId` referencing the `Branch` model) to the User schema.
-   **API Controller Logic:**
    *   `backend/controllers/userController.js`:
        *   Imported `mongoose` and `Branch` model.
        *   `createUser` function: Modified to accept and validate the `branch_id` from the request body, ensuring it's a valid and active branch.
        *   `updateUser` function: Modified to accept and validate `branch_id` if present in update fields.
-   **Frontend Integration:**
    *   `frontend/app/[role]/users/create/page.jsx` and `frontend/app/[role]/users/[id]/edit/page.jsx`: Updated to fetch all available branches using `useGetAllBranches` and pass them to the `StaffForm` component.
    *   `frontend/components/shared-components/users/StaffForm.jsx`:
        *   Modified to accept a `branches` prop.
        *   Integrated a `ComboBox` for selecting a branch, mapping branch names to IDs.
        *   Updated form data to include the selected `branch_id` for user creation/updates.

#### 3.5.2. Admin User Exclusion
-   **API Controller Logic:**
    *   `backend/controllers/userController.js`: Modified the `getAllUsers` function to filter out users with the `role: 'admin'` from the returned list and total count.

#### 3.5.3. Permission Filtering for Non-Admins
-   **Frontend Logic:**
    *   `frontend/hooks/useUsersHook.js`: Implemented logic to filter the available permissions displayed in the user creation/edit form (`StaffForm`). Non-admin users can only see and assign permissions that they themselves possess. Admin users retain the ability to see and assign all permissions.

### 3.6. Avatar Generation Refinements

*   **Frontend Utility Update:**
    *   `frontend/utils/avatarUtils.js`:
        *   Corrected `primaryRole` calculation to use `user.role` (string) instead of `user.roles` (array).
        *   Refined `roleStyles` mappings for 'admin' (micah), 'manager' (personas), 'staff' (avataaars), and 'customer' (notionists) to ensure human-like and role-appropriate styles.
        *   Modified `generateAvatar` to pass all additional options as query parameters to DiceBear.
        *   **Simplified Approach:** Following user feedback, the detailed `roleSpecificOptions` were removed. Avatar generation now relies only on the `style` and `backgroundColor` derived from the user's role, providing a simplified yet functional and good-looking avatar.
        *   Cleaned up `console.log` statements.

## 4. Open Problems & Next Steps

-   **Frontend-Backend Integration:** Continue to ensure seamless communication and data flow between frontend and backend.
-   **Comprehensive Testing:** Implement unit and integration tests for new features across both frontend and backend.
-   **Specific Grocery Features:** Begin implementation of core SuperMaret functionalities (e.g., product catalog, shopping cart, order processing).