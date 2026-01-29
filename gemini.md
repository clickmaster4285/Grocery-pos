# Gemini Technical Assistant & Project Documentation

This document serves as the living technical memory, architectural overview, and decision log for the **Grocery Store** project. It is maintained by the Gemini technical assistant.

## 1. Project Overview & Architecture

The project is a full-stack web application designed to serve as a digital platform for a grocery store. It follows a modern, decoupled architecture with a separate frontend and backend.

-   **Frontend:** A client-side application built with Next.js and React. It is responsible for all UI, user interaction, and communication with the backend API. The file structure suggests a feature-rich platform with role-based access control (e.g., for different user types like 'admin', 'customer'), dashboards, and profile management.
-   **Backend:** A server-side API built with Node.js and the Express framework. It handles business logic, data persistence, and authentication. The structure follows a standard Model-View-Controller (MVC) like pattern, with clear separation for routes, controllers, models, and middleware.

## 2. Technologies & Frameworks

### Backend
-   **Runtime:** Node.js
-   **Framework:** Express.js (`^4.18.2`)
-   **Database:** MongoDB, accessed via Mongoose ODM (`^8.0.0`)
-   **Authentication:** JSON Web Tokens (JWT) (`jsonwebtoken` `^9.0.2`)
-   **Validation:** Joi (`^17.11.0`)
-   **Security:** Helmet (`^7.1.0`), express-rate-limit (`^7.1.5`)
-   **Dev Tools:** Nodemon, ESLint, Prettier, Jest

### Frontend
-   **Framework:** Next.js (`16.1.1`)
-   **Library:** React (`19.2.3`)
-   **Styling:** Tailwind CSS (`^4`)
-   **UI Components:** Radix UI primitives (e.g., `@radix-ui/react-label`) and `lucide-react` for icons. The structure strongly indicates a utility-first, composable UI methodology.
-   **API Communication:** Axios (`^1.13.2`)
-   **State Management:** TanStack Query (React Query) (`^5.90.12`) for server state management.
-   **Linting:** ESLint

## 3. Current System Behavior & Limitations

-   **Behavior:** The application is set up to support user authentication and has distinct routes for different user roles. A basic structure for dashboards, profile pages, and settings is in place.
-   **Limitations:**
    -   This is a foundational setup. Most UI components and backend endpoints are likely placeholders or not yet fully implemented.
    -   The frontend and backend are not yet integrated. API calls may be mocked or not yet written.
    -   The database connection (`backend/config/database.js`) is configured but may not point to a provisioned development or production database.
    -   There are no unit or integration tests (`"test": "jest"` script exists but no test files are visible).

## 4. Open Problems, Risks & Assumptions

-   **Assumption:** The backend is intended to connect to a MongoDB database.
-   **Assumption:** The roles defined in the frontend (`[role]` directory) correspond to roles managed by the backend's authentication and authorization logic.
-   **Risk:** Environment variables (e.g., database connection strings, JWT secrets in `.env`) are not configured for different environments (development, staging, production), which is a security risk.
-   **Open Problem:** The specific features of the "Grocery Store" (e.g., product catalog, inventory management, shopping cart, order processing) are not yet defined or implemented. The current focus is on the user management and application structure.

## 5. User Management & Authentication System (Design)

This section outlines the architecture for a robust, scalable, and secure user management system. The focus is on a JWT-based authentication flow combined with a powerful role and permission-based authorization model.

### 5.1. User ID Strategy

A custom, unique User ID will be generated upon user creation. This ID is immutable and serves as the primary external identifier for a user.

-   **Format:** `[INITIALS]-[ROLE_INITIAL]-[RANDOM_HEX]-[TIMESTAMP]`
-   **Example:** `JD-A-E4B7-1706023312` (For user John Doe, created as an Admin).
    -   `INITIALS`: First letters of the `firstName` and `lastName`.
    -   `ROLE_INITIAL`: First letter of the user's initial role (immutable).
    -   `RANDOM_HEX`: A 4-character random hexadecimal string for entropy.
    -   `TIMESTAMP`: A Unix timestamp (seconds) at the moment of creation.

-   **Rationale**: This strategy creates a unique, non-sequential, and partially human-readable identifier without needing a database lock. Uniqueness is guaranteed by the combination of a high-entropy random component and a high-resolution timestamp, making it suitable for distributed systems and preventing enumeration attacks.

