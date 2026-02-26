# Supermarket Management System: Engineering Manual & Architectural Blueprint

This document is the definitive technical reference for the **Supermarket Management System**. It provides a deep-dive into the system's architecture, data models, algorithmic logic, and engineering standards. It is intended for developers, system architects, and maintainers.

---

## 1. High-Level System Architecture

The application follows a **Decoupled Monolith** architecture, utilizing a robust RESTful API (Node.js/Express) and a modern, reactive frontend (Next.js 15).

### 1.1. The API-First Philosophy
-   **Statelessness**: The backend maintains no session state; all authentication is handled via JWT (JSON Web Tokens) passed in the `Authorization` header.
-   **Standardized Responses**: Every API endpoint returns a consistent JSON envelope:
    ```json
    {
      "success": true,
      "message": "Action completed",
      "data": { ... },
      "stats": { ... } // Optional metadata for dashboards
    }
    ```
-   **CORS & Security**: Implements `helmet` for HTTP header security and strict CORS policies to allow only authorized frontend origins.
-   **Local Asset Storage**: Static assets (Brand Logos, Product Images) are stored locally in `backend/uploads/{module_name}` and served via Express static middleware. This ensures data sovereignty, speed, and privacy.

### 1.2. The Multi-Tier Inventory Model
We distinguish between "Virtual Catalog" and "Physical Availability," now with granular location tracking.
1.  **Product Model**: The source of truth for metadata (Category, Name, `unit`, `storageRequirement`, `taxRate`).
2.  **Brand Model**: Architectural node for product classification. Features atomic `BRD-[BASE36]` codes and local logo storage.
3.  **Variant Model (Nested)**: The level where physical attributes (Size, Color, Material), `minStockLevel`, `maxStockLevel`, and **Warehouse Stock** reside.
4.  **BranchLocation Model**: Defines specific physical areas *within* a branch (e.g., Aisle, Shelf, Backroom), including `capacity` and `currentOccupancy`. Enables location-based storage rules.
5.  **BranchStockLocation Model**: Tracks the *exact quantity* of a product variant at a specific `BranchLocation`. This is the granular source of truth for physical stock placement.
6.  **BranchStock Model**: A flat junction table mapping `BranchID + ProductID + VariantID` to an *aggregated total `quantity`*. This model now serves as a high-performance summary/cache, automatically synchronized by `BranchStockLocation` post-save/remove hooks, allowing for O(1) lookups during checkout and reports without complex aggregations.

---

## 2. Database Layer & Data Integrity

### 2.1. Simulated Transactions (Sequential Guard Pattern)
MongoDB standalone instances do not support ACID transactions. To prevent "Ghost Stock" or "Double Spending," we use the **Sequential Guard Pattern**, now enhanced to operate on granular stock locations:

| Step | Action | Logic |
| :--- | :--- | :--- |
| **1. Pre-flight** | Validation | Check `BranchStock.quantity >= requestedQty` (for a quick overall check) AND ensure sufficient `BranchStockLocation` quantities are available in suitable locations. |
| **2. Lock** | Deduction | Deduct `quantity` from specific `BranchStockLocation` entries (e.g., prioritizing sales floor, FIFO). `BranchStock` is then automatically updated via `BranchStockLocation` hooks. |
| **3. Propagation**| Increment | If Exchange, increment new item's stock into the branch's default backroom `BranchStockLocation`. |
| **4. Persistence**| Logging | Create `Sale` or `SaleReturn` record. |
| **5. Cleanup** | Error Handle | If any step fails after Step 2, a manual compensation (rollback) logic is triggered. |

### 2.2. Atomic ID Generation (The Base-36 Engine)
To generate unique, human-readable, and scalable transaction IDs, we avoid sequential integers which leak business volume data to competitors.

