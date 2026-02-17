# Staff Management Module - System Specification

## 1. Module Overview
The Staff Management module is a core security, administrative, and operational component of the Supermarket Management System. It handles the complete lifecycle of employees, distinguishing between **System Users** (who operate the software) and **General Staff** (who perform physical tasks but do not access the system).

## 2. Core Features (Detailed)

### 2.1. Employee Database (Menu 4.1)
The database now supports two distinct categories of employees:

#### A. System Users (e.g., Cashiers, Managers, Admins)
- **Access**: Have login credentials (Email/Username + Password).
- **Function**: Operate POS, manage inventory, view reports.
- **Security**:
    - **2FA**: `isTwoFactorEnabled` flag (Boolean). *Note: Currently a database toggle only; OTP logic to be implemented later.*
    - **Password**: Required, hashed.

#### B. General Staff (e.g., Helpers, Stockers, Cleaners)
- **Access**: **No login access**. No password required.
- **Function**: Tracked for HR, Payroll, and Rostering purposes.
- **Role**: `general_staff`.
- **Data**: Minimal profile (Name, Phone, Employee ID). **Email is optional**.
- **Attendance**: Uses a **PIN Code** for Time Clock.

### 2.2. Scheduling & Attendance
- **Shift Management**: Managers can assign shifts to both System Users and General Staff.
- **Time Clock**:
    - **System Users**: Clock in via dashboard.
    - **General Staff**: Clock in via PIN/Badge at a shared terminal.

### 2.3. Payroll Integration
- Tracks hours and commissions for *all* employees regardless of system access.

### 2.4. Performance Management
- **System Users**: Metrics based on sales/scans.
- **General Staff**: Qualitative reviews and task completion (manual entry by Manager).

## 3. Data Model (Enhanced)
The `User` model will be updated to accommodate the hybrid structure:

- `userId`: Atomic, unique identifier (Base-36).
- `hasSystemAccess`: **Boolean** (Default: `false`). Determines if the user can log in.
    - `true`: Requires `email` and `password`.
    - `false`: `password` is undefined/null. `email` is optional.
- `firstName`, `lastName`: Required for all.
- `role`:
    - System Roles: `admin`, `manager`, `cashier`, `supervisor`.
    - Non-System Role: `general_staff`.
- `isTwoFactorEnabled`: **Boolean** (Default: `false`). Status of 2FA.
- `contact`:
    - `email`: Unique **Sparse** Index (allows multiple users with no email).
    - `phone`: Primary contact method for General Staff.
- `security`:
    - `password`: Hashed (Required only if `hasSystemAccess` is true).
    - `pin`: Hashed/Encrypted (Required for all staff for Time Clock).
    - `permissions`: Array (Empty for General Staff).
- `branch_id`: Required linkage.

## 4. Permission Architecture
- **Manager Authority**: Only users with the `manager` or `admin` role (and `employee:create` permission) can create or modify user accounts.
- **Default Permissions**:
    - **System Users**: Inherit defaults based on role (e.g., Cashier gets POS access).
    - **General Staff**: No permissions (`[]`).

## 5. Security & Multi-Tenancy
- **Admin Bypass**: Full system access for the `admin` role.
- **Branch Locking**: Employees are bound to their `branch_id`.
- **2FA Implementation**:
    - Current Phase: Database schema support only (`isTwoFactorEnabled`).
    - Logic: Manager toggles this for high-security accounts (e.g., Supervisors).

## 6. Implementation Directory Reference
- **Backend**: `backend/controllers/userController.js` (Needs validation update), `backend/models/User.js`.
- **Frontend**: `StaffForm.jsx` (Needs UI toggle for "System Access", conditional Password field, and PIN field).

## 7. Operational Standards
- **Creation Workflow**: Managers create all users. Self-registration is disabled.
- **Atomic IDs**: Human-readable Base-36 IDs for all staff.
- **Soft Deletion**: `isDeleted` flag used for archival.