### 5.2. Permission System Design

The system uses a configuration-based approach, defining permissions and roles in central files to act as a single source of truth.

-   **Source of Truth**: A `backend/config/permissions.js` file will define all possible actions in the system using a `module:action` naming convention (e.g., `users:create`).
-   **Role Mapping**: A `backend/config/roles.js` file will define available roles (e.g., `admin`, `manager`) and map them to an array of permission strings from the permissions file.

-   **Rationale**:
    -   **Decoupled & Scalable**: Roles and permissions are not hardcoded. New permissions can be defined and assigned to roles without changing application logic.
    -   **Frontend-Friendly**: The constant strings are easily shareable and can be used on the client-side to conditionally render UI components.
    -   **Centralized Control**: Provides a single place to audit and manage all system capabilities.

### 5.3. Data Models

-   **`User` Model (Mongoose Schema)**
    -   `userId` (String, required, unique): The custom-generated ID.
    -   `firstName` (String, required): User's first name.
    -   `lastName` (String, required): User's last name.
    -   `email` (String, required, unique, lowercase): User's login email.
    -   `password` (String, required, select: false): Bcrypt-hashed password.
    -   `roles` ([String], required): An array of role names (e.g., `['manager']`).
    -   `isActive` (Boolean, default: true): For soft-deletes or deactivation.
    -   `lastLogin` (Date): Timestamp of the last successful login.
    -   `timestamps`: Enabled for `createdAt` and `updatedAt`.

-   **Rationale**: The `User` object remains lean by only storing assigned `roles`. The specific permissions are derived at runtime from the central configuration files. This is more efficient and scalable than embedding a large, potentially redundant list of permissions within each user document.

### 5.4. Route & Middleware Flow

A multi-step middleware process will secure all protected endpoints.

**Request Lifecycle for a Protected Route (e.g., `GET /api/users`):**

1.  **Incoming Request**: A request arrives with an `Authorization: Bearer <jwt>` header.
2.  **`auth` Middleware (Authentication)**:
    -   Verifies the JWT's signature and expiration.
    -   Extracts the `userId` from the token's payload.
    -   Fetches the corresponding user from the database.
    -   Attaches the user object to the request (e.g., `req.user`). If the token or user is invalid, it rejects with a `401 Unauthorized` error.
3.  **`checkPermission(permission)` Middleware (Authorization)**:
    -   This middleware is called with a specific permission required for the route (e.g., `checkPermission('users:read')`).
    -   It checks the `req.user.roles` against the `ROLE_PERMISSIONS` configuration to see if the user has the necessary permission.
    -   If authorized, it calls `next()`. If not, it rejects with a `403 Forbidden` error.
4.  **Controller**:
    -   If all middleware checks pass, the request handler in the controller executes its logic.

### 5.5. API Endpoints

The following table details the implemented API endpoints for user management and authentication.

| Method | Path               | Required Permission | Description                                  |
| :----- | :----------------- | :------------------ | :------------------------------------------- |
| `POST` | `/api/auth/login`  | (Public)            | Authenticates a user and returns a JWT.      |
| `GET`  | `/api/auth/me`     | (Authenticated)     | Retrieves the profile of the current user.   |
| `POST` | `/api/users`       | `users:create`      | Creates a new user. (Admin only)             |
| `GET`  | `/api/users`       | `users:read`        | Retrieves a list of all users. (Admin only)  |
| `GET`  | `/api/users/:id`   | `users:read`        | Retrieves a single user by their `userId`.   |
| `PATCH`| `/api/users/:id`   | `users:update`      | Updates a user's information.                |
| `DELETE`| `/api/users/:id`  | `users:delete`      | Deactivates a user (soft delete).            |

### 5.6. Soft Delete with Audit Trail

To enhance data integrity and support auditing, the system now uses a soft-delete mechanism instead of permanently deleting users. This approach is crucial for maintaining historical data, enabling account recovery, and ensuring that internal references (e.g., who created a resource) remain intact even after a user is "deleted".

#### 5.6.1. Data Model Changes

The `User` model has been updated with the following fields to support soft deletion and auditing:

