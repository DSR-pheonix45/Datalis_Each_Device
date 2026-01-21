# Development Testing & Bug Tracking Plan

This document governs how Datalis validates its platform during the development cycle before the production rollout. It captures the scope, required environments, execution cadences, and a traffic-light bug/vulnerability register so the team can prioritize fixes ahead of the production push.

## 1. Objectives

- Verify that recent code changes behave correctly in development and staging environments.
- Surface regressions early by combining automated and manual testing layers.
- Capture bugs/vulnerabilities with a consistent severity rubric (green/orange/red) that informs release readiness.
- Define the gating criteria that must be satisfied before promoting the build to production.

## 2. Environment Matrix

| Environment | Purpose | Data Profile | Deployment Cadence | Exit Criteria |
|-------------|---------|--------------|--------------------|---------------|
| Local (per developer) | Fast feedback for unit/component tests and UI tweaks | Mocked services, seed data via Supabase local stack | On every feature branch commit | All unit tests pass, lint clean |
| Dev (shared) | Integration of frontend + Supabase services, API contract validation | Synthetic but realistic anonymized data | Nightly or on merge to `develop` | Passing integration + API tests, no red issues |
| Staging / Pre-prod | Final rehearsal with production-like infra, feature flags as in prod | Sanitized production snapshot | Before release candidates | Full regression suite green, performance & security checks signed off |
| Production | User-facing environment | Live data | After staging sign-off | Continuous monitoring, hotfix playbook ready |

## 3. Test Strategy (Development Phase)

1. **Automated Unit & Component Tests** (Vitest + React Testing Library)
   - Cover utility functions, hooks, and visual components with >80% critical-path coverage.
2. **Integration & API Contract Tests** (Cypress/Postman)
   - Exercise Supabase auth flows, credit deductions, KPI ingestion, and chat pipelines end-to-end.
3. **Data Integrity Checks**
   - Validate SQL migrations on Supabase shadow database; confirm KPI calculations using fixture spreadsheets.
4. **Security & Access Control**
   - Verify row-level security (RLS), token expiration, and role-based UI states.
5. **Performance Smoke Tests**
   - Measure dashboard load (<2s target on broadband) and bulk file ingestion throughput using sample CSV/PDF uploads.
6. **UX & Accessibility Review**
   - Keyboard navigation, ARIA labeling, focus management, color contrast, responsive breakpoints.
7. **Regression Sweep**
   - Maintain a living checklist of critical journeys (login, workspace switch, KPI export, credit purchase) and rerun each before any release candidate is cut.

## 4. Execution Checklist (per dev cycle)

1. Sync latest `develop`, install deps, run `npm run lint` and unit tests locally.
2. Seed Supabase dev DB using migration scripts; verify feature flags for the sprint.
3. Execute automated integration suite; archive reports in CI artifacts.
4. Conduct manual exploratory passes focusing on newly touched areas.
5. Update bug/vulnerability table (Section 5) with findings and status colors.
6. Hold a release readiness review—ensure no "red" entries remain before staging promotion.

## 5. Bug & Vulnerability Status Legend

- 🟢 **Green** – Passed verification, no actionable issues.
- 🟠 **Orange** – Minor or low-risk issue; monitor or schedule fix soon.
- 🔴 **Red** – Critical failure or vulnerability; block release until resolved.

### Active Register (Development Snapshot)

| ID | Area | Description | Owner | Status |
|----|------|-------------|-------|--------|
| DEV-APP-001 | Frontend routing | Navigation guards prevent unauthorized access to `/workspace/:id` routes in dev tests. | Frontend Team | 🟢 Green |
| DEV-CRED-002 | Usage credits | Duplicate credit deduction observed when retrying failed invoice sync; temporary guard added but needs permanent fix. | Backend Team | 🟠 Orange |
| DEV-AUTH-003 | Admin invites | Invitation tokens for org admins never expire if not redeemed, allowing potential misuse. | Security Lead | 🔴 Red |

> Update this table after every test run. When issues are fixed, move them to the release notes and replace with new findings.

## 6. Reporting & Tooling

- **CI Pipelines**: Ensure lint/unit/integration stages run on pull requests; block merges on failures.
- **Bug Tracker**: Mirror entries from the register into your ticketing tool (e.g., Linear/Jira) for assignment and sprint planning.
- **Test Evidence**: Store screenshots, logs, and SQL outputs in a shared drive or as CI artifacts for auditability.

## 7. Production Rollout Readiness

A build can only advance from staging to production when:

1. All 🔴 issues are fixed and verified as 🟢.
2. No more than two 🟠 issues remain, each with documented mitigation plans.
3. Performance benchmarks meet agreed thresholds (dashboard TTFB < 500ms via Vercel preview, Supabase query latency < 200ms for KPI fetches).
4. Security review signs off on RLS policies and token handling.
5. Rollback plan and monitoring dashboards (Supabase logs, Vercel analytics) are prepared.

Once the above is achieved, tag the release candidate, run the staging smoke tests one final time, and schedule the production deployment window.
