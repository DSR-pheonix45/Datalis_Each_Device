# Datalis Architecture & Microservices Transition

## 1. Executive Summary
This document outlines the architectural transformation of Datalis from a client-heavy monolithic frontend to a modular, microservices-oriented architecture. The core strategy leverages **Supabase Edge Functions** as microservices to handle business logic, ensuring the frontend remains lightweight and focused on presentation.

## 2. Core Architecture Principles
1.  **Microservices First**: All complex business logic (creation, confirmation, reconciliation, intelligence) resides in stateless Edge Functions.
2.  **Frontend as View Layer**: The React frontend is a thin client that consumes these services via a unified `backendService`.
3.  **Data Integrity via Database**: Supabase (PostgreSQL) acts as the single source of truth, enforced by RLS policies and constraints.
4.  **Asynchronous Processing**: Heavy tasks (OCR, file processing) are handled asynchronously via Storage Triggers and Edge Functions.

## 3. Microservices Map (Supabase Edge Functions)

The following Edge Functions serve as the microservices for the application. All are invoked via `supabase.functions.invoke`.

| Service Name | Edge Function | Responsibility | Status |
| :--- | :--- | :--- | :--- |
| **Record Service** | `create-record` | Validates and creates financial records (Transactions, Invoices, etc.). | ✅ Implemented |
| **Workbench Service** | `create-workbench` | Initializes new workbenches, sets up defaults, and assigns permissions. | ✅ Implemented |
| **Ledger Service** | `confirm-record` | Commits a record to the immutable ledger and updates account balances. | ✅ Implemented |
| **Adjustment Service** | `push-adjustment` | Handles corrections, reversals, and reclassifications with audit trails. | ✅ Implemented |
| **Chat Service** | `create-chat-session` | Initializes AI chat sessions with context. | ✅ Implemented |
| **Chat Memory** | `save-chat-message` | Stores messages and updates session context/history. | ✅ Implemented |
| **Onboarding** | `accept-invite` | Securely handles user invitations and workbench membership. | ✅ Implemented |
| **Intelligence** | `get-intelligence` | Aggregates health metrics, anomalies, and business insights. | 🚧 In Progress |
| **Reconciliation** | `run-reconciliation` | Automated matching of bank statements to ledger entries. | 🚧 In Progress |
| **Ingestion** | `csv-ingest` | Bulk import of financial data from CSV/Excel. | 🚧 In Progress |
| **OCR Pipeline** | `process-document` | Extract data from uploaded documents (PDF/Image). | 🚧 In Progress |

## 4. Frontend Architecture

### 4.1. Directory Structure
```
src/
├── services/           # API Gateways (The only place that calls Edge Functions)
│   ├── backendService.js    # Primary gateway for business logic
│   ├── intelligenceService.js # Analytics and metrics
│   ├── llmService.js        # AI/LLM integration (Groq, Gemini, OpenRouter)
│   └── ...
├── components/         # UI Components
│   ├── Workbenches/    # Feature-specific modules
│   ├── ...
├── context/            # Global State (Theme, Auth)
└── hooks/              # Reusable logic (useAuth, useForm)
```

### 4.2. Key Optimization Strategies
-   **Service Layer Pattern**: UI components never call `supabase.functions` directly. They import `backendService`.
-   **Parallel Data Fetching**: `Promise.all` is used in services to aggregate data concurrently (e.g., `intelligenceService.js`).
-   **Debouncing**: High-frequency updates (e.g., Session Storage writes) are debounced to prevent performance degradation.
-   **Lazy Loading**: Route-based code splitting using `React.lazy`.

## 5. Transition Roadmap

### Phase 1: Foundation (Completed) ✅
-   [x] Establish `backendService` as the unified API gateway.
-   [x] Implement core CRUD operations (`create-record`, `create-workbench`) as Edge Functions.
-   [x] Implement Ledger logic (`confirm-record`) as a microservice.
-   [x] Resolve all critical linting and React Hook dependency issues.

### Phase 2: Intelligence & Optimization (Current) 🚧
-   [ ] Migrate remaining client-side aggregations (`intelligenceService.js`) to `get-intelligence` Edge Function.
-   [ ] Finalize `process-document` pipeline for automated OCR.
-   [ ] Implement `csv-ingest` for bulk data handling.

### Phase 3: Advanced Automation (Future) 📅
-   [ ] Full `run-reconciliation` implementation for automated bank matching.
-   [ ] Real-time collaboration features via Supabase Realtime.
-   [ ] Advanced AI agents for autonomous bookkeeping.

## 6. Developer Guidelines
1.  **New Features**: Always ask, "Can this logic live in an Edge Function?" If yes, create a new function or update an existing one.
2.  **State Management**: Prefer local state for forms and modals. Use Context only for global app state (User, Theme).
3.  **Linting**: Maintain a zero-warning policy. Use `npm run lint` before committing.
4.  **Testing**: Verify Edge Function logic via `backendService` integration tests.