-   **`isDeleted`** (Boolean, default `false`, indexed): Flags a user as deleted without removing the record from the database. An index is used to optimize queries that filter out deleted users.
-   **`deletedAt`** (Date, nullable): A timestamp that records the exact moment a user was soft-deleted.
-   **`deletedBy`** (ObjectId, ref: 'User', nullable): Stores the `_id` of the administrator or user who performed the delete operation, providing a clear audit trail.

#### 5.6.2. Impact on Authentication & Authorization

The authentication and authorization layers have been updated to enforce soft-delete rules:

1.  **Login Prevention**: The `login` endpoint now rejects authentication attempts from users who are flagged as `isDeleted: true`.
2.  **Global Access Denial**: The core `auth` middleware has been modified to check the `isDeleted` status of a user on every authenticated request. If a user's token is valid but their account has been soft-deleted, they will be treated as unauthorized, effectively blocking them from accessing any protected endpoint (including `getMe`).

#### 5.6.3. API and Query Behavior

-   **Delete Endpoint**: The `DELETE /api/users/:id` endpoint no longer deactivates a user but now performs a soft delete by setting the `isDeleted`, `deletedAt`, and `deletedBy` fields.
-   **Query Safety**: All internal API queries that retrieve user data (e.g., `find`, `findOne`, `findOneAndUpdate`) have been modified to automatically exclude soft-deleted users by adding the condition `{ isDeleted: false }`. This prevents accidentally exposing or acting upon deleted user accounts. Any exceptions for administrative or auditing purposes would require an explicit query to include `isDeleted: true`.

### 5.7. Default Admin User Bootstrapping

To ensure system operability and simplify initial setup, a mechanism has been implemented to safely initialize a default administrator account upon backend startup. This process is designed to be idempotent and secure, only creating the admin user if one with the specified criteria does not already exist.

#### 5.7.1. Environment Variable Configuration

Default admin credentials are sourced exclusively from environment variables to prevent hardcoding sensitive information and allow for flexible deployment. The following variables are required:

-   `ADMIN_FIRST_NAME`: First name of the default admin.
-   `ADMIN_LAST_NAME`: Last name of the default admin.
-   `ADMIN_EMAIL`: Email address for the default admin (must be unique).
-   `ADMIN_PASSWORD`: Password for the default admin.
-   `ADMIN_ROLE`: Role assigned to the default admin (should be 'admin' to grant full access).

**Rationale**: Using environment variables ensures that sensitive data is kept out of the codebase and can be managed independently for different deployment environments (development, staging, production).

#### 5.7.2. Initialization Logic (`backend/config/bootstrap.js`)

A dedicated module, `backend/config/bootstrap.js`, houses the logic for admin account initialization. This module defines the `initializeAdminAccount` function, which performs the following steps:

1.  **Environment Variable Validation**: Checks for the presence of all required `ADMIN_*` environment variables. If any are missing, the server startup process will fail fast with a clear error, preventing insecure defaults.
2.  **Idempotency Check**: It queries the database to determine if an active, non-deleted user with the `admin` role already exists.
3.  **Conditional Creation**:
    -   If an existing admin is found, the process logs a message and takes no further action, ensuring no duplicate accounts are created.
    -   If no admin exists, a new admin user is created using the provided environment variables.
4.  **Secure Password Handling**: The `ADMIN_PASSWORD` is hashed using the application's existing `password` utility (`backend/utils/password.js`) before being stored, ensuring it is never saved in plain text.
5.  **User ID Generation**: The `userId` for the new admin is generated using the application's standard `userIdGenerator` utility (`backend/utils/userIdGenerator.js`).

#### 5.7.3. Integration Point

The `initializeAdminAccount` function is called from `backend/server.js`. It runs **after** the database connection has been successfully established but **before** the Express server starts listening for incoming requests. This ensures that the admin user is available immediately upon application startup and that database operations can be performed reliably.

#### 5.7.4. Security Considerations

-   **Hashed Passwords**: The default admin password is always hashed.
-   **No Credential Logging**: Admin credentials are never logged to console or files.
-   **Fail-Fast on Missing Environment Variables**: The system explicitly checks for the presence of all necessary `ADMIN_*` environment variables and will terminate startup if they are not found. This prevents the server from starting in an insecure or incomplete state.
-   **No API Exposure**: The admin creation mechanism is internal to the application startup process and is not exposed via any public API endpoint, mitigating external attack vectors.
-   **Single Admin Guarantee**: The idempotency check ensures that only one default admin user can be created through this process, preventing unintended privilege escalation or account proliferation.