**The Algorithm:**
1.  **Namespace**: Tracked per day (e.g., `sales-20260213`) or per entity (e.g., `brand_code`).
2.  **Increment**: `Counter.findOneAndUpdate(..., { $inc: { seq: 1 } })`.
3.  **Encoding**: Convert `seq` to Base-36 string.
    -   *Example*: Sequence `1234` becomes `00YA`.
    -   *Example*: Sequence `1,679,615` becomes `ZZZZ`.
4.  **Formatting**: `[PREFIX]-[YYYYMMDD]-[BASE36_SEQ]`
    -   *Result*: `SALE-20260213-0F9X`
    -   *Brand Result*: `BRD-0A1`

---

## 3. Search & Filtering Engines

The system employs multiple search strategies optimized for specific use cases (high-volume SKU search vs. human-readable entity search).

### 3.1. POS Product Search (High-Frequency)
When a user types "Blue Nike Shoe," the backend tokenizes the string into `['blue', 'nike', 'shoe']`. It then constructs a MongoDB query using **Positive Lookaheads**:
```javascript
const regex = new RegExp(tokens.map(t => `(?=.*${t})`).join(''), 'i');
// Matches any string containing all three words in any order.
```
This is significantly faster than standard `OR` queries. If the Regex returns `[]`, **Fuse.js** performs bitap-based fuzzy matching locally.

### 3.2. Terminal Report Smart-Search (Admin & Audit)
To enable efficient auditing of staff performance:
-   **Field Tokenization**: Search queries for "User Name" and "Branch Name" are tokenized (split by whitespace) and applied via Regex to matched fields (e.g., `user.firstName`, `user.lastName`, `branch.branch_name`).
-   **Debounce Strategy**: Frontend inputs use a **500ms debounce** via `useDebounce` hook to prevent API thrashing during typing.
-   **Role-Based Filters**: 
    -   **Admins**: Can search by `branchName` across the entire network.
    -   **Staff**: Restricted to their assigned `branch`; the branch search input is hidden.

### 3.3. Barcode Auto-Add Mechanics
The frontend listens to input changes. If `results.length === 1` AND `input === results[0].sku`, the system assumes a barcode scanner input. It bypasses the UI selection and adds the item to the cart instantly, clearing the buffer for the next scan.

---

## 4. Post-Sale Lifecycle (Returns & Exchanges)

### 4.1. The Immutability Principle
Original `Sale` records are **never** modified. This ensures that historical financial reports remain accurate. All modifications are tracked via the `SaleReturn` model.

### 4.2. "Remaining Quantity" Calculation Logic
To prevent fraudulent returns, the system must know exactly how many units of a specific item are still "returnable."
**Backend Aggregation:**
1.  Find the `OriginalSale.item`.
2.  Query `SaleReturn` for all records where `originalSaleId === id`.
3.  Sum `returnedItems.quantity` for that `variantId`.
4.  `remainingQty = originalQty - totalReturned`.
*This calculation is performed server-side on every return-eligibility request.*

---

## 5. Frontend Architecture & State

### 5.1. Reactive Synchronization (TanStack Query)
We use a **Stale-While-Revalidate (SWR)** pattern.
-   **Key Factory**: `['branch-stock', branchId, search]`
-   **Invalidation**: When a sale is completed, we call `queryClient.invalidateQueries({ queryKey: ['branch-stock'] })`. This triggers a background refetch, updating the UI instantly without a spinner or page reload.

### 5.2. Thermal Printing (CSS-in-JS)
The `ReceiptPrint` components use specific `@media print` CSS:
-   **Width**: Fixed at `80mm` (standard thermal roll).
-   **Font**: Monospace for alignment.
-   **Scaling**: `zoom: 0.9` to ensure no overflow on 58mm printers.
-   **Logic**: Uses `react-to-print`. The component is rendered in a hidden `div` with `display: none`, then cloned into an iframe for printing to avoid UI flicker.
-   **Customer Profiles**: Updated print slips now include dynamic customer profiles, ensuring customer information is present on transaction records.

