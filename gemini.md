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

## 3.7. Project Structure & Core Patterns (Comprehensive Review Feb 2026)

### 3.7.1. Folder Structure & Conventions
#### Backend (`backend/`)
-   **Core Modules:** `models/`, `controllers/`, `routes/`, `validation/`
-   **Support Modules:** `config/`, `middleware/`, `utils/`
-   **Entry Point:** `server.js`

#### Frontend (`frontend/`)
-   **Page/Routing:** `app/` (Next.js App Router, dynamic routes `[role]`)
-   **Components:** `components/` (`layout/`, `shared-components/`, `ui/`)
-   **Data/Logic:** `features/` (TanStack Query API services), `hooks/` (custom React hooks)
-   **Utilities:** `lib/`, `utils/`, `constants/`

### 3.7.2. Backend Modules & APIs

#### General Patterns
-   **Authentication & Authorization:** `auth.js` middleware for authentication, `checkPermission.js` for granular role-based access control. Permissions are defined in `config/permissions.js`.
-   **Mongoose Schemas:** Standardized with `timestamps: true`. Soft deletion is common using `isDeleted: Boolean` or `isActive: Boolean` flags.
-   **Controllers:** Implement standard CRUD operations, often including checks for existence, uniqueness, and `ObjectId` validity. Error handling uses `try-catch` with `next(error)` for global error handling. Pagination is implemented in `User` module.
-   **Validation:** **Inconsistent Implementation.**
    -   Modules like **Product, Supplier, Category, Brand** explicitly use **Joi validation** within their controllers for incoming request bodies, providing detailed error messages.
    -   Modules like **User, Branch** primarily rely on **Mongoose schema validation** (`required`, `unique`, `match` regex) and manual checks within controllers.
    -   This inconsistency could lead to varying API response formats for validation errors.

#### Specific Modules

**1. Authentication Module (`auth`)**
-   **Controller:** `authController.js`
-   **Routes:** `auth.routes.js` (`/api/auth`)
-   **Features:** User login, JWT generation.
-   **Validation:** Mongoose schema validation for User model.

**2. User Management Module (`users`)**
-   **Model:** `User.js`
-   **Controller:** `userController.js`
-   **Routes:** `user.routes.js` (`/api/users`)
-   **Features:** Full CRUD for users, admin bootstrapping, role and permission management, soft deletion, user-branch association. Pagination on `getAllUsers`.
-   **Validation:** Mongoose schema validation and manual checks.

**3. Branch Management Module (`branches`)**
-   **Model:** `branch.model.js`
-   **Controller:** `branch.controller.js`
-   **Routes:** `branch.routes.js` (`/api/branches`)
-   **Features:** CRUD for branches, status toggling (soft deactivation).
-   **Validation:** Mongoose schema validation and manual `ObjectId` validation.

**4. Product Management Module (`products`)**
-   **Model:** `product.model.js` (complex, nested variants, price/stock history)
-   **Controller:** `product.controller.js`
-   **Routes:** `product.routes.js` (`/api/products`)
-   **Features:** Full CRUD for products and their variants, SKU generation, image uploads (`multer` middleware), price/stock history tracking. Advanced Mongoose aggregation for data retrieval.
-   **Validation:** **Explicit Joi validation** in controller, plus Mongoose schema validation.

**5. Category Management Module (`categories`)**
-   **Model:** `category.model.js`
-   **Controller:** `category.controller.js`
-   **Routes:** `category.routes.js` (`/api/categories`)
-   **Features:** CRUD for categories, soft deactivation.
-   **Validation:** **Explicit Joi validation** in controller, plus Mongoose schema validation.

**6. Brand Management Module (`brands`)**
-   **Model:** `brand.model.js`
-   **Controller:** `brand.controller.js`
-   **Routes:** `brand.routes.js` (`/api/brands`)
-   **Features:** CRUD for brands, soft deactivation.
-   **Validation:** **Explicit Joi validation** in controller, plus Mongoose schema validation.

**7. Supplier Management Module (`suppliers`)**
-   **Model:** `supplier.model.js`
-   **Controller:** `supplier.controller.js`
-   **Routes:** `supplier.routes.js` (`/api/suppliers`)
-   **Features:** CRUD for suppliers, soft deactivation.
-   **Validation:** **Explicit Joi validation** in controller, plus Mongoose schema validation.

### 3.7.3. Frontend Modules & UI Patterns

#### General Patterns
-   **Next.js App Router:** Utilizes Next.js App Router for page-based routing and server components (though many UI components are client-side).
-   **State Management:** `@tanstack/react-query` is the primary tool for server-side data fetching, caching, and mutations across all modules.
-   **UI Library:** Consistent use of `shadcn/ui` components and Tailwind CSS for a cohesive design system.
-   **Modular Components:** `shared-components` directory holds module-specific UI (forms, tables, modals). `ui` directory holds reusable, generic UI elements.
-   **Custom Hooks:** `frontend/hooks/` contains module-specific hooks (e.g., `useSupplierHook`) that integrate `react-query` mutations/queries, manage form state, and abstract logic.
-   **API Services:** `frontend/features/*.api.js` files define API interactions using a centralized `api.js` (Axios instance).
-   **Authorization:** Frontend permissions logic (`usePermissions.js`, `permissions.js`) and role-based dynamic sidebar/navbar (`DynamicSidebar.jsx`, `DynamicNavbar.jsx`).