## 6. Frontend Authentication and Authorization

This section details the frontend's architecture for securely managing user authentication and authorization, integrating seamlessly with the backend's established system. The design prioritizes clean architecture, reusability, and a robust user experience.

### 6.1. Environment Configuration

-   **`NEXT_PUBLIC_API_BASE_URL`**: This environment variable is added to `frontend/.env` to store the base URL of the backend API.
-   **Access**: In Next.js, variables prefixed with `NEXT_PUBLIC_` are automatically exposed to the browser and can be accessed via `process.env.NEXT_PUBLIC_API_BASE_URL` in both client and server-side code.
-   **Rationale**: Centralizing the API base URL in environment variables prevents hardcoding and allows for easy configuration across different deployment environments.

### 6.2. API Layer (Feature-Based)

The API communication layer is organized by feature, promoting modularity and maintainability.

-   **Structure**: API functions for a given feature reside in `frontend/features/[featureName]/[featureName].api.js` (e.g., `frontend/features/auth/auth.api.js`, `frontend/features/users/users.api.js`).
-   **Core API Client (`frontend/lib/api.js`)**:
    -   Utilizes `axios` for HTTP requests.
    -   `baseURL` is dynamically set from `NEXT_PUBLIC_API_BASE_URL`.
    -   **Request Interceptor**: Automatically attaches the JWT token from `localStorage` to the `Authorization` header for all outgoing requests.
    -   **Response Interceptor**: Handles global error responses. Specifically, for a `401 Unauthorized` response, it removes the invalid token from `localStorage`, allowing the authentication state management to initiate a redirect to the login page.
-   **Rationale**: This design keeps API logic separate from UI components, ensures consistent request/response handling, and centralizes JWT management.

### 6.3. TanStack Query Integration

TanStack Query (React Query) is used for efficient server state management.

-   **Structure**: Queries and mutations are encapsulated in feature-level hooks (e.g., `frontend/features/auth/auth.hooks.js`, `frontend/features/users/users.hooks.js`).
-   **Key Hooks**:
    -   `useLogin()`: Mutation for user login. On success, it stores the JWT and invalidates the `me` query.
    -   `useGetMe()`: Query to fetch the authenticated user's profile. Used as the source of truth for authentication status and user data.
    -   `useGetAllUsers()`, `useGetUserById()`, `useCreateUser()`, `useUpdateUser()`, `useDeleteUser()`: Hooks for user CRUD operations.
-   **Features**: Provides caching, background refetching, loading/error state management, and query invalidation mechanisms.
-   **Rationale**: TanStack Query streamlines data fetching, reduces boilerplate, and optimizes UI rendering by managing complex asynchronous operations.

### 6.4. Authentication State Management (`frontend/hooks/useAuth.js`)

A central `useAuth` hook provides a single source of truth for the application's authentication state.

-   **JWT Storage**: The JWT token is stored in `localStorage`.
-   **`useAuth` Hook Responsibilities**:
    -   Manages `isAuthenticated`, `user` data (derived from `useGetMe`), `isLoading` status, and `logout` functionality.
    -   **`logout()`**: Clears the JWT from `localStorage`, invalidates the entire TanStack Query cache (`queryClient.clear()`), and redirects the user to the `/login` page.
    -   **Error Handling (401/403)**:
        -   If a `401 Unauthorized` error is detected (e.g., expired/invalid JWT), the `logout()` function is called, leading to a redirect to `/login`.
        -   If a `403 Forbidden` error occurs, the user is redirected to a dedicated `/forbidden` page, indicating insufficient permissions for a specific resource while remaining authenticated.
-   **Rationale for `localStorage`**: Chosen for simplicity and ease of use in a prototype. For production, HTTP-only cookies are generally preferred for enhanced security against XSS attacks.

### 6.5. Protected Routes & Layouts

Next.js App Router's layouts are leveraged to enforce authentication and authorization globally.