### 5.3. POS Customer & Terminal Management
The Point-of-Sale (POS) system now features advanced customer and terminal management capabilities, deeply integrated into the frontend workflow.
-   **Dynamic Customer Search & Selection**: Real-time search and selection of existing customers within the POS interface.
-   **On-the-Fly Customer Registration**: Ability to register new customers directly from the POS, with built-in duplicate prevention (e.g., unique phone numbers and emails).
-   **Terminal & Branch Session Handling**:
    *   `handleBranchChange`: Manages changes to the active branch, resetting cart, customer, discounts, and search states to ensure data integrity across branch contexts.
    *   `openSession` and `closeSession` functions (via `useTerminalHook`): Provide robust management of cashier shifts, ensuring secure and auditable session boundaries.

---

## 6. Security & Access Control

### 6.1. Hierarchical Permission System (HPS)
The system uses a granular, three-tiered permission string format: `module:menu:action`.
*   **Format**: `[module_slug]:[menu_slug]:[action]`
*   **Example**: `inventory_management:product_database:create`
*   **Actions**: Standardized as `create`, `read`, `update`, `delete`.

### 6.2. Backend-Driven Sidebar (BDS)
To ensure UI integrity and minimize maintenance, the sidebar is dynamically generated from the user's authorized modules.
1.  **Source of Truth**: The backend `availableModules` utility groups flat permissions into a nested `Module -> Menus` hierarchy during the login/auth phase.
2.  **Frontend Mapping**: The `DynamicSidebar` component iterates through this hierarchy and uses `MENU_METADATA` (in `frontend/constants/sidebarRoutes.js`) to resolve slugs into icons and internal paths.
3.  **Automatic Synchronization**: Adding a menu in the `SYSTEM_HIERARCHY` on the backend automatically populates the frontend sidebar once a path is mapped in metadata.

### 6.3. Data Isolation (Branch Locking)
Multi-tenancy is enforced at the query level via centralized `branchAuth` middleware.
```javascript
// Centralized Middleware Logic
if (req.user && req.user.role !== 'admin') {
    req.query.branch = req.user.branch;
}
```
This ensures that a cashier at Branch A can never see or modify the sales, terminals, or staff of Branch B. All entities requiring isolation (User, Sale, Terminal, SaleReturn) now standardize on the `branch` field.

### 6.4. Stateless Auth with Stateful Permissions (JWT Strategy)
To optimize performance and ensure real-time security, the system employs a "Hybrid Token" strategy.
-   **Lightweight JWT**: The JSON Web Token contains only the essential identification markers: `userId` and `role`. It **excludes** permissions and `availableModules`.
-   **Why Exclude Permissions from Token?**:
    1.  **Instant Revocation**: If an administrator changes an employee's permissions, the change takes effect on their *next* API request. If permissions were in the token, the user would retain old access until they logged out.
    2.  **Payload Efficiency**: Storing structured module trees in a JWT significantly increases header size, slowing down every network request.
-   **The Rehydration Pattern**: The `auth` middleware fetches the user from the database and recalculates `availableModules` (via `getModulesFromPermissions`) for every request, injecting the fresh data into `req.user`.

---

## 7. Operational Standards & Directory Structure

-   `backend/config/permissions.js`: Central definition of `SYSTEM_HIERARCHY`.
-   `backend/utils/getModules.js`: Logic for grouping flat permissions into nested modules.
-   `frontend/app/[role]/inventory/`: Sub-pages for Brands, Categories, Products, Stock, and Suppliers.
-   `frontend/app/[role]/pos/`: Sub-pages for Sales and Returns.
-   `frontend/app/[role]/employees/`: Comprehensive staff management module.
-   `frontend/app/[role]/settings/`: Global system configuration and branch settings.
-   `frontend/components/shared-components/`: Reusable business UI, now organized modularly (e.g., `/inventory`, `/pos`, `/employees`, `/settings`).
-   `frontend/components/ui/`: Atomic, design-system components (Shadcn).

---

## 8. Development Roadmap

