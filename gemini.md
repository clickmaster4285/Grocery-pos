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