-   **`frontend/app/(protected)/layout.js`**:
    -   This higher-order layout wraps all protected routes.
    -   It uses `useAuth` to check `isAuthenticated` and `isLoading`.
    -   While loading, it displays a skeletal loading indicator.
    -   If the user is not authenticated after loading, they are redirected to `/login`.
    -   This layout ensures that no protected content is rendered until authentication status is confirmed.
-   **`frontend/app/(auth)/login/page.jsx`**:
    -   The login page uses the `useLogin` mutation to handle user authentication.
    -   Upon successful login, `useAuth` automatically detects the new authenticated state and redirects the user to their appropriate role-based dashboard.
-   **`frontend/app/(protected)/[role]/layout.js`**:
    -   This layout handles role-specific authorization for routes (e.g., `/admin`, `/manager`).
    -   It receives the `role` from the URL parameters (`params.role`).
    -   It uses `useAuth` to get the `user`'s roles and `usePermissions` (`doesUserHaveRole`) to verify if the authenticated user possesses the role specified in the URL.
    -   If the user does not have the required role, they are redirected to their primary dashboard or `/unauthorized`.
-   **Rationale**: Layout-based protection ensures a robust and centralized authorization flow, preventing UI flashes and duplicated authentication/authorization checks across individual pages.

### 6.6. Authorization & Permission Checks

Frontend permissions are data-driven, ensuring consistency with the backend.

-   **`frontend/utils/permissions.js`**: Contains utility functions:
    -   `userHasRole(userRoles, role)`: Checks if a user's roles array includes a specific role.
    -   `hasPermission(userRoles, requiredPermission)`: A placeholder function. **Current Limitation**: As the backend `getMe` API currently only returns an array of `roles` and not a granular list of `permissions` (e.g., `users:create`), this frontend function currently provides simplified logic (e.g., 'admin' role grants all permissions). For true granular permission checks, the backend `getMe` response would need to be extended to include an explicit list of permissions or a detailed role-to-permission map.
-   **`frontend/hooks/usePermissions.js`**: A hook that leverages `useAuth` to provide access to `canUserAccess(permission)` and `doesUserHaveRole(role)` functions, simplifying permission checks in UI components.
-   **UI Rules**: Buttons or UI elements for which a user lacks permission should be hidden. Access to routes is blocked based on role/permission checks in layouts.
-   **Rationale**: Prevents hardcoding of roles/permissions on the frontend, making the system more flexible and maintainable. The backend remains the ultimate source of truth for authorization.

### 6.7. Reusable Hooks & Utilities

The frontend adheres to DRY and SRP principles through a set of reusable hooks and utilities.

-   `frontend/lib/api.js`: Centralized Axios instance.
-   `frontend/features/*/api.js`: Feature-specific API clients.
-   `frontend/features/*/hooks.js`: Feature-specific TanStack Query hooks.
-   `frontend/hooks/useAuth.js`: Authentication state management.
-   `frontend/utils/permissions.js`: Permission checking utilities.
-   `frontend/hooks/usePermissions.js`: Permission checking hook.
-   **Rationale**: Promotes code reusability, clear separation of concerns, and simplifies development.

### 6.8. UI Integration (shadcn/ui)

-   **Components**: Existing `shadcn/ui` components are used for building the user interface, maintaining a consistent design system.
-   **`frontend/components/AnimatedBackground.jsx`**: Extracted into its own component for reusability and cleaner code.
-   **Rationale**: Leverages a robust UI library for accessible and aesthetically pleasing components, reducing development time.

### 6.9. Error Handling & UX

-   **Global Toaster (`frontend/app/Provider/ToasterProvider.js`)**: Provides consistent, rich toast notifications for user feedback.
-   **API Interceptor Error Handling**: Catches `401` and `403` errors, triggering appropriate redirects (`/login` for 401, `/forbidden` for 403).
-   **TanStack Query Error Handling**: `onError` callbacks in mutations and queries are used to display toast notifications for API failures.
-   **Dedicated Error Pages**: `frontend/app/unauthorized.jsx` (for 401) and `frontend/app/forbidden.jsx` (for 403) provide clear feedback to the user when access is denied.
-   **No Infinite Redirects**: Carefully managed redirect logic in `useAuth` and layouts prevents redirect loops.
-   **Rationale**: Ensures a smooth and informative user experience even during errors, preventing confusion and guiding users to resolve issues.
