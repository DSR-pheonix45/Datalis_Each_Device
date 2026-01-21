# Credit System Documentation

> **Last Updated:** December 1, 2025

## Overview

The Dabby credit system manages user credits that are consumed when performing various actions on the platform. It tracks credit balances, logs credit events for auditing, and defines costs for different actions.

---

## Database Schema

### 1. `credits` - Current User Balance

Stores the real-time credit balance for each user.

```sql
CREATE TABLE public.credits (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id),
    balance integer NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now()
);
```

| Column       | Type        | Description                              |
| ------------ | ----------- | ---------------------------------------- |
| `user_id`    | uuid        | Primary key, references `auth.users(id)` |
| `balance`    | integer     | Current credit balance (default: 0)      |
| `updated_at` | timestamptz | Last balance update timestamp            |

---

### 2. `credit_events` - Audit Log

Records every credit transaction for auditing and history.

```sql
CREATE TABLE public.credit_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id),
    amount integer NOT NULL,
    action text NOT NULL,
    created_at timestamptz DEFAULT now()
);
```

| Column       | Type        | Description                                      |
| ------------ | ----------- | ------------------------------------------------ |
| `id`         | uuid        | Unique event identifier                          |
| `user_id`    | uuid        | User who performed the action                    |
| `amount`     | integer     | Credits added (+) or deducted (-)                |
| `action`     | text        | Action type (e.g., `chat_message`, `create_kpi`) |
| `created_at` | timestamptz | When the event occurred                          |

---

### 3. `credit_costs` - Action Cost Configuration

Defines the credit cost for each platform action.

```sql
CREATE TABLE public.credit_costs (
    action text PRIMARY KEY,
    cost integer NOT NULL CHECK (cost > 0)
);
```

**Predefined Costs:**

| Action                                      | Database Cost | Frontend Cost |
| ------------------------------------------- | ------------- | ------------- |
| `chat_message` / `MESSAGE`                  | 1             | 1             |
| `create_workbench` / `WORKBENCH_CREATE`     | 2             | 3             |
| `create_kpi` / `KPI_CREATE`                 | 2             | 2             |
| `generate_report_basic` / `REPORT_GENERATE` | 5             | 5             |
| `generate_report_complex`                   | 15            | -             |
| `COMPANY_CREATE`                            | -             | 5             |

---

## Plan-Based Credit Allocation

Users receive monthly credits based on their subscription plan:

| Plan       | Price  | Credits/Month |
| ---------- | ------ | ------------- |
| Free       | ₹0     | 30            |
| Member     | ₹499   | 200           |
| Master     | ₹999   | 500           |
| Enterprise | Custom | 2000          |

---

## Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐    ┌───────────────────┐    ┌──────────────────┐  │
│  │  CreditDisplay   │    │   ChatArea.jsx    │    │  CompanyModal    │  │
│  │   (Sidebar)      │    │   KPIBuilder.jsx  │    │  ReportModal     │  │
│  │                  │    │                   │    │                  │  │
│  │ Shows balance    │    │ Consumes credits  │    │ (Disabled for   │  │
│  │ with warnings    │    │ on actions        │    │  testing)        │  │
│  └────────┬─────────┘    └─────────┬─────────┘    └──────────────────┘  │
│           │                        │                                     │
│           └────────────┬───────────┘                                     │
│                        ▼                                                 │
│           ┌────────────────────────┐                                     │
│           │   creditsService.js    │                                     │
│           ├────────────────────────┤                                     │
│           │ • getCredits()         │                                     │
│           │ • decrementCredits()   │                                     │
│           │ • addCredits()         │                                     │
│           │ • hasEnoughCredits()   │                                     │
│           └────────────┬───────────┘                                     │
│                        │                                                 │
└────────────────────────┼────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            SUPABASE                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐    ┌───────────────────┐    ┌──────────────────┐  │
│  │     credits      │    │   credit_events   │    │   credit_costs   │  │
│  │     (table)      │    │     (table)       │    │     (table)      │  │
│  │                  │    │                   │    │                  │  │
│  │ Current balance  │    │ Transaction log   │    │ Cost per action  │  │
│  └──────────────────┘    └───────────────────┘    └──────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     RPC Functions                                 │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │ spend_credits(p_user, p_action)  ← Defined in migrations         │   │
│  │ change_credits(target_user, delta) ← ⚠️ NOT DEFINED (missing!)   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Service Layer: `creditsService.js`

Located at: `src/services/creditsService.js`

### Available Functions

#### `getCredits(userId)`

Fetches the current credit balance for a user.

```javascript
const balance = await getCredits(userId);
// Returns: number (e.g., 25)
```

#### `decrementCredits(userId, amount)`

Deducts credits from user's balance.

```javascript
const newBalance = await decrementCredits(userId, CREDIT_COSTS.MESSAGE);
// Returns: new balance after deduction
```

#### `addCredits(userId, amount)`

Adds credits to user's balance (for purchases, rewards, etc.).

```javascript
const newBalance = await addCredits(userId, 100);
// Returns: new balance after addition
```

#### `hasEnoughCredits(userId, requiredAmount)`

Checks if user has sufficient credits for an action.

```javascript
const canProceed = await hasEnoughCredits(userId, CREDIT_COSTS.REPORT_GENERATE);
// Returns: boolean
```

### Frontend Credit Costs Constants

```javascript
// Defined in creditsService.js
export const CREDIT_COSTS = {
  MESSAGE: 1, // Each chat message
  KPI_CREATE: 2, // Creating a new KPI
  WORKBENCH_CREATE: 3, // Creating a new workbench
  REPORT_GENERATE: 5, // Generating any report
  COMPANY_CREATE: 5, // Creating a new company
};
```

