# Gemini Technical Assistant & Project Documentation

This document serves as the living technical memory, architectural overview, and decision log for the **Supermarket Management System** project. It is maintained by the Gemini technical assistant.

## 1. Project Overview & Architecture

The Supermarket Management System is a robust, full-stack application designed for high-concurrency retail environments with multiple physical locations. It utilizes a decoupled, API-first architecture.

### 1.1. Core Architectural Principles
-   **Decoupled Frontend/Backend**: Next.js (App Router) for the UI and Node.js/Express for the RESTful API.
-   **Data-State Separation**: Inventory is split between current availability (`BranchStock`) and transaction history (`StockTransfer`).
-   **Permission-Driven Security**: Fine-grained access control using a `module:action` string convention.
-   **Fail-Safe Operations**: Use of sequential logic for stock updates to ensure consistency in standalone MongoDB environments where transactions are unavailable.

## 2. Technical Stack

### Backend (The Core)
-   **Runtime**: Node.js (`v18+` recommended)
-   **Framework**: Express.js
-   **Database**: MongoDB with Mongoose ODM
-   **Search**: Hybrid system using Native MongoDB Regex and Fuse.js for in-memory fuzzy matching.
-   **Auth**: JWT (JSON Web Tokens) with a 24h expiration.
-   **Security**: `bcryptjs` for one-way password hashing and `helmet` for HTTP header security.

### Frontend (The Interface)
-   **Framework**: Next.js (App Router), React 19
-   **Styling**: Tailwind CSS 4 with `shadcn/ui` components for a professional, accessible UI.
-   **State Management**: TanStack Query (React Query) for server-state caching and synchronization.
-   **Icons**: Lucide-react.
-   **Notifications**: Sonner (Toast system).

## 3. Inventory & Stock Management Logic

### 3.1. The Warehouse vs. Branch Model
The system operates on a "Central Warehouse" philosophy:
1.  **Central Stock**: Stored directly in the `Product.variants[].stock` field. This represents the total warehouse or global supply.
2.  **Branch Stock**: Tracked in the `BranchStock` model. This represents inventory physically present at a specific store.

### 3.2. Sequential Stock Update Flow
Since the project uses a standalone MongoDB instance, transactions are disabled. To maintain integrity, stock movements follow a strict sequential check-then-update pattern:
1.  **Validation**: Check if the source (Warehouse or Branch) has sufficient quantity.
2.  **Deduction**: Decrement the source stock.
3.  **Increment**: Increment the destination stock.
4.  **Logging**: Create a `StockTransfer` record to document the movement.

### 3.3. Key Models
-   **Product**: Contains metadata (name, category, brand) and an array of `variants`. Each variant has its own SKU, price history, and warehouse stock.
-   **BranchStock**: A junction model linking `Branch`, `Product`, and `VariantId`. It contains the current `quantity`.
-   **StockTransfer**: A permanent log of movements including `fromLocation`, `toLocation`, `items`, and the `performedBy` user ID.

## 4. Professional POS (Point of Sale) Terminal

The POS is the most performance-critical module, optimized for fast checkout and accurate inventory synchronization.

### 4.1. The Hybrid Search Engine
To provide a Google-like search experience while maintaining speed:
-   **Tier 1: Smart Regex**: The backend tokenizes input (e.g., "blue shirt" $\rightarrow$ `shirt blue`). It uses positive lookaheads in regex to find products containing all terms regardless of order. This is highly efficient as it runs on the database index.
-   **Tier 2: Fuse.js Fallback**: If Regex returns 0 results, the system assumes a typo (e.g., "shrt"). It fetches branch inventory and performs an in-memory fuzzy search using Fuse.js, ranking results by Levenshtein distance.

### 4.2. Barcode & Scanner Integration
-   **Auto-Add Logic**: The `POS.jsx` component monitors search results. If a search query (from a barcode scanner) returns exactly **one** match AND that match's SKU/Barcode is an exact string match, the system adds it to the cart immediately and clears the input.
-   **Performance**: Debouncing (300ms) ensures the UI stays responsive while typing, but the auto-add logic triggers instantly on exact matches to support rapid scanning.

## 5. Security & Authorization

### 5.1. RBAC (Role-Based Access Control)
-   **Convention**: Permissions are strings like `products:create`, `sales:read`, `users:delete`.
-   **Enforcement**: The `checkPermission(perm)` middleware verifies the presence of the required string in the `req.user.permissions` array.
-   **User Update Security**: The `updateUser` controller prevents non-admins from assigning the 'admin' role or editing other admin profiles.

### 5.2. Data Isolation
-   **Branch Locking**: Non-admin users are automatically filtered by their `branch_id`.
    -   In `getAllSales`, the query is automatically extended with `{ branch: req.user.branch_id }`.
    -   In the POS, the `activeBranchId` is initialized and locked to the user's branch.
-   **Admin Override**: Users with the `admin` role bypass branch locking, allowing them to view global analytics and manage inventory for any location.

## 6. Development & Coding Conventions

### 6.1. Backend
-   **Populate Policy**: Always populate `variants` when querying stock or sales to avoid "undefined" errors on the frontend SKU/Price fields.
-   **Password Handling**: Never save passwords without hashing. The `updateUser` controller must explicitly handle the `password` field to re-hash it if changed.
-   **Error Handling**: Use the centralized `errorHandler` middleware to ensure consistent JSON error responses across all endpoints.

### 6.2. Frontend
-   **React Query Keys**: Use structured keys like `['branch-stock', branchId, searchQuery]` to ensure efficient cache invalidation.
-   **UI Consistency**: Use `shadcn` components directly. Custom CSS should be avoided in favor of Tailwind utility classes.
-   **Async Safety**: Always use optional chaining (`?.`) when accessing nested properties from API data (e.g., `item.product?.productName`).

## 7. Operational Flows

### 7.1. The Sales Process
1.  User searches for item (Regex/Fuzzy).
2.  Item added to Cart (State managed in `cart` array).
3.  Checkout triggered:
    -   Backend validates branch stock for every item.
    -   Backend generates unique Bill Number (`SALE-YYYYMMDD-XXXX`).
    -   Backend deducts quantities from `BranchStock`.
    -   Backend creates `Sale` record.
4.  Frontend invalidates `branch-stock` and `sales` queries to refresh UI.

## 8. Current Roadmap

-   [x] **Phase 1: Core Infrastructure**: Auth, Users, Branches, Permissions.
- [x] **Phase 2: Product Engine**: Multi-variant support, Barcode generation, Image uploads, and Smart Inventory Dashboard.
- [x] **Phase 3: Inventory 2.0**: Warehouse vs. Branch tracking, Stock transfers, and Search-optimized catalog.
- [x] **Phase 4: Smart POS**: Hybrid search, Barcode auto-add, Branch isolation, and Thermal Receipt Printing.
- [ ] **Phase 5: Customer Experience**: Refund processing, Customer loyalty points, and Multi-language support.
- [ ] **Phase 6: Management Insight**: Sales dashboards, Low-stock alerts, and Profit/Loss reporting.

