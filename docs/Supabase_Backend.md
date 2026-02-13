
Dabby — Supabase Backend Architecture & Data Contracts

This document defines the entire backend system for Dabby using Supabase.
It is the authoritative reference for database schema, RLS, RBAC, dataflow, and edge-function responsibilities.

Frontend and platform logic must conform to this document.

1. SYSTEM OVERVIEW
Stack

Auth: Supabase Auth (Email / OAuth)

Database: Postgres (Supabase)

Storage: Supabase Buckets (Private)

Logic: Supabase Edge Functions

Security: Row Level Security (RLS)

Client: React + Vite (Vercel)

2. CORE CONCEPTS
Workbench

A workbench represents one company / operational unit.

Founder creates workbench

CA / Analyst / Investor join workbench

All data is scoped to workbench

3. USER TYPES (IDENTITY)

Stored in user_profiles.role

Role	Meaning
founder	Company owner
ca	Chartered Accountant
analyst	Internal analyst
investor	Read-only stakeholder

❗ Identity role ≠ permissions
Permissions are decided by workbench membership

4. WORKBENCH RBAC (CANONICAL)
workbench_members.role
Role	Power
founder	Absolute
ca	Admin
analyst	Editor
investor	Viewer
Capability Matrix
Capability	Founder	CA	Analyst	Investor
Create workbench	✅	❌	❌	❌
Join workbench	✅	✅	✅	✅
View data	✅	✅	✅	✅
Edit compliance	✅	✅	✅	❌
Edit budgets	✅	✅	✅	❌
Create transactions	✅	✅	✅	❌
Create adjustments	✅	✅	❌	❌
Invite members	✅	✅	❌	❌
Change roles	✅	✅	❌	❌
Delete workbench	✅	❌	❌	❌
Chat (context-only)	✅	✅	✅	✅
5. HIGH-LEVEL DATAFLOW
flowchart TD
  Auth --> Profiles
  Profiles --> Onboarding
  Onboarding --> Workbenches
  Workbenches --> Members
  Members --> Records
  Documents --> EdgeFunctions
  EdgeFunctions --> Transactions
  Transactions --> Budgets
  Transactions --> Compliance
  Transactions --> Adjustments

6. ONBOARDING FLOW

User signs up (Supabase Auth)

user_profiles row created

status = partial

Chat allowed

Workbench blocked

After onboarding completion

status = active

Workbench creation enabled

7. DATA SCHEMA (AUTHORITATIVE)
7.1 user_profiles
user_id uuid (auth.users)
name text
role text (founder, ca, analyst, investor)
contact_number text nullable
status text ('partial', 'active')

7.2 workbenches
id uuid
name text
description text
owner_user_id uuid
timestamps

7.3 workbench_members
workbench_id uuid
user_id uuid
role text (founder, ca, analyst, investor)
invited_by uuid

7.4 workbench_documents

Source documents uploaded by users

workbench_id uuid
file_path text
document_type text
processing_status text
extracted_schema jsonb
derived_tables jsonb


📌 Documents are NEVER authoritative records

7.5 workbench_parties
workbench_id uuid
name text
party_type text (customer, vendor, both)
gstin text
pan text


❌ Investors cannot access

7.6 party_accounts
party_id uuid
account_type text (bank, upi, wallet)
account_identifier text


❌ Investors cannot access

7.7 workbench_accounts
workbench_id uuid
account_type text (bank, upi, gateway, wallet, cash)
account_identifier text nullable


❌ Investors cannot access

7.8 transactions (IMMUTABLE)
workbench_id uuid
amount numeric
direction text (credit, debit)
transaction_date date
party_name text
external_reference text
source_document_id uuid
created_by uuid


🚨 Transactions are never updated or deleted

7.9 budgets
workbench_id uuid
category text
allocated_amount numeric


Investor: Read-only

7.10 compliances
workbench_id uuid
name text
form text
deadline date
status text


Investor: Read-only

7.11 adjustments (AUDIT SAFE)
workbench_id uuid
original_transaction_id uuid
adjustment_type text
adjustment_amount numeric
reason text
created_by uuid


✔ Founder / CA only
❌ Investor never sees

7.12 usage_counters
user_id uuid
subscription_id uuid
month date
chat_sessions int
workbenches_created int

8. RLS PATTERNS (STANDARDIZED)
Pattern A — Read (All Members)
exists (
  select 1 from workbench_members
  where workbench_id = <table>.workbench_id
  and user_id = auth.uid()
)


Used for:

transactions

budgets

compliances

documents (metadata)

Pattern B — Write (Ops Roles)
role in ('founder', 'ca', 'analyst')


Used for:

transactions

budgets

compliances

documents

Pattern C — Strict (No Investor)
role in ('founder', 'ca')


Used for:

adjustments

parties

accounts

9. EDGE FUNCTION RESPONSIBILITIES
9.1 Document Processing

Parse CSV / PDF

Extract transactions

Insert into transactions

NEVER write directly from frontend

9.2 Transaction Creation

Validate role

Validate party / account

Enforce cash rules

Insert immutable transaction

9.3 Adjustment Creation

Founder / CA only

One adjustment per transaction

Net effect only via aggregation

9.4 Budget Reconciliation

Compute spend via net_amount

Never store derived numbers permanently

10. FINANCIAL SAFETY RULES
Net Amount Formula
net_amount =
transaction.amount + coalesce(adjustment.adjustment_amount, 0)

11. STORAGE RULES

Bucket: workbench-documents

Private

Access via signed URLs only

DB stores metadata only

12. INDEXING (MANDATORY)

workbench_members (workbench_id, user_id)

transactions (workbench_id, date)

budgets (workbench_id)

compliances (workbench_id, deadline)

13. NON-NEGOTIABLE RULES

❌ No frontend writes to core tables

❌ No transaction edits

❌ No investor access to parties/accounts

✅ All mutations via Edge Functions

✅ All analytics derived, never overwritten

14. FINAL NOTE FOR TRAE

Treat this file as the backend contract.
Any frontend feature must:

Respect RLS

Use edge functions for writes

Never assume hidden data exists