---

## UI Component: `CreditDisplay.jsx`

Located at: `src/components/Sidebar/CreditDisplay.jsx`

### Features

- **Real-time balance display** with progress bar
- **Color-coded warnings:**
  - 🟢 **Teal/Green:** > 10 credits
  - 🟡 **Amber:** ≤ 10 credits
  - 🔴 **Red:** ≤ 5 credits
- **"Running low" warning** when ≤ 5 credits
- **"Get More Credits" button** when balance is 0

---

## What's Currently Working ✅

| Feature                   | Status     | Notes                                 |
| ------------------------- | ---------- | ------------------------------------- |
| `credits` table           | ✅ Working | Stores user balances                  |
| `credit_events` table     | ✅ Working | Logs all transactions                 |
| `credit_costs` table      | ✅ Working | Costs defined                         |
| `change_credits` RPC      | ✅ Working | Atomic credit updates                 |
| `getCredits()`            | ✅ Working | Fetches balance correctly             |
| `CreditDisplay` component | ✅ Working | Shows balance in sidebar              |
| New user initialization   | ✅ Working | 30 credits on signup                  |
| Message credit deduction  | ✅ Active  | Deducts 1 credit per message          |
| Company creation credits  | ✅ Active  | Deducts 5 credits                     |
| KPI creation credits      | ✅ Active  | Deducts 2 credits                     |
| Report generation credits | ✅ Active  | Deducts 5 credits                     |
| RLS policies              | ✅ Working | Users can only read their own credits |

---

## Known Issues & Gaps ⚠️

### 1. ~~Missing `change_credits` RPC Function~~ ✅ FIXED

The `change_credits` RPC function is now defined in `supabase/migrations/credits_fix.sql`.

---

### 2. ~~Credit Events Not Being Logged~~ ✅ FIXED

The `change_credits` RPC now logs all credit transactions to the `credit_events` table.

---

### 3. ~~Credit Deductions Disabled for Testing~~ ✅ FIXED

Credit deductions are now enabled in all components:

| Component             | File                            | Status     |
| --------------------- | ------------------------------- | ---------- |
| CompanyModal          | `CompanyModal/CompanyModal.jsx` | ✅ Enabled |
| VisualDashboard (KPI) | `Visuals/VisualDashboard.jsx`   | ✅ Enabled |
| ReportModal           | `ReportModal/ReportModal.jsx`   | ✅ Enabled |

---

### 4. No Monthly Credit Refresh

Plans define `credits_per_month` but there's no cron job or function to reset credits monthly.

---

### 5. No Credit Top-Up UI

The `addCredits()` function exists but there's no UI for purchasing or adding credits.

---

### 6. Workbench Trigger Disabled

A database trigger for auto-deducting credits on workbench creation exists in migrations but is **commented out**.

---

## Row Level Security (RLS) Policies

```sql
-- Users can only read their own credits
CREATE POLICY "Users can read own credits"
ON public.credits FOR SELECT
USING (auth.uid() = user_id);

-- Users can only read their own credit events
CREATE POLICY "Users can read own credit events"
ON public.credit_events FOR SELECT
USING (auth.uid() = user_id);
```

---

## Testing the Credit System

### 1. Check Current Balance

```javascript
import { getCredits } from "../services/creditsService";

const balance = await getCredits(userId);
console.log("Current credits:", balance);
```

### 2. Test Credit Deduction

```javascript
import { decrementCredits, CREDIT_COSTS } from "../services/creditsService";

const newBalance = await decrementCredits(userId, CREDIT_COSTS.MESSAGE);
console.log("New balance after message:", newBalance);
```

### 3. Verify in Supabase Dashboard

- Go to Table Editor → `credits` → Check user balance
- Go to Table Editor → `credit_events` → View transaction history

---

## Future Enhancements (Roadmap)

| Phase | Feature                        | Status                               |
| ----- | ------------------------------ | ------------------------------------ |
| 1     | Fix `change_credits` RPC       | ✅ Completed                         |
| 2     | Re-enable credit deductions    | ✅ Completed                         |
| 3     | New user credit initialization | ✅ Completed                         |
| 4     | Credit event logging           | ✅ Completed                         |
| 5     | Implement credit purchase flow | ❌ Not started                       |
| 6     | Referral rewards system        | ❌ Mentioned in development-scope.md |
| 7     | Monthly credit refresh cron    | ❌ Not started                       |

---

## Setup Instructions

### 1. Run the Migration

Execute `supabase/migrations/credits_fix.sql` in your Supabase SQL Editor to:

- Create the `change_credits` RPC function
- Update `handle_new_user()` trigger to initialize credits
- Fix existing users without credits

### 2. Verify the Setup

```sql
-- Check if change_credits function exists:
SELECT proname FROM pg_proc WHERE proname = 'change_credits';

-- Check credits for all users:
SELECT p.email, c.balance FROM profiles p LEFT JOIN credits c ON p.id = c.user_id;

-- Test the function (replace with actual user_id):
SELECT change_credits('your-user-id-here', -1);
```

---

## File References

| File                                           | Purpose                      |
| ---------------------------------------------- | ---------------------------- |
| `src/services/creditsService.js`               | Credit operations service    |
| `src/components/Sidebar/CreditDisplay.jsx`     | UI credit display            |
| `supabase/migrations/*credits*`                | Database migrations          |
| `src/components/ChatArea/ChatArea.jsx`         | Message credit deduction     |
| `src/components/CompanyModal/CompanyModal.jsx` | Company creation (disabled)  |
| `src/components/KPIBuilder/KPIBuilder.jsx`     | KPI creation (disabled)      |
| `src/components/ReportModal/ReportModal.jsx`   | Report generation (disabled) |
