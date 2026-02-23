# Detailed Analysis: Granular Inventory Tracking System

## 1. Objective
To implement a high-precision inventory management system that tracks products from the central warehouse through branch-level stock and down to specific physical locations (Aisles, Shelves, Racks, etc.) within each branch.

## 2. Updated Implementation Roadmap (Step-by-Step)

### Phase 1: Product Metadata Enrichment
**Goal:** Prepare the product catalog with the intelligence required for automated storage and tax handling.
1.  **Modify `Product` Model**:
    *   Add `unit`: `[PIECE, KG, GRAM, LITER, ML, PACK, DOZEN]`.
    *   Add `storageRequirement`: `[AMBIENT, REFRIGERATED, FROZEN]`.
    *   Add `taxRate`: Default percentage for VAT calculation.
2.  **Modify `Variant` Schema (Nested)**:
    *   Add `minStockLevel`: Low-stock threshold per variant.
    *   Add `maxStockLevel`: Reorder ceiling per variant.
3.  **Update Validation**: Update `product.validation.js` to enforce these new fields.

### Phase 2: Physical Layout Mapping
**Goal:** Define the digital twin of the physical branch.
1.  **Create `BranchLocation` Model**:
    *   `branch`: Reference to Branch.
    *   `name`: e.g., "Aisle 1", "Fridge B".
    *   `type`: `[AISLE, RACK, SHELF, GONDOLA, REFRIGERATOR, FREEZER, BACKROOM]`.
    *   `capacity`: Max volume/quantity.
    *   `currentOccupancy`: Auto-calculated quantity currently in this spot.
2.  **Seeding**: Automatically create a "Default Backroom" for every existing branch to prevent system breakage.

### Phase 3: Granular Stock tracking
**Goal:** Shift from "Branch Total" to "Exact Position" tracking.
1.  **Create `BranchStockLocation` Model**:
    *   `branch`, `product`, `variantId`: Composite Key.
    *   `location`: Reference to `BranchLocation`.
    *   `quantity`: Number of items at this specific location.
    *   `isDisplayOnly`: Flag for non-sellable display items.
2.  **Synchronization Logic**: Implement a "Summary Sync" where updates to `BranchStockLocation` automatically reflect in the existing `BranchStock` table for backward compatibility with existing reports.

### Phase 4: Internal Logistics & Validation
**Goal:** Manage the movement of goods within the branch.
1.  **Internal Transfer Logic**: Update `StockTransfer` controller to handle `fromLocation` and `toLocation` as `BranchLocation` IDs within the same branch.
2.  **The "Storage Guard" Middleware**:
    *   Validate that `Product.storageRequirement` matches `BranchLocation.type`.
    *   Prevent moves if `Location.currentOccupancy + quantity > capacity`.

### Phase 5: POS Smart-Deduction
**Goal:** Ensure the POS pulls from the right shelf.
1.  **Deduction Strategy**:
    *   If a barcode specifies a location, deduct there.
    *   Otherwise, follow **FIFO (First-In-First-Out)** across locations.
    *   Priority: Deduct from Sales Floor (`SHELF/AISLE`) before the `BACKROOM`.
2.  **UI Feedback**: Show location hints in POS search (e.g., "5 available in Aisle 2").

### Phase 6: Management UI
**Goal:** Empower staff to manage the floor.
1.  **Branch Mapper**: Drag-and-drop or list interface to define branch locations.
2.  **Stock Placement Tool**: A mobile-optimized "Quick Move" interface for moving items from Backroom to Floor.

---

## 3. Data Integrity & Constraints (Sequential Guard Pattern)

| Step | Action | Logic |
| :--- | :--- | :--- |
| **1. Check** | Validate Storage | `StorageReq` vs `LocationType` match. |
| **2. Verify** | Capacity Check | `newQty + currentOccupancy <= capacity`. |
| **3. Move** | Atomic Update | Use `findOneAndUpdate` to decrement source and increment destination. |
| **4. Sync** | Summary Update | Update `BranchStock` total quantity. |

---

## 4. Pros & Cons of This Upgrade

### Pros
- **Waste Reduction**: Prevents spoiled goods by ensuring refrigerated items are tracked in fridges.
- **Audit Precision**: Know exactly where every cent of inventory is sitting.
- **Automated Reordering**: `min/max` levels at the variant level allow for smart procurement.

### Cons
- **Operational Overhead**: Staff must log internal moves (Backroom -> Shelf).
- **Data Complexity**: Increases the number of records in the stock junction tables.