#### Specific Pages & Components

**1. Authentication UI (`app/(auth)/Login`)**
-   **Page:** `app/(auth)/Login/page.jsx`
-   **Components:** Login form using `Input`, `Button`, etc.
-   **API Service:** `auth.api.js`
-   **Hooks:** `useAuth.js`

**2. User Management UI (`app/[role]/users`)**
-   **Pages:** `create/page.jsx`, `[id]/edit/page.jsx`, `page.jsx` (list), `[id]/page.jsx` (details)
-   **Components:** `StaffForm.jsx`, `StaffTable.jsx` (in `shared-components/users`), `ComboBox.jsx`
-   **API Service:** `users.api.js`
-   **Hooks:** `useUsersHook.js`, `useAuth.js`, `usePermissions.js`

**3. Branch Management UI (`app/[role]/branches`)**
-   **Page:** `page.jsx`
-   **Components:** `branches-table.jsx`, `branch-modal.jsx` (in `shared-components/branches`)
-   **API Service:** `branch.api.js`
-   **Hooks:** `useBranchHook.js` (implied, needs to be verified if present)

**4. Product Management UI (`app/[role]/products`)**
-   **Pages:** `create/page.jsx`, `[id]/edit/page.jsx` (implied), `page.jsx` (list)
-   **Components:** Product forms, tables (in `shared-components/products`)
-   **API Service:** `product.api.js`
-   **Hooks:** `useProductHook.js`

**5. Category Management UI (`app/[role]/categories`)**
-   **Pages:** `create/page.jsx`, `[id]/edit/page.jsx` (implied), `page.jsx` (list)
-   **Components:** Category forms, tables (in `shared-components/categories`)
-   **API Service:** `category.api.js`
-   **Hooks:** `useCategoryHook.js`

**6. Brand Management UI (`app/[role]/brands`)**
-   **Pages:** `create/page.jsx`, `[id]/edit/page.jsx` (implied), `page.jsx` (list)
-   **Components:** Brand forms, tables (in `shared-components/brands`)
-   **API Service:** `brand.api.js`
-   **Hooks:** `useBrandHook.js`

**7. Supplier Management UI (`app/[role]/suppliers`)**
-   **Pages:** `page.jsx` (list)
-   **Components:** `suppliers-table.jsx`, `supplier-modal.jsx` (in `shared-components/suppliers`)
-   **API Service:** `supplier.api.js`
-   **Hooks:** `useSupplierHook.js`

**8. General UI & Utilities**
-   **Error Pages:** `forbidden`, `loading`, `not-found`, `unauthorized`
-   **Global Layout:** `DynamicNavbar.jsx`, `DynamicSidebar.jsx`
-   **Shared UI:** `frontend/components/ui/` (shadcn/ui, custom elements like `PhoneInput`, `UserAvatar`)
-   **Utilities:** `errorHandler.js`, `formatters.js`, `avatarUtils.js`, `permissions.js`, `roles.js`

### 3.7.4. Missing Modules & Future Enhancements

-   **Backend StockTransaction Module:** Crucial for detailed stock movement logging, reporting, and audit trails. Currently only suggested in `product.controller.js`.
-   **POS/Sales/Order Modules (Backend & Frontend):** Core e-commerce functionalities are absent.
-   **Reporting/Analytics Modules (Backend & Frontend):** Lacks dedicated components/APIs for business intelligence.
-   **Centralized Backend Validation Middleware:** To improve consistency, consider implementing a global middleware for Joi validation or ensuring all controllers explicitly use Joi. This would standardize error responses and reduce boilerplate.
-   **Frontend Form Validation:** While backend validation is robust, client-side validation using libraries like Zod/React Hook Form could enhance UX by providing immediate feedback.
-   **Unit/Integration Tests:** Comprehensive tests are still a stated open problem.

### 3.7.5. Code Consistency & Best Practices Summary

-   **Consistent Folder Structure:** Adhered to across both frontend and backend.
-   **Auth/Authz Implementation:** Strong and consistent across API routes and frontend UI.
-   **Modular Design:** Both frontend and backend are broken into logical, manageable modules.
-   **Technology Stack Adherence:** Next.js, React, Node.js, Express, Mongoose, TanStack Query, shadcn/ui, Tailwind CSS are used effectively.
-   **Soft Deletion Pattern:** Consistently applied for most entities.
-   **Inconsistent Backend Validation:** A key area for improvement to standardize API behavior and maintainability.

## 4. Open Problems & Next Steps

-   **Frontend-Backend Integration:** Continue to ensure seamless communication and data flow between frontend and backend.
-   **Comprehensive Testing:** Implement unit and integration tests for new features across both frontend and backend.
-   **Specific Grocery Features:** Begin implementation of core SuperMaret functionalities (e.g., product catalog, shopping cart, order processing).
