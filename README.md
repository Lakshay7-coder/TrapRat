# Kaushal Sankalp (TrapRat 360) — Skill Outcome Intelligence Platform

A government-grade Skill Outcome Tracking & Intelligence Platform built with a **Node.js/TypeScript/Express/Prisma** backend and a **React/Vite/Tailwind** frontend.

---

## 🚀 Quick Start

### 1. Run Backend API
```bash
cd backend
npm install
npm run dev
```
Backend runs at `http://localhost:3000`.

To reset & re-seed database with rich test fixtures (40+ trainees, 3 providers, 6 courses, 10 batches, anomalies, etc.):
```bash
npm run prisma:seed
```

To run the backend test suite:
```bash
npm test
```

### 2. Run Frontend Web App
```bash
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

---

## 🔑 Demo Seed Accounts

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@kaushalsankalp.gov.in` | `Admin@123` |
| **Provider Admin (Pune)** | `admin@puneskills.org` | `Admin@123` |
| **Provider Admin (Mumbai)** | `admin@skillcraft.edu.in` | `Admin@123` |
| **Field Officer** | `officer@skills.gov.in` | `Admin@123` |
| **Trainee** | `trainee@kaushalsankalp.gov.in` | `Admin@123` |

---

## 🏗️ Architecture & Features

### Core Modules
1. **Trainee Registry & Skill Outcome IDs**: Unique `KSL-YYYY-XXXXX` format (never raw Aadhaar), AES-256-GCM encrypted PII fields (phone, email).
2. **Explainable Trust Score (0-100)**: Transparent calculation with detailed breakdown per outcome (`base`, `employer_verified_bonus`, `verified_documents`, `recency_bonus`, `consistency_bonus`, and `anomaly_penalty`).
3. **Signal-First Verification Ladder**: 4-level escalation (Level 1: mock EPFO/Udyam, Level 2: direct confirmation, Level 3: WhatsApp bot state machine, Level 4: field officer).
4. **Anomaly Detection Engine**: 10 automated rules detecting duplicate documents, impossible timelines, bulk employer confirms, concurrent full-time placements, and batch detail duplication.
5. **DPDP Act 2023 Consent Enforcement**: Purpose-level consent records; immediate withdrawal cancels queued follow-up jobs and suppresses PII.
6. **Retention Cadence**: 30 / 90 / 180 / 365 days automated follow-ups with mock notification logging and response simulation.
7. **Curriculum Skill Gap & Advisory Reports**: Analyzes demanded skills against course syllabi and produces quarterly advisory reports.
8. **Equity Analytics & Context-Adjusted Scorecards**: Disparity analysis across gender, caste, location, and disability with small-cell suppression ($n < 10$).
9. **Tamper-Evident Audit Logging**: Hash-chained audit trail for all sensitive operations.

---

## 📡 API Reference Overview

| Module | Route | Method | Access |
|---|---|---|---|
| **Auth** | `/api/auth/login` | `POST` | Public |
| **Auth** | `/api/auth/register` | `POST` | Public |
| **Auth** | `/api/auth/refresh` | `POST` | Refresh Token |
| **Users** | `/api/users/me` | `GET`, `PUT` | Auth |
| **Trainees** | `/api/trainees` | `GET`, `POST` | Admin / Provider |
| **Trainees** | `/api/trainees/:id` | `GET`, `PUT` | Auth |
| **Trainees** | `/api/trainees/:id/claim-record` | `POST` | Public (OTP-gated) |
| **Providers** | `/api/providers` | `GET`, `POST` | Auth |
| **Providers** | `/api/providers/:id/stats` | `GET` | Auth |
| **Courses** | `/api/courses` | `GET`, `POST` | Auth |
| **Batches** | `/api/batches` | `GET`, `POST` | Auth |
| **Enrolments** | `/api/enrolments` | `GET`, `POST` | Auth |
| **Enrolments** | `/api/enrolments/:id/complete` | `POST` | Admin / Provider |
| **Outcomes** | `/api/outcomes` | `GET`, `POST` | Auth |
| **Outcomes** | `/api/outcomes/:id/verify` | `POST` | Admin / Field Officer |
| **Outcomes** | `/api/outcomes/:id/recalculate-trust-score` | `POST` | Admin |
| **Employers** | `/api/employers` | `GET`, `POST` | Auth |
| **Employers** | `/api/employers/:id/send-verification-link` | `POST` | Auth |
| **Public Verify** | `/api/public/verify/:token` | `GET`, `POST` | Public (Token-gated) |
| **Follow-ups** | `/api/followups` | `GET`, `POST` | Auth |
| **Documents** | `/api/documents/upload` | `POST` | Auth (Multipart) |
| **Documents** | `/api/documents/:id/verify` | `PUT` | Admin / Field Officer |
| **Consent** | `/api/consent` | `GET`, `POST` | Auth |
| **Anomalies** | `/api/anomalies` | `GET`, `POST` | Admin |
| **Anomalies** | `/api/anomalies/:id/review` | `PUT` / `PATCH` | Admin |
| **Identity** | `/api/identity/link-candidates` | `POST` | Admin |
| **Identity** | `/api/identity/review-queue` | `GET` | Admin |
| **Analytics** | `/api/analytics/outcomes/summary` | `GET` | Auth |
| **Analytics** | `/api/analytics/equity` | `GET` | Admin |
| **Analytics** | `/api/analytics/skill-gaps` | `GET` | Auth |
| **Analytics** | `/api/analytics/reasons` | `GET` | Auth |
| **Analytics** | `/api/analytics/data-quality` | `GET` | Admin |
| **Analytics** | `/api/analytics/advisory-reports` | `GET`, `POST` | Auth |
| **Audit Logs** | `/api/audit-logs` | `GET` | Admin |
| **Dev Mock** | `/api/dev/notification-inbox` | `GET` | Dev Only |

---

## 🐳 Docker Deployment
```bash
docker compose up --build -d
```
Starts PostgreSQL, Redis, API, and Frontend web application in containers.
