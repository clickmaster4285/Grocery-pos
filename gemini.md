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

### 1.2. The Multi-Tier Inventory Model
We distinguish between "Virtual Catalog" and "Physical Availability."
1.  **Product Model**: The source of truth for metadata (Brand, Category, Name).
2.  **Variant Model (Nested)**: The level where physical attributes (Size, Color, Material) and **Warehouse Stock** reside.
3.  **BranchStock Model**: A flat junction table mapping `BranchID + ProductID + VariantID` to a specific `quantity`. This allows for O(1) lookups during checkout.

---

## 2. Database Layer & Data Integrity

### 2.1. Simulated Transactions (Sequential Guard Pattern)
MongoDB standalone instances do not support ACID transactions. To prevent "Ghost Stock" or "Double Spending," we use the **Sequential Guard Pattern**:

| Step | Action | Logic |
| :--- | :--- | :--- |
| **1. Pre-flight** | Validation | Check `BranchStock.quantity >= requestedQty`. |
| **2. Lock** | Deduction | `findOneAndUpdate` with `$inc: { quantity: -requestedQty }`. |
| **3. Propagation**| Increment | If Exchange, increment new item's stock. |
| **4. Persistence**| Logging | Create `Sale` or `SaleReturn` record. |
| **5. Cleanup** | Error Handle | If any step fails after Step 2, a manual compensation (rollback) logic is triggered. |

### 2.2. Atomic ID Generation (The Base-36 Engine)
To generate unique, human-readable, and scalable transaction IDs, we avoid sequential integers which leak business volume data to competitors.

**The Algorithm:**
1.  **Namespace**: Tracked per day (e.g., `sales-20260213`).
2.  **Increment**: `Counter.findOneAndUpdate(..., { $inc: { seq: 1 } })`.
3.  **Encoding**: Convert `seq` to Base-36 string.
    -   *Example*: Sequence `1234` becomes `00YA`.
    -   *Example*: Sequence `1,679,615` becomes `ZZZZ`.
4.  **Formatting**: `[PREFIX]-[YYYYMMDD]-[BASE36_SEQ]`
    -   *Result*: `SALE-20260213-0F9X`

---

## 3. The POS Smart-Search Engine

The POS search must handle thousands of SKUs with sub-50ms latency.

### 3.1. Tier 1: Multi-Token Regex Lookahead
When a user types "Blue Nike Shoe," the backend tokenizes the string into `['blue', 'nike', 'shoe']`. It then constructs a MongoDB query using **Positive Lookaheads**:
```javascript
const regex = new RegExp(tokens.map(t => `(?=.*${t})`).join(''), 'i');
// Matches any string containing all three words in any order.
```
This is significantly faster than standard `OR` queries and provides a "Google-like" search experience.

### 3.2. Tier 2: Fuse.js Fuzzy Logic
If the Regex returns `[]` (zero results), the system assumes a typo. It fetches the branch's local SKU list (cached on the server) and uses **Fuse.js** to perform bitap-based fuzzy matching. This allows "Shrt" to find "Shirt."

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

---

## 6. Security Protocol

### 6.1. Role-Based Access Control (RBAC)
Permissions are stored as an array of strings in the User model (e.g., `["products:create", "sales:read"]`).
-   **Backend Middleware**: `checkPermission('sales:create')` verifies the JWT payload before executing the controller.
-   **Frontend HOC**: `usePermissions()` hook hides/shows UI elements based on the same payload.

### 6.2. Data Isolation (Branch Locking)
Multi-tenancy is enforced at the query level.
```javascript
// Example Middleware Logic
if (!req.user.isAdmin) {
    req.query.branch = req.user.branch_id;
}
```
This ensures that a cashier at Branch A can never see or modify the sales or stock of Branch B.

---

## 7. Operational Standards & Directory Structure

-   `backend/controllers/`: Business logic and orchestration.
-   `backend/models/`: Schema definitions and atomic hooks.
-   `frontend/features/`: Data fetching hooks and API abstractions.
-   `frontend/components/shared-components/`: Reusable, complex business UI (POS, History).
-   `frontend/components/ui/`: Atomic, design-system components (Shadcn).

---

## 8. Development Roadmap

### ✅ Phase 1-5: The Core (Completed)
-   [x] Multi-variant Product Engine with price tracking.
-   [x] Sequential Inter-branch stock transfers.
-   [x] Hybrid Search POS with Barcode integration.
-   [x] Atomic Base-36 Return & Exchange system.
-   [x] Unified Thermal Printing Engine.
-   [] we have to add customer management module also.
-   [] we have to add discount & promotion & copoon code management module also.

### 🚀 Phase 6: Management & Intelligence (Next)
-   **Dynamic Dashboards**: Real-time sales vs. target tracking.
-   **Profit/Loss Engine**: Automated margin analysis (Selling Price - Buying Price).
-   **Loss Audit Trail**: Detailed reporting on "Damaged" vs "Expired" returns.
-   **EOD Automated Email**: Summarized end-of-day reports for branch owners.