### ✅ Phase 1-6: Core & Management (Completed)
-   [x] Multi-variant Product Engine with price tracking and granular thresholds.
-   [x] Granular inventory tracking with physical `BranchLocation` and `BranchStockLocation` models.
-   [x] Sequential Inter-branch and **Internal** stock transfers.
-   [x] Hybrid Search POS with Barcode integration.
-   [x] Atomic Base-36 Return & Exchange system, integrated with granular stock adjustments.
-   [x] Unified Thermal Printing Engine.
-   [x] Brand Module with Local Asset Management & Base-36 Codes.
-   [x] **Granular Hierarchical Permission System (`module:menu:action`)**.
-   [x] **Modular Directory Refactoring** (Inventory, POS, Employees).
-   [x] **Backend-Driven Dynamic Sidebar**.
-   [x] **Discount & Promotion Module**: Coupon code management and automated discounts.
-   [x] **Customer Management Module**: Advanced CRM and customer history.
-   [x] **System Settings Engine**: Branch-specific configurations and metadata.
-   [x] **SupplierForm UI/UX**: Conditional "Live Node Preview" display and dynamic layout adjustment when used as a modal.
-   [x] **ProductForm UI/UX**: Relocated "Previous" and "Save/Update Product" buttons to the main form component for improved user experience.
-   [x] **User/Employee Management**: Resolved missing 'pin' field in edit mode/detail view by explicitly selecting it in the backend query.
-   [x] **User/Employee Detail Page UI/UX**: Applied comprehensive V2 aesthetic standards (typography, spacing, colors, component recipes) and fixed `React is not defined` error by adding explicit React import.
-   [x] **POS: Implemented granular financial tracking for sales and returns.**
-   [x] **POS: Enhanced customer search, selection, and on-the-fly registration with duplicate prevention.**
-   [x] **POS: Developed comprehensive Discount and Promotion Module with user-specific caps and customer group targeting.**
-   [x] **POS: Integrated Terminal and Branch Management functionalities (shift/session handling).**
-   [x] **POS: Updated thermal print slips to include dynamic customer profiles.**
-   [x] **System-wide: Standardized `branch_id` naming to `branch` across all models, controllers, and frontend hooks for absolute consistency.**
-   [x] **Architecture: Enhanced `branchAuth` middleware to provide robust, multi-method branch isolation for non-admin users.**

### 🚀 Phase 7: Advanced Intelligence (Next)
-   **Dynamic Dashboards**: Real-time sales vs. target tracking.
-   **Profit/Loss Engine**: Automated margin analysis (Selling Price - Buying Price).
-   **EOD Automated Email**: Summarized end-of-day reports for branch owners.
-   **Inventory Forecasting**: AI-driven stock level predictions based on historical trends.

---

## 10. Modern High-Performance GUI Standards (POS V2)

The system adopts a specific "Information Density without Clutter" design philosophy, perfected in the POS redesign.

### 10.1. Layout Hierarchy
-   **Primary Workspace (Left 70-75%)**: Reserved for high-volume data review (e.g., Active Billing Table). This area uses clean, high-density tables with subtle borders.
-   **Action Sidebar (Right 25-30%)**: Reserved for status summaries and flow-control buttons. Actions are grouped logically: Input (Customer) -> Choice (Payment) -> Summary (Totals) -> Execution (Save/Print).
-   **Universal Input (Top Header)**: Features a combined context selector (Branch) and a global command/search input.

### 10.2. The "Floating Dropdown Table" Pattern
To maximize screen real estate, search results are never rendered as permanent cards.
-   **Implementation**: A `motion.div` popover triggered by search input focus.
-   **Format**: A mini-table within the popover.
-   **Required Columns**: Product Detail (with SKU), Location (MapPin icon), Stock Qty (Color-coded), and Price.
-   **Interaction**: Auto-add on single match or SKU barcode match; manual click to add.

