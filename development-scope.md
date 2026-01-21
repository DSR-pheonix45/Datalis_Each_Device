# Development Scope for Dabby App

## Overview
This document outlines the scope and development plan for the Dabby app, a production-level financial analysis platform. The app integrates authentication, data processing, AI-driven insights, and user management using GCP, Vercel, and Supabase. Auth module is already implemented; focus on building the remaining features for production deployment.

## Key Modules and Responsibilities
1. **Auth**: User login/signup and dashboard access. (Implemented)
2. **Workbench Modal**: Upload files/folders, process into vector embeddings, store in Supabase storage. Supports personal or company-based creation.
3. **Company Modal**: Organization management for projects. Enables workbench sharing among colleagues and supports report generation.
4. **Visuals Page**: Create and track financial KPIs based on workbench data.
5. **CHAT Module (Dabby Consultant)**: LLM + RAG-based financial consultant for insights and analytics.
6. **Report Generation Modal**: Generate various financial reports from workbench data.
7. **Credit System**: Track usage and deduct credits from user wallets.
8. **Referral System and RBAC**: Reward credits for referrals; implement role-based access for companies.

## Production Architecture
- **Backend**: Supabase (DB, functions, cron jobs for embeddings/reports).
- **Frontend**: Vercel for deployment.
- **Cloud Services**: GCP for additional compute/storage (e.g., embeddings processing).
- **AI/ML**: LLM integration with RAG pipeline for chat and reports.

## Suggested Development Plan
1. **Phase 1: Infrastructure Setup** - Configure GCP, Vercel, and Supabase for production (auth, storage, functions).
2. **Phase 2: Core Data Modules** - Build Workbench and Company modals with embeddings and sharing.
3. **Phase 3: Analytics & AI** - Implement Visuals, Chat, and Reports with RAG integration.
4. **Phase 4: Monetization & Access** - Add Credit System, Referrals, and RBAC.
5. **Phase 5: Testing & Deployment** - End-to-end testing, security, and production rollout.

For better clarity, please provide details on each module (e.g., specific APIs, UI mockups, data schemas). What specifics do you have for Workbench Modal first?
