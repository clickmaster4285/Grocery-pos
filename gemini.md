# Gemini Technical Assistant & Project Documentation

This document serves as the living technical memory, architectural overview, and decision log for the **Grocery Store** project. It is maintained by the Gemini technical assistant.

## 1. Project Overview & Architecture

The project is a full-stack web application designed to serve as a digital platform for a grocery store. It follows a modern, decoupled architecture with a separate frontend (Next.js/React) and backend (Node.js/Express).

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

## 4. Open Problems & Next Steps

-   **Frontend-Backend Integration:** Continue to ensure seamless communication and data flow between frontend and backend.
-   **Comprehensive Testing:** Implement unit and integration tests for new features across both frontend and backend.
-   **Specific Grocery Features:** Begin implementation of core grocery store functionalities (e.g., product catalog, shopping cart, order processing).