### 10.3. Visual Style & Typography
-   **Weight Softening**: Prefer `font-medium` for readability and `font-semibold` for emphasis. Avoid `font-black` or excessive `font-bold` to prevent visual fatigue.
-   **Micro-Labels**: Use `text-[10px] font-semibold uppercase tracking-widest` for secondary metadata headers (e.g., "Terminal Location").
-   **High-Contrast "Hero Cards"**: Use dark slate/black backgrounds (`bg-slate-900`) for final checkout balances or critical KPIs to provide immediate focus.
-   **Radius & Softness**: Standardize on `rounded-xl` (12px) for main cards/inputs and `rounded-2xl` (16px) for major "Hero" sections.

### 10.4. Interactive Feedback (Framer Motion)
-   **Layout Animations**: Use `layout` prop on table rows for smooth sorting/deleting transitions.
-   **Entry/Exit**: `AnimatePresence` for search results and notification badges.
-   **Haptics**: Subtle `whileTap={{ scale: 0.98 }}` on buttons to simulate physical interaction.
-   **Status Indicators**: Use animated pulses (e.g., "Live Sync Active") to indicate real-time connectivity without static text.

---

## 11. Design System & UI Style Guide (V2 Aesthetic)

This guide defines the exact CSS/Tailwind standards for updating and maintaining the "V2 Aesthetic" across the application.

### 11.1. Typography Scale
| Style | Tailwind Classes | Usage |
| :--- | :--- | :--- |
| **Hero Total** | `text-3xl font-semibold tabular-nums tracking-tight` | Final totals, critical KPIs. |
| **Page Title** | `text-lg font-semibold text-slate-700` | Section headers, card titles. |
| **Table Body** | `text-[13px] font-medium text-slate-600` | Product names, list items. |
| **Micro Data** | `text-[10px] font-semibold uppercase tracking-widest` | Labels, SKUs, category tags. |
| **Price/Qty** | `text-sm font-semibold tabular-nums` | Numerical data in tables. |

### 11.2. Spacing & Letter Heights
-   **Line Heights**: 
    -   Relaxed (`leading-relaxed`) for descriptive paragraphs.
    -   Tight (`leading-tight`) for table headers and product titles.
    -   None (`leading-none`) for micro-labels and hero numbers.
-   **Letter Spacing**:
    -   Standard for body text.
    -   `tracking-widest` (0.1em+) for all uppercase micro-labels.
    -   `tracking-tighter` (-0.05em) for high-impact numbers > 20px.

### 11.3. Color Palette & Surfaces
-   **Surface 1 (Base)**: `bg-slate-50/50` (The "lightest gray" for body background).
-   **Surface 2 (Card)**: `bg-white` with `shadow-sm` and `border-slate-100`.
-   **Surface 3 (Hover)**: `hover:bg-primary/[0.02]` or `hover:bg-slate-50`.
-   **Surface 4 (Hero)**: `bg-slate-900` (Use sparingly for contrast).
-   **Primary Accents**: 
    -   Icon Backgrounds: `bg-primary/10`.
    -   Soft Rings: `ring-primary/10`.

### 11.4. Component Recipes
-   **The V2 Input**: `h-11 rounded-xl bg-slate-50/50 border-slate-100 text-sm font-medium`.
-   **The V2 Button (Primary)**: `h-14 rounded-xl font-semibold uppercase tracking-widest shadow-xl shadow-primary/20`.
-   **The V2 Table Row**: `h-16 transition-colors border-b border-slate-100`.
-   **The V2 Icon Badge**: `p-1.5 rounded-lg bg-primary/10 text-primary`.

### 11.5. Visual Prohibitions
-   **NO** `font-black`.
-   **NO** `font-bold` on long sentences (use `font-semibold` instead).
-   **NO** `border-black` (use `border-slate-100` or `border-slate-200`).
-   **NO** Square corners (Minimum `rounded-lg`).
-   **NO** Standard HTML scrollbars (use `scrollbar-thin scrollbar-thumb-slate-200`).
