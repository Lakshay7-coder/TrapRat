# Master Prompt: Build the Skill Outcome Tracking System

| | |
|---|---|
| **Document type** | Master build prompt / engineering specification |
| **Version** | 2.0 (revised and extended) |
| **Target** | Production-grade prototype, suitable for SIH demonstration |
| **Audience** | AI coding assistant or engineering team implementing the system |

> **How to read this document.** Sections 1-13 contain the complete original specification, preserved in full and reorganised for clarity. Every enhancement introduced in this revision is tagged **`[NEW]`** so that original and added scope can be told apart at a glance. Nothing from the original specification has been removed or weakened.

---

## Table of Contents

- [Role and Objective](#role-and-objective)
- [1. Project Goal](#1-project-goal)
- [2. Tech Stack](#2-tech-stack)
- [3. Repository Structure](#3-repository-structure)
- [4. Database Schema](#4-database-schema)
- [5. Authentication and Authorization](#5-authentication-and-authorization)
- [6. API Design](#6-api-design)
- [7. Frontend Requirements](#7-frontend-requirements)
- [8. Background Jobs and Mock Notifications](#8-background-jobs-and-mock-notifications)
- [9. Security, Privacy, and Audit](#9-security-privacy-and-audit)
- [10. Anomaly Detection](#10-anomaly-detection)
- [11. Deployment and Developer Experience](#11-deployment-and-developer-experience)
- [12. Implementation Order](#12-implementation-order)
- [13. Output Instructions](#13-output-instructions)
- [14. Enhancement Addendum `[NEW]`](#14-enhancement-addendum-new)
- [15. Acceptance Criteria `[NEW]`](#15-acceptance-criteria-new)

---

## Role and Objective

You are an expert full-stack architect and senior engineer. Your task is to design and generate a complete, production-ready web application for a **Skill Outcome Tracking System** that tracks trainees from training to employment/self-employment, follows up over time, verifies outcomes, computes a trust score, and provides dashboards for trainees, training providers, employers, and scheme administrators.

Use the following specification exactly. If something is ambiguous, make reasonable assumptions and state them clearly at the top of your response before generating code.

---

## 1. Project Goal

Build a system that:

1. Registers trainees and gives each a unique **Skill Outcome ID**.
2. Tracks training details: provider, course, batch, enrolment, attendance, assessment, certificate.
3. Captures first outcome after training:
   - employed
   - self_employed
   - apprenticeship
   - studying
   - seeking_work
   - not_available
   - other
4. Schedules and executes follow-ups at **30 / 90 / 180 / 365 days** to track:
   - Job retention (still in same job / business?)
   - Wage progression (salary band changes)
   - Training relevance (is job using trained skills?)
5. Verifies outcomes via:
   - Trainee self-report
   - Employer confirmation (secure link / OTP / IVR / QR)
   - Documents (joining letter, payslip, business photo, invoice, Udyam, etc.)
   - Field officer verification
   - Optionally approved ecosystem signals; for the prototype, implement these as **mock connectors only**.
6. Computes an **Outcome Trust Score (0-100)** for each outcome record.
7. Detects anomalies and possible fake placements, such as one employer confirming too many trainees, identical job details across a batch, and sudden placement spikes.
8. Provides dashboards:
   - Trainee dashboard: own record, outcomes, follow-ups, documents, consent.
   - Provider dashboard: batches, placement rates, retention, wage progression, relevance, anomalies.
   - Employer portal: lightweight verification page.
   - Admin / scheme dashboard: aggregated, anonymized metrics by district, course, provider, gender, category.
9. Respects privacy and consent:
   - Explicit consent for follow-ups, employer contact, document upload, analytics, and job sharing.
   - Data minimization: wage bands instead of exact salary unless voluntarily provided.
   - No Aadhaar as primary identifier; use a generated Skill Outcome ID.
   - Audit logs for all sensitive actions.

> **`[NEW]` Goal extensions.** The following goals extend the list above and are specified in [Section 14](#14-enhancement-addendum-new). They exist to close gaps against the original problem statement (reasons for non-placement/attrition, skill gaps, identity linkage, equity analysis, and accountability).
>
> 10. Implements **signal-first verification**: check authorized/mock ecosystem signals first, then a one-tap confirmation, then an automated follow-up, and involve humans only for unresolved cases.
> 11. Classifies **reasons for non-placement and attrition** into standardised taxonomies.
> 12. Measures **training relevance and skill gaps** and produces a **Quarterly Curriculum Advisory Report**.
> 13. Links records **across programmes** using privacy-preserving identity matching.
> 14. Provides **equity analytics** and **context-adjusted provider scoring**.
> 15. Labels every published metric with a **data coverage / confidence indicator**.

---

## 2. Tech Stack

Use this stack unless you have a strong reason to change it. If you change it, explain why.

### Frontend

- React + Vite (or Next.js if SSR is preferred)
- TypeScript
- Tailwind CSS (or MUI/Chakra if preferred)
- React Query (or SWR) for data fetching
- React Hook Form + Zod for forms and validation
- React Router if not using Next.js routing

### Backend

- Node.js
- TypeScript
- Express (or NestJS if a more structured architecture is preferred)
- Prisma ORM
- JWT-based authentication
- Role-based access control: `admin`, `provider_admin`, `provider_staff`, `employer`, `field_officer`, `trainee`
- Bull with Redis, or equivalent, for background jobs such as follow-ups and reminders

### Database

- PostgreSQL

### Infrastructure

For local prototype development, use Docker Compose with:

- PostgreSQL
- Redis
- Backend API
- Frontend web app

Provide `.env.example` files for frontend and backend.

### File Storage

- For prototype: use local disk or MinIO/S3-compatible storage.
- Store only file references or URLs/paths in the database.

### Notifications

- Implement a **mock SMS/WhatsApp/IVR service** that logs messages rather than sending real ones.
- Create clear extension points for real providers later.

---

## 3. Repository Structure

Create a monorepo with this structure:

```text
skill-outcome-tracker/
  apps/
    web/               # React/Next.js frontend
    api/               # Node.js backend
  packages/
    shared-types/      # Shared TypeScript types (optional but preferred)
  infra/
    docker-compose.yml
    .env.example
  docs/
    architecture.md
    api.md
    data-model.md
  README.md
```

### Backend structure

```text
apps/api/
  src/
    config/
      database.ts
      env.ts
    modules/
      auth/
        auth.controller.ts
        auth.service.ts
        auth.routes.ts
      users/
        users.controller.ts
        users.service.ts
        users.routes.ts
      trainees/
        trainees.controller.ts
        trainees.service.ts
        trainees.routes.ts
      providers/
        providers.controller.ts
        providers.service.ts
        providers.routes.ts
      courses/
        courses.controller.ts
        courses.service.ts
        courses.routes.ts
      batches/
        batches.controller.ts
        batches.service.ts
        batches.routes.ts
      enrolments/
        enrolments.controller.ts
        enrolments.service.ts
        enrolments.routes.ts
      outcomes/
        outcomes.controller.ts
        outcomes.service.ts
        outcomes.routes.ts
        trustScore.service.ts
      employers/
        employers.controller.ts
        employers.service.ts
        employers.routes.ts
      followups/
        followups.controller.ts
        followups.service.ts
        followups.routes.ts
        followups.scheduler.ts
      documents/
        documents.controller.ts
        documents.service.ts
        documents.routes.ts
      analytics/
        analytics.controller.ts
        analytics.service.ts
        analytics.routes.ts
      consent/
        consent.controller.ts
        consent.service.ts
        consent.routes.ts
    middlewares/
      auth.middleware.ts
      role.middleware.ts
      consent.middleware.ts
      error.middleware.ts
    services/
      notification.service.ts
    utils/
      logger.ts
      errors.ts
      trustScoreUtils.ts
    app.ts
    server.ts
  prisma/
    schema.prisma
    seed.ts
  tests/
  .env.example
  package.json
  tsconfig.json
```

> **`[NEW]` Additional backend modules.** In addition to the modules above, create the following under `apps/api/src/modules/` (specified in [Section 14](#14-enhancement-addendum-new)):
>
> ```text
>       anomalies/
>         anomalies.controller.ts
>         anomalies.service.ts
>         anomalies.routes.ts
>         anomalyRules.ts
>       verification/
>         verification.orchestrator.ts     # signal-first L1-L4 escalation
>         connectors/
>           connector.interface.ts
>           epfo.mock.connector.ts
>           udyam.mock.connector.ts
>       identity/
>         identity.controller.ts
>         identity.service.ts
>         identity.routes.ts
>       reasons/
>         reasons.service.ts               # non-placement & attrition classifier
>         reasons.taxonomy.ts
>       skills/
>         skillGap.service.ts
>         advisoryReport.service.ts
>       equity/
>         equity.service.ts
>         adjustedScore.service.ts
>       incentives/
>         incentives.service.ts
> ```

### Frontend structure

```text
apps/web/
  src/
    components/
      ui/
      layout/
      forms/
    features/
      auth/
      trainee/
      provider/
      employer/
      admin/
      fieldOfficer/
    hooks/
    services/
      api.ts
      auth.ts
    pages/
      index.tsx
      claim-record.tsx
      login.tsx
      register.tsx
      trainee/
        dashboard.tsx
      provider/
        dashboard.tsx
        trainees.tsx
        outcomes.tsx
        reports.tsx
      employer/
        verify.tsx
      admin/
        dashboard.tsx
        anomaly-review.tsx
        providers.tsx
        courses.tsx
    types/
    utils/
  .env.example
  package.json
  tsconfig.json
  vite.config.ts
```

> **`[NEW]` Additional frontend pages.**
>
> ```text
>       admin/
>         equity.tsx
>         skill-gaps.tsx
>         data-quality.tsx
>         advisory-reports.tsx
>       provider/
>         scorecard.tsx
>       trainee/
>         opportunities.tsx
> ```

Provide all required configuration files, including `package.json`, TypeScript configs, Vite/Next config, Dockerfiles, Docker Compose, and environment examples.

---
## 4. Database Schema

Use Prisma and implement this schema. You may improve enum handling, relations, indexes, or validation, but preserve the same logical entities and fields.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  role          String   // admin, provider_admin, provider_staff, employer, field_officer, trainee
  profile       UserProfile?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("users")
}

model UserProfile {
  id             String   @id @default(uuid())
  userId         String   @unique
  user           User     @relation(fields: [userId], references: [id])
  name           String
  phonePrimary   String
  phoneSecondary String?
  district       String
  state          String
  languagePref   String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@map("user_profiles")
}

model Trainee {
  id               String   @id @default(uuid()) // Skill Outcome ID
  name             String
  gender           String
  dob              DateTime?
  category         String?
  phonePrimary     String
  phoneSecondary   String?
  email            String?
  district         String
  state            String
  pincode          String?
  consentStatus    String   // pending, granted, withdrawn
  consentTimestamp DateTime?
  enrolments       Enrolment[]
  outcomes         Outcome[]
  followups        OutcomeFollowup[]
  documents        Document[]
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@map("trainees")
}

model TrainingProvider {
  id           String   @id @default(uuid())
  name         String
  code         String   @unique
  district     String
  state        String
  contactName  String?
  contactPhone String?
  contactEmail String?
  isActive     Boolean  @default(true)
  courses      Course[]
  batches      Batch[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("training_providers")
}

model Course {
  id             String           @id @default(uuid())
  providerId     String
  provider       TrainingProvider @relation(fields: [providerId], references: [id])
  name           String
  code           String
  durationMonths Int
  sector         String?
  nsqfLevel      String?
  isActive       Boolean          @default(true)
  batches        Batch[]
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  @@map("courses")
}

model Batch {
  id          String           @id @default(uuid())
  courseId    String
  course      Course           @relation(fields: [courseId], references: [id])
  providerId  String
  provider    TrainingProvider @relation(fields: [providerId], references: [id])
  startDate   DateTime
  endDate     DateTime?
  status      String           // planned, ongoing, completed
  enrolments  Enrolment[]
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@map("batches")
}

model Enrolment {
  id                    String   @id @default(uuid())
  traineeId             String
  trainee               Trainee  @relation(fields: [traineeId], references: [id])
  batchId               String
  batch                 Batch    @relation(fields: [batchId], references: [id])
  enrolmentDate         DateTime
  status                String   // enrolled, completed, dropped_out, transferred
  attendancePercent     Float?
  assessmentScore       Float?
  certificateNumber     String?
  certificateIssuedDate DateTime?
  outcomes              Outcome[]
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@map("enrolments")
}

model Employer {
  id           String   @id @default(uuid())
  name         String
  contactName  String?
  contactPhone String?
  contactEmail String?
  district     String?
  state        String?
  sector       String?
  isVerified   Boolean  @default(false)
  outcomes     Outcome[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("employers")
}

model Outcome {
  id                  String             @id @default(uuid())
  traineeId           String
  trainee             Trainee            @relation(fields: [traineeId], references: [id])
  enrolmentId         String?
  enrolment           Enrolment?         @relation(fields: [enrolmentId], references: [id])
  outcomeType         String             // employed, self_employed, apprenticeship, studying, seeking_work, not_available, other
  outcomeDate         DateTime
  employerId          String?
  employer            Employer?          @relation(fields: [employerId], references: [id])
  jobRole             String?
  wageBandLow         Int?
  wageBandHigh        Int?
  isRelatedToTraining String?            // yes, no, unsure
  source              String             // trainee_self_report, employer_confirm, document, field_officer, ecosystem_signal
  trustScore          Int                @default(0)
  isVerified          Boolean            @default(false)
  verifiedAt          DateTime?
  verifiedBy          String?
  documents           Document[]
  followups           OutcomeFollowup[]
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  @@map("outcomes")
}

model OutcomeFollowup {
  id            String   @id @default(uuid())
  traineeId     String
  trainee       Trainee  @relation(fields: [traineeId], references: [id])
  outcomeId     String?
  outcome       Outcome? @relation(fields: [outcomeId], references: [id])
  scheduledDate DateTime
  actualDate    DateTime?
  status        String   // pending, completed, skipped, failed
  channel       String   // sms, whatsapp, ivr, call, field_visit
  responseData  Json?
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("outcome_followups")
}

model Document {
  id                 String   @id @default(uuid())
  traineeId          String
  trainee            Trainee  @relation(fields: [traineeId], references: [id])
  outcomeId          String?
  outcome            Outcome? @relation(fields: [outcomeId], references: [id])
  docType            String   // joining_letter, payslip, id_card, business_photo, invoice, udyam_cert, other
  fileUrl            String
  uploadedBy         String?
  uploadedAt         DateTime @default(now())
  verificationStatus String   // pending, verified, rejected
  verifiedBy         String?
  verifiedAt         DateTime?
  notes              String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@map("documents")
}

model ConsentRecord {
  id          String   @id @default(uuid())
  traineeId   String
  trainee     Trainee  @relation(fields: [traineeId], references: [id])
  consentType String   // follow_up_contact, employer_contact, document_upload, analytics, job_sharing
  status      String   // granted, withdrawn
  grantedAt   DateTime @default(now())
  withdrawnAt DateTime?
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("consent_records")
}

model AuditLog {
  id          String   @id @default(uuid())
  entityType  String   // trainee, outcome, employer, document, user
  entityId    String
  action      String   // create, update, delete, verify, flag
  performedBy String?
  performedAt DateTime @default(now())
  changes     Json
  ipAddress   String?
  createdAt   DateTime @default(now())

  @@map("audit_logs")
}
```

Include a seed script that creates:

- 1 admin user.
- 2-3 training providers.
- 4-6 courses.
- 6-10 batches.
- 30-50 trainees with enrolments.
- Outcomes representing employed, self-employed, and seeking-work trainees.
- A mix of pending and completed follow-ups.
- Example documents.

> **`[NEW]` Schema extensions.** The models below are **additive**. They do not alter any original model except where a relation field is explicitly listed. Implement them alongside the original schema. Prefer native Prisma `enum` types for status-like fields.
>
> ```prisma
> // ---------- Anomaly management ----------
> model AnomalyFlag {
>   id          String   @id @default(uuid())
>   ruleCode    String   // employer_bulk_confirm, identical_batch_details, placement_spike, multi_fulltime, duplicate_document
>   severity    String   // low, medium, high
>   status      String   // open, under_review, resolved, dismissed
>   reason      String
>   entityType  String   // outcome, employer, provider, document
>   entityId    String
>   outcomeId   String?
>   reviewedBy  String?
>   reviewNote  String?
>   createdAt   DateTime @default(now())
>   resolvedAt  DateTime?
>   updatedAt   DateTime @updatedAt
>
>   @@index([status, severity])
>   @@map("anomaly_flags")
> }
>
> // ---------- Persisted mock notifications ----------
> model NotificationLog {
>   id        String   @id @default(uuid())
>   channel   String   // sms, whatsapp, ivr, email
>   recipient String
>   payload   Json
>   status    String   // queued, sent_mock, responded, failed
>   followupId String?
>   createdAt DateTime @default(now())
>
>   @@map("notification_logs")
> }
>
> // ---------- Employer verification tokens ----------
> model VerificationToken {
>   id         String   @id @default(uuid())
>   outcomeId  String
>   employerId String?
>   tokenHash  String   @unique
>   otpHash    String?
>   expiresAt  DateTime
>   usedAt     DateTime?
>   attempts   Int      @default(0)
>   createdAt  DateTime @default(now())
>
>   @@map("verification_tokens")
> }
>
> // ---------- Signal-first verification trail ----------
> model VerificationAttempt {
>   id         String   @id @default(uuid())
>   outcomeId  String
>   level      Int      // 1 = authorized signal, 2 = one-tap confirm, 3 = automated follow-up, 4 = assisted
>   mechanism  String   // epfo_mock, udyam_mock, one_tap, whatsapp_bot, field_officer, micro_verifier
>   result     String   // confirmed, contradicted, inconclusive, no_response
>   confidence Float?   // 0..1
>   detail     Json?
>   createdAt  DateTime @default(now())
>
>   @@index([outcomeId])
>   @@map("verification_attempts")
> }
>
> // ---------- Cross-programme identity linking ----------
> model IdentityLink {
>   id            String   @id @default(uuid())
>   traineeId     String   // canonical Skill Outcome ID
>   sourceScheme  String   // e.g. PMKVY, DDU-GKY, NULM, STATE_X
>   sourceRefHash String   // salted hash of the scheme's own identifier
>   matchKeyHash  String   // salted hash of the composite matching key (never raw identifiers)
>   confidence    Float    // 0..1
>   status        String   // auto_linked, pending_review, confirmed, rejected
>   reviewedBy    String?
>   createdAt     DateTime @default(now())
>   updatedAt     DateTime @updatedAt
>
>   @@unique([sourceScheme, sourceRefHash])
>   @@index([matchKeyHash])
>   @@map("identity_links")
> }
>
> // ---------- Reasons (non-placement & attrition) ----------
> model OutcomeReason {
>   id           String   @id @default(uuid())
>   outcomeId    String
>   kind         String   // non_placement, attrition
>   category     String   // see taxonomy in Section 14.4
>   rawText      String?
>   confidence   Float?   // classifier confidence 0..1
>   needsReview  Boolean  @default(false)
>   reviewedBy   String?
>   createdAt    DateTime @default(now())
>
>   @@index([kind, category])
>   @@map("outcome_reasons")
> }
>
> // ---------- Skills & job relevance ----------
> model Skill {
>   id       String @id @default(uuid())
>   name     String @unique
>   category String?
>
>   @@map("skills")
> }
>
> model CourseSkill {
>   id       String @id @default(uuid())
>   courseId String
>   skillId  String
>
>   @@unique([courseId, skillId])
>   @@map("course_skills")
> }
>
> model OutcomeSkillRequirement {
>   id        String @id @default(uuid())
>   outcomeId String
>   skillId   String
>
>   @@unique([outcomeId, skillId])
>   @@map("outcome_skill_requirements")
> }
>
> // ---------- Advisory reports ----------
> model AdvisoryReport {
>   id          String   @id @default(uuid())
>   providerId  String?
>   period      String   // e.g. 2026-Q3
>   summary     Json
>   fileUrl     String?
>   generatedAt DateTime @default(now())
>   deliveredTo Json?
>
>   @@map("advisory_reports")
> }
>
> // ---------- Response incentives ----------
> model IncentiveLedger {
>   id        String   @id @default(uuid())
>   traineeId String
>   kind      String   // certificate_upgrade, priority_access, recharge_credit
>   reason    String   // e.g. followup_180_completed
>   status    String   // earned, redeemed, expired
>   createdAt DateTime @default(now())
>
>   @@map("incentive_ledger")
> }
> ```
>
> **Required relation/field additions to original models** (add via Prisma migration):
>
> | Model | Addition | Purpose |
> |---|---|---|
> | `Trainee` | `identityLinks IdentityLink[]` | Cross-programme linkage |
> | `Trainee` | `unreachableRisk Float?` | Predictive risk score (Section 14.10) |
> | `Outcome` | `employmentType String?` (`full_time`, `part_time`, `contract`, `gig`) | Finer employment taxonomy |
> | `Outcome` | `selfEmploymentType String?` (`business_owner`, `freelancer`, `independent_professional`, `family_enterprise`) | Self-employment detail |
> | `Outcome` | `apprenticeshipStage String?` (`started`, `completed`, `converted`) | Apprenticeship tracking |
> | `Outcome` | `verificationLevel Int?` | Highest signal-first level reached |
> | `Outcome` | `confidenceLabel String?` (`verified_signal`, `confirmed_trainee`, `self_reported`, `unconfirmed`) | Data coverage label |
> | `Outcome` | `exitReason String?` | Job exit reason where available |
> | `Trainee` | `disability Boolean?`, `ruralUrban String?` | Equity analytics inputs (collected only with consent) |
> | `Employer` | `verificationCount Int @default(0)` | Feeds anomaly rules |

---

## 5. Authentication and Authorization

Implement:

- `POST /api/auth/register` - Create a new user. For demo, allow self-registration; document that production should restrict it.
- `POST /api/auth/login` - Email and password returns JWT access and refresh tokens.
- `POST /api/auth/refresh` - Refresh the access token.
- `GET /api/users/me` - Get current user profile.
- `PUT /api/users/me` - Update current user profile.

JWT requirements:

- Access token expiry: approximately 15 minutes.
- Refresh token expiry: approximately 7 days.
- Use an appropriate secure storage pattern: httpOnly cookies preferred, or document the secure client storage approach.

Role permissions:

- `admin`: full access.
- `provider_admin`, `provider_staff`: only their provider's data.
- `employer`: only verification flows and trainees they have confirmed.
- `field_officer`: assigned trainees/outcomes requiring verification.
- `trainee`: only their own data.

> **`[NEW]` Authorization additions.**
>
> - Add `micro_verifier` as a seventh role: limited to assigned Level-4 verification tasks only, with no access to wage data and no bulk listing endpoints.
> - Prefer **httpOnly, `SameSite=Strict`, `Secure` cookies** for refresh tokens, and rotate the refresh token on every use with reuse detection.
> - Enforce **row-level scoping in the service layer** (for example `providerId` from the JWT), never trusting client-supplied identifiers for scoping.

---
## 6. API Design

Implement RESTful endpoints under `/api`. Include request validation with Zod or an equivalent library, consistent error responses, pagination where appropriate, and authorization checks on every protected route.


### 6.1 Trainees

- `POST /api/trainees`
- `GET /api/trainees` with filters: `providerId`, `batchId`, `district`, `search`
- `GET /api/trainees/:id`
- `PUT /api/trainees/:id`
- `POST /api/trainees/:id/claim-record`

Claim-record request body:

```json
{
  "name": "string",
  "courseCodeOrId": "string",
  "district": "string",
  "approximateCompletionYear": 2026,
  "phonePrimary": "string"
}
```

Logic: find likely matching trainee records and allow linking after an appropriate verification step.

> **`[NEW]` Trainee/identity endpoints.**
>
> - `POST /api/identity/link-candidates` - given a scheme name and a scheme-local identifier, return probable matches with confidence (see [14.3](#143-cross-programme-identity-linking)).
> - `GET /api/identity/review-queue` - borderline matches awaiting manual review (`admin`, `provider_admin`).
> - `POST /api/identity/:id/resolve` - body `{ "decision": "confirmed" | "rejected", "notes": "..." }`.
> - **Claim-record hardening:** never reveal whether a match exists until an OTP to the *registered* phone number is verified; return a uniform response for hit and miss; rate-limit by IP and by phone.

### 6.2 Providers, Courses, Batches, and Enrolments

Implement CRUD for:

- `/api/providers`
- `/api/courses`
- `/api/batches`
- `/api/enrolments`

Additional endpoint:

- `POST /api/enrolments/:id/complete`

This endpoint must:

- Set enrolment status to `completed`.
- Store certificate number and certificate issue date.
- Trigger initial outcome follow-up scheduling.

> **`[NEW]` Completion side-effects.** In addition to the behaviour above, `POST /api/enrolments/:id/complete` must also: (a) create the initial `Outcome` placeholder with `outcomeType = "other"` and `source = "trainee_self_report"` pending first response, (b) enqueue the signal-first verification orchestrator ([14.2](#142-signal-first-verification-orchestrator)), and (c) write an audit log entry.

### 6.3 Outcomes

- `POST /api/outcomes`
- `GET /api/outcomes` with filters: `traineeId`, `enrolmentId`, `outcomeType`, `providerId`, date range
- `GET /api/outcomes/:id`
- `PUT /api/outcomes/:id`
- `POST /api/outcomes/:id/verify`
- `POST /api/outcomes/:id/recalculate-trust-score`

Verify endpoint request body:

```json
{
  "verified": true,
  "notes": "Optional verification note"
}
```

Implement `trustScore.service.ts` with this logic:

- Base score by source:
  - `trainee_self_report`: 25
  - `employer_confirm`: 40
  - `document`: 30
  - `field_officer`: 35
  - `ecosystem_signal`: 30
- Add 20 if employer-confirmed and `isVerified = true`.
- Add 10 per verified document, maximum 20.
- Recency bonus:
  - Updated within 30 days: +15
  - Updated within 90 days: +10
  - Updated within 180 days: +5
- Add 10 when consistent with past outcomes.
- Subtract 15 when anomaly flags exist.
- Clamp the final score between 0 and 100.

Recalculate trust score on:

- Outcome creation or update.
- Document verification.
- Employer verification.
- Periodic cron job.

> **`[NEW]` Trust-score and outcome extensions.**
>
> - **Confidence label.** After each recalculation, set `Outcome.confidenceLabel` deterministically: `verified_signal` if an authorized/mock signal confirmed; `confirmed_trainee` if the trainee confirmed via one-tap or bot; `self_reported` if only free-text or form; otherwise `unconfirmed`.
> - **Explainability.** `POST /api/outcomes/:id/recalculate-trust-score` and `GET /api/outcomes/:id` must return a `trustBreakdown` array, for example `[{ "component": "employer_confirm_base", "points": 40 }, { "component": "recency_30d", "points": 15 }, { "component": "anomaly_penalty", "points": -15 }]`, so that every score is auditable and explainable in the UI.
> - **Contradiction handling.** If a higher-level signal contradicts a lower-level claim (for example an authorized signal shows no formal employment while the trainee claims it), do **not** overwrite; create an `AnomalyFlag` with `ruleCode = "signal_contradiction"` and lower the confidence label.
> - **Reasons.** `POST /api/outcomes/:id/reasons` records a non-placement or attrition reason ([14.4](#144-reason-classification-engine)).
> - **Tests.** Provide unit tests covering every scoring rule, including boundary conditions (day 30, 90, 180) and clamping at 0 and 100.

### 6.4 Employers

- `POST /api/employers`
- `GET /api/employers` with filters: `district`, `sector`, `search`
- `GET /api/employers/:id`
- `PUT /api/employers/:id`
- `POST /api/employers/:id/send-verification-link`

Request body:

```json
{
  "outcomeId": "uuid",
  "contactPhone": "string",
  "contactEmail": "string"
}
```

Logic:

- Generate a secure, expiring verification token.
- Store the token and expiry securely.
- Use the mock notification service to send a verification link and/or OTP.
- Implement a public verification endpoint used by the employer verification page.

> **`[NEW]` Employer verification hardening.**
>
> - Store only a **hash** of the verification token and OTP (`VerificationToken.tokenHash`, `otpHash`); never persist the raw values.
> - Tokens are single-use, expire (default 72 hours), and lock after 5 failed OTP attempts.
> - Public verification endpoints: `GET /api/public/verify/:token` (minimal masked context) and `POST /api/public/verify/:token`. Both are rate-limited and audit-logged.
> - Support a **QR-code payload** and a **missed-call/IVR-style mock** that resolves to the same token flow.
> - Increment `Employer.verificationCount` on each confirmation to feed anomaly rules ([Section 10](#10-anomaly-detection)).

### 6.5 Follow-ups

- `POST /api/followups/schedule`
- `GET /api/followups` with filters: `traineeId`, `status`, `channel`, date range
- `PUT /api/followups/:id`
- `POST /api/followups/:id/record-response`

Schedule request body:

```json
{
  "traineeId": "uuid",
  "enrolmentId": "uuid",
  "outcomeId": "uuid",
  "scheduleType": "post_training",
  "intervals": [30, 90, 180, 365]
}
```

Response-recording request body:

```json
{
  "responseData": {
    "stillEmployed": true,
    "wageBand": "15000-20000",
    "relevance": "yes"
  },
  "notes": "Optional note"
}
```

Logic:

- Create records with scheduled dates based on the interval.
- Mark response follow-ups as completed.
- Update or create an outcome where needed.
- Recalculate trust score.

Implement `followups.scheduler.ts`:

- Daily job finds follow-ups where `scheduledDate <= today` and `status = pending`.
- Check the relevant consent record before sending.
- Call mock SMS/WhatsApp/IVR notifications.
- Add a webhook endpoint:
  - `POST /api/webhooks/notifications/response`
  - Body: `{ "followupId": "uuid", "responseText": "YES" }`
- Parse mock responses and call the response-recording logic.

> **`[NEW]` Follow-up extensions.**
>
> - **Cadence configuration.** Store cadence per programme/course, not hard-coded. Default `[30, 90, 180, 365]` days; support an optional long-term checkpoint of `[540, 730]` days for long-term livelihood outcomes.
> - **Checkpoint content.** 30 days: employment status. 90 days: status, relevance, income band. 180 days: retention and income band. 365 days: retention, wage progression. 540-730 days: long-term livelihood status.
> - **Adaptive channel selection.** Try WhatsApp first; fall back to SMS, then IVR/voice, then assisted contact, according to trainee language, device signal, and prior response history.
> - **Structured bot flow.** The mock WhatsApp conversation is a short state machine (status → job type → wage band → relevance → reason if not employed) with regional-language message templates (at minimum English and Hindi, extensible).
> - **Idempotency.** Follow-up jobs must be idempotent and safe to retry; deduplicate by `(traineeId, scheduledDate, channel)`.
> - **Unreachable handling.** After N failed attempts across channels, set the outcome to `not_available` with reason `unable_to_contact` and escalate to Level 4 assisted verification.

### 6.6 Documents

- `POST /api/documents/upload`
- `GET /api/documents` with filters: `traineeId`, `outcomeId`, `docType`
- `PUT /api/documents/:id/verify`

For the upload endpoint:

- Accept `multipart/form-data`.
- Save files to local disk or MinIO for the prototype.
- Return a secure file reference or URL.
- Validate file types and file-size limits.

Verification request body:

```json
{
  "verificationStatus": "verified",
  "notes": "Document appears authentic"
}
```

> **`[NEW]` Document safeguards.**
>
> - Compute and store a **SHA-256 content hash** on upload to support duplicate-document anomaly detection.
> - Optional payslip OCR (behind a feature flag and explicit consent) to extract a wage band only; never store the full payslip text.
> - Strip EXIF/location metadata from images by default unless the trainee opts in.
> - Serve files only through **short-lived signed URLs** after an authorization check.

### 6.7 Consent

- `GET /api/consent?traineeId=...`
- `POST /api/consent`

Request body:

```json
{
  "traineeId": "uuid",
  "consentType": "follow_up_contact",
  "status": "granted",
  "notes": "Consent captured during registration"
}
```

Enforce consent checks before:

- Sending follow-up notifications.
- Contacting employers.
- Uploading or sharing sensitive evidence where applicable.

For the demo, analytics consent may be logged rather than blocking aggregate analytics, but explain this clearly and use anonymized data.

> **`[NEW]` Granular consent.**
>
> - Extend `consentType` with per-outcome-category purposes: `placement_tracking`, `employment_tracking`, `wage_tracking`, `self_employment_tracking`, `identity_linking`, `incentive_communications`.
> - Consent is **append-only**: every change creates a new `ConsentRecord`; the latest record per type is authoritative. History remains visible to the trainee.
> - Withdrawal must take effect immediately: cancel queued follow-ups for that purpose and exclude the trainee from wage analytics going forward.
> - Provide `GET /api/consent/history?traineeId=...` and a trainee-facing plain-language explanation of each purpose, in the trainee's preferred language.
> - **Compliance mapping.** Document in `docs/architecture.md` how the design maps to India's DPDP Act, 2023: purpose limitation, data minimisation, lawful basis per data category, withdrawal, and grievance contact. State clearly which items are prototype-only.

### 6.8 Analytics

Implement read-only endpoints:

- `GET /api/analytics/provider/:providerId`
- `GET /api/analytics/district/:district`
- `GET /api/analytics/course/:courseId`
- `GET /api/analytics/outcomes/summary`

Provider metrics must include:

- `total_enrolled`
- `total_completed`
- Placement rate overall and by outcome type
- `retention_3m`
- `retention_6m`
- `retention_12m`
- Median wage band at placement
- Wage progression at 6 and 12 months
- Training relevance percentage
- Average trust score
- Anomaly count

Return a frontend-friendly structure such as:

```json
{
  "metrics": {},
  "series": []
}
```

Allow useful filters such as date range, gender, category, district, sector, and course where appropriate.

> **`[NEW]` Analytics extensions.**
>
> - **Coverage label on every metric.** Each metric in the response must carry `{ "value": ..., "coverage": { "verifiedPct": ..., "confirmedPct": ..., "selfReportedPct": ..., "unconfirmedPct": ..., "followupCoveragePct": ... } }` so consumers can see how much of a number is verified versus estimated.
> - **Small-cell suppression.** For any aggregate with fewer than 10 records (configurable), suppress or bucket the value to prevent re-identification.
> - **Additional endpoints:**
>   - `GET /api/analytics/equity` - outcome gaps by gender, category, disability, rural/urban ([14.6](#146-equity-and-demographic-analytics)).
>   - `GET /api/analytics/skill-gaps` - aggregated skill gaps by course/provider/district ([14.5](#145-job-relevance-and-skill-gap-engine)).
>   - `GET /api/analytics/reasons` - distribution of non-placement and attrition reasons.
>   - `GET /api/analytics/provider/:providerId/scorecard` - provider and course-level scorecard with adjusted scoring ([14.7](#147-context-adjusted-provider-scorecard)).
>   - `GET /api/analytics/data-quality` - follow-up coverage and verification coverage by district/provider.
>   - `GET /api/analytics/advisory-reports` and `POST /api/analytics/advisory-reports/generate`.
> - **Performance.** Precompute heavy aggregates into materialised views or a rollup table refreshed by a job; add the indexes needed for the filter combinations above.

---
## 7. Frontend Requirements

Create an accessible, responsive application. Use a clean dashboard layout, loading and error states, form validation, empty states, confirmation dialogs for sensitive actions, and toast feedback for actions.

> **`[NEW]` Cross-cutting UX requirements.** WCAG 2.1 AA accessibility; mobile-first responsive layout (trainees are predominantly on low-end smartphones); **i18n from day one** with English and Hindi shipped and a language switcher persisted per user; low-bandwidth friendliness (lazy-loaded charts, small bundles); and plain-language copy for every consent and privacy screen.

### 7.1 Public Pages

- `/` - Landing page explaining the system, outcome tracking, privacy, and consent.
- `/claim-record` - Claim My Record form.
- `/login` - Email and password login.
- `/register` - Demo registration page.

> **`[NEW]` Landing page additions.** A short "How your data is used" explainer, a "Why we ask" section, and a visible grievance/contact link (DPDP alignment). The `/claim-record` flow must use OTP verification (see [6.1](#61-trainees)).

### 7.2 Trainee Portal

Route: `/trainee/dashboard`

Show:

- Basic profile.
- Training record: course, batch, provider, certificate.
- Current outcome with outcome type, verification status, and trust score.
- Follow-up timeline with past and upcoming entries.
- Uploaded documents and verification statuses.
- Consent settings and consent history.

Actions:

- Update outcome.
- Upload documents.
- Respond to a pending follow-up.
- Manage or withdraw consent.

> **`[NEW]` Trainee portal additions.**
>
> - **One-tap follow-up card**: "Are you currently employed? Yes / No / Update" as the primary action on the dashboard.
> - **Purpose-level consent toggles** with instant effect and history.
> - **Opportunities page** (`/trainee/opportunities`): nearby openings and apprenticeship listings shown only if `job_sharing` consent is granted; unemployed trainees at follow-up are shown this first. This gives trainees value in return for responding.
> - **Incentive wallet**: earned rewards (certificate upgrade, priority access, recharge credit) from completing follow-ups.
> - **"Why was I asked this?"** helper text next to every follow-up question.

### 7.3 Provider Portal

Routes:

- `/provider/dashboard`
- `/provider/trainees`
- `/provider/trainees/:id`
- `/provider/outcomes`
- `/provider/reports`

Provider dashboard:

- Metric cards: total trainees, completed trainees, placement rate, retention at 3/6/12 months, average trust score.
- Charts: placement by course, retention by course, wage progression, training relevance.

Trainee list:

- Search and filters.
- Columns: name, course, batch, outcome type, trust score, last follow-up status.

Trainee detail:

- Enrolment details.
- Outcomes timeline.
- Follow-ups.
- Documents.
- Consent records.
- Actions: complete enrolment, add/edit outcome, request field verification.

Outcomes page:

- Filtered outcome list.
- Export option.
- Bulk mark-for-verification action.

Reports page:

- Downloadable CSV and PDF reports for that provider.

> **`[NEW]` Provider portal additions.**
>
> - **Scorecard page** (`/provider/scorecard`) with provider-level and course-level drill-down, each metric paired with its coverage label ([14.7](#147-context-adjusted-provider-scorecard)).
> - **Skill-gap panel** per course (for example "trained on Python/SQL; jobs require Power BI").
> - **Non-placement and attrition reasons** chart.
> - **Follow-up coverage tracker** with a list of unreachable trainees and one-click "request assisted verification".
> - **Bulk CSV import** for enrolments with a validation report (row-level errors, duplicates detected).

### 7.4 Employer Portal

Route:

- `/employer/verify/:token`

Requirements:

- Public token-based page with expiry handling.
- Show minimum information necessary: partially masked trainee name, course, provider.
- Form fields:
  - Is the trainee employed? yes/no
  - Job role
  - Joining month/year
  - Wage band (optional)
- On submit, call backend verification endpoint and update the outcome and trust score.

Optional:

- `/employer/dashboard` for an employer user to view confirmed trainees.

> **`[NEW]` Employer portal additions.** The page must work on a low-end mobile browser and support the QR entry route. Show a clear expiry message for used or expired tokens, and never confirm or deny whether a trainee exists to unauthenticated visitors beyond the masked context.

### 7.5 Admin / Scheme Dashboard

Routes:

- `/admin/dashboard`
- `/admin/providers`
- `/admin/courses`
- `/admin/anomaly-review`

Dashboard capabilities:

- National, state, district, provider, course, and sector-level aggregates.
- Provider performance against a simple demo baseline.
- Anomaly summary.
- Data quality metrics, for example percentage of outcomes with employer confirmation.

Anomaly review:

- Flagged outcomes with reason(s), status, owner, and notes.
- Actions: mark reviewed, add review note, request re-verification.

> **`[NEW]` Admin dashboard additions.**
>
> - **Equity page** (`/admin/equity`): outcome gaps by gender, category, disability, rural/urban with confidence bounds ([14.6](#146-equity-and-demographic-analytics)).
> - **Skill-gaps page** (`/admin/skill-gaps`) and **advisory reports** (`/admin/advisory-reports`) with generate, preview, and download actions.
> - **Data-quality page** (`/admin/data-quality`): coverage heatmap by district and provider.
> - **Identity review queue** for borderline cross-programme matches.
> - **Global Trust badge** on every chart: verified / confirmed / self-reported / unconfirmed proportions.

### 7.6 Field Officer Portal

Route:

- `/field/officer/dashboard`

Show:

- Assigned trainees and outcomes that need field verification.
- Simple verification forms to record status, notes, evidence references, and visit date.

> **`[NEW]` Field officer additions.** Offline-first behaviour: cache the assigned task list, allow form completion without connectivity, and sync with conflict handling when back online. Also support the `micro_verifier` role with a reduced task view.

---

## 8. Background Jobs and Mock Notifications

Use Redis and Bull or an equivalent job queue.

Implement jobs:

- `scheduleFollowups`
- `sendFollowupMessages` daily job
- `recalculateTrustScores` weekly or on-demand job

Create `src/services/notification.service.ts` with:

```ts
sendSms({ to, message })
sendWhatsApp({ to, message })
sendIvr({ to, script })
sendEmail({ to, subject, body })
```

For prototype behavior:

- Log notifications to the console.
- Preferably persist mock notifications to a database table so they can be viewed in the UI or admin tools.
- Clearly isolate provider-specific code so it can later be replaced by Twilio, WhatsApp Business API, MSG91, Exotel, or another approved provider.

Webhook:

```text
POST /api/webhooks/notifications/response
```

Example request body:

```json
{
  "followupId": "uuid",
  "responseText": "YES"
}
```

Allow manual response simulation in the development environment.

> **`[NEW]` Job-queue and notification extensions.**
>
> - Add jobs: `runSignalChecks` (orchestrator, [14.2](#142-signal-first-verification-orchestrator)), `classifyReasons`, `computeSkillGaps`, `generateAdvisoryReports` (quarterly), `computeUnreachableRisk` (weekly), and `runAnomalyRules` (daily).
> - Use exponential backoff with a dead-letter queue and an admin-visible failed-job view.
> - Persist every mock message to `NotificationLog`; expose a dev-only "notification inbox" page so demos show messages arriving and replies being simulated.
> - Provide a `MockWhatsAppBot` conversation simulator (regional-language templates) that drives the multi-step follow-up flow end-to-end without any external service.
> - Add a pluggable `NotificationProvider` interface so that Twilio, Gupshup, MSG91, or Exotel adapters can be added without touching business logic.

---

## 9. Security, Privacy, and Audit

Implement the following:

- Password hashing with bcrypt or argon2.
- JWT verification middleware that attaches the authenticated user to the request.
- Role middleware for protected routes.
- Consent middleware for sensitive operations.
- Rate limiting for public auth, verification, and claim-record endpoints.
- Input validation and safe error handling.
- Upload validation for type and file size.
- Audit logging for:
  - Outcome creation, update, and verification.
  - Document uploads and verification.
  - Consent changes.
  - Employer verification requests.
  - User role changes.
  - Anomaly review actions.

Authorization constraints:

- Trainees can access only their own data.
- Providers can access only their own provider, courses, batches, trainees, enrolments, and outcomes.
- Employers can access only verification requests or permitted confirmed-trainee data.
- Admin users can access system-wide data and aggregates.
- Use anonymized, aggregated data for public or broad analytics views.

> **`[NEW]` Security hardening.**
>
> - Security headers (Helmet), strict CORS allow-list, CSRF protection for cookie-based flows, and request size limits.
> - Field-level encryption (AES-256-GCM, key from environment) for phone numbers and email at rest; keyed HMAC for lookups.
> - Structured, tamper-evident audit logs (hash-chained entries) and a read-only admin audit viewer.
> - Never log raw personal identifiers; mask phone numbers in logs and UI (`98******21`).
> - Automated dependency and secret scanning in CI; document threat model (STRIDE summary) in `docs/architecture.md`.
> - **Retention policy:** configurable retention windows; scheduled anonymisation of personal fields after the programme's tracking window closes or on consent withdrawal.

---

## 10. Anomaly Detection

Implement a pragmatic prototype anomaly engine. Persist anomaly flags in a suitable table or model; add schema fields/models as required.

Flag examples:

- An employer verifies an unusually large number of trainees in a short period.
- Multiple trainees in the same batch have identical job role, joining date, employer, and wage band.
- A provider reports a sudden placement spike just before evaluation.
- A trainee appears employed by multiple full-time employers simultaneously.
- The same document hash or file is reused across multiple trainees.

Requirements:

- Do not automatically reject outcomes.
- Create flags with a reason, severity, status, and related entity.
- Display them in the Admin Anomaly Review page.
- Deduct the anomaly component from the trust score only while relevant unresolved flags exist.

> **`[NEW]` Additional anomaly rules and workflow.**
>
> - `signal_contradiction`: an authorized/mock signal contradicts the trainee's or provider's claim.
> - `provider_outlier`: provider placement or verification rate is a statistical outlier relative to adjusted expectation ([14.7](#147-context-adjusted-provider-scorecard)).
> - `rapid_confirmation`: employer confirmations arrive faster than a human plausibly could, or from one device/IP.
> - `impossible_timeline`: job start date precedes course completion or falls in the future.
> - `cherry_picking_risk`: unusually high dropout among low-scoring trainees before the evaluation window.
> - Keep every rule **configurable** (thresholds in a config table) and **explainable** (each flag stores the evidence that triggered it).
> - Include a review workflow with statuses `open → under_review → resolved | dismissed`, SLA timers, and a per-flag notes thread.
> - Provide unit tests with fixtures that intentionally trigger each rule.

---

## 11. Deployment and Developer Experience

Provide a `docker-compose.yml` with these services:

- `postgres`
- `redis`
- `api`
- `web`

Provide `.env.example` files with at least:

```text
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
REDIS_URL=
NODE_ENV=
FRONTEND_URL=
BACKEND_URL=
UPLOAD_DIR=
```

Provide useful package scripts:

```text
dev
build
start
prisma:migrate
prisma:seed
test
lint
```

Create a high-quality `README.md` that includes:

- Project overview.
- Architecture summary.
- Tech stack.
- Local setup instructions.
- Docker setup instructions.
- Database migration and seed instructions.
- Demo credentials generated by the seed script.
- Test instructions.
- How mock notifications work.
- How to replace mock integrations with real SMS, WhatsApp, IVR, and file-storage providers.

Also create:

- `docs/architecture.md`
- `docs/api.md`
- `docs/data-model.md`

> **`[NEW]` Developer-experience additions.**
>
> - `Makefile` (or npm workspace scripts) with `make up`, `make seed`, `make test`, `make demo`.
> - Health endpoints `GET /health` and `GET /ready`; API documentation served at `/api/docs` (OpenAPI/Swagger generated from the Zod schemas).
> - GitHub Actions CI workflow: install, lint, type-check, test, build.
> - Seed script additions: sample non-placement/attrition reasons, skills and course-skill mappings, a few intentionally anomalous records, cross-programme duplicate trainees, and ecosystem-signal mock fixtures so every dashboard is populated on first launch.
> - A **`demo` script** that replays the hero flow described in [14.12](#1412-hero-demo-flow).

---

## 12. Implementation Order

Generate the code in this sequence:

1. Repository scaffolding:
   - Folder structure.
   - Package files.
   - TypeScript configuration.
   - Dockerfiles, Docker Compose, and `.env.example` files.

2. Backend:
   - Prisma schema, migrations, and seed script.
   - Auth module.
   - User module.
   - Provider, course, batch, and enrolment modules.
   - Trainee module, including Claim My Record.
   - Outcome module and trust score service.
   - Employer verification module.
   - Follow-up module, scheduler, queue, and mock notification service.
   - Document upload and verification module.
   - Consent module.
   - Analytics module.
   - Anomaly detection and review workflow.
   - Middleware, app wiring, logging, validation, and error handling.

3. Frontend:
   - Base layout, theme, router, API client, auth context, protected routes.
   - Login, registration, landing, and claim-record pages.
   - Trainee portal.
   - Provider portal.
   - Employer verification page.
   - Admin portal and anomaly review.
   - Field officer portal.
   - Forms, tables, charts, loading states, error states, and empty states.

4. Integration:
   - Wire frontend actions to APIs.
   - Trigger follow-up scheduling from enrolment completion.
   - Implement mock notification and response webhook flow.
   - Verify dashboard analytics against seed data.
   - Provide an end-to-end demo flow.

5. Documentation and tests:
   - Complete README and docs.
   - Add unit tests for trust-score and core service logic.
   - Add integration tests for login, enrolment completion, outcome creation, follow-up scheduling, and employer verification.

> **`[NEW]` Sequencing additions.** Insert the following into the order above: identity module and consent extensions immediately after step 2's trainee module; the verification orchestrator and mock connectors after the outcome module; reasons, skills, advisory, equity, and adjusted-score modules after analytics; and the i18n setup at the start of step 3.

---

## 13. Output Instructions

For every response while building this project:

1. First summarize assumptions in no more than 10 bullets.
2. Generate the code in logical chunks; begin with repository scaffolding and Docker setup.
3. For every file, show:
   - Full file path, for example `apps/api/prisma/schema.prisma`.
   - Complete file content.
4. Do not skip critical files. The code should be runnable after copying it into a new repository, installing dependencies, setting environment variables, migrating the database, and seeding it.
5. Keep explanations concise and prioritize complete, working code.
6. Do not use placeholder comments such as “implement later” for required core functionality.
7. If the full project cannot fit in one response, stop at a clean milestone and state exactly which files are complete and which prompt the user should send next to continue. Do not repeat completed files unnecessarily.
8. Use secure defaults and explain any prototype-only compromises.

Begin by generating **Milestone 1: repository scaffolding, Docker setup, backend and frontend package configuration, Prisma schema, and database seed script**.

> **`[NEW]` Quality gates for every milestone.** Each milestone must (a) compile with no TypeScript errors, (b) pass lint and unit tests, (c) list the exact commands to run it, and (d) end with a short "what is verified and what is not" note, so that no unverified behaviour is presented as working.

---

## 14. Enhancement Addendum `[NEW]`

This addendum specifies the capabilities that extend the original scope. It is **additive**: it introduces new features and never removes or overrides the requirements in Sections 1-13. Each subsection states the *purpose*, the *specification*, and the *demo-scope decision*, so that ambition is clear while remaining realistic for a prototype.

### 14.1 Design Principle

> **Verify passively → ask minimally → assist only when necessary.**
> Do not ask the trainee when the ecosystem can verify. Do not manually verify when a lightweight confirmation suffices.

Every feature below must respect this principle, since it is what makes the system both more reliable (multiple cross-checked signals) and lower-burden (automation absorbs most of the work).

### 14.2 Signal-First Verification Orchestrator

**Purpose.** Replace ad-hoc verification with a deterministic escalation ladder that resolves as many outcomes as possible with the least human effort.

| Level | Mechanism | Example | Effort |
|---|---|---|---|
| 1 | Authorized / mock ecosystem signal | EPFO-style formal-employment signal; Udyam/GST-style business-registration signal | None |
| 2 | One-tap confirmation to the trainee | "Are you currently employed? Yes / No / Update" | Minimal |
| 3 | Automated conversational follow-up | Structured WhatsApp bot flow, with SMS/IVR fallback | Low |
| 4 | Assisted verification | Training-centre staff, partner NGO, field officer, or micro-verifier call/visit | High |

**Specification.**

- Implement `verification.orchestrator.ts` as a state machine that advances an outcome from Level 1 to Level 4 **only** while it remains unresolved.
- Define a `SignalConnector` interface in `connectors/connector.interface.ts`:

  ```ts
  interface SignalConnector {
    name: string;
    check(input: { traineeId: string; consentedPurposes: string[] }): Promise<{
      result: 'confirmed' | 'contradicted' | 'inconclusive';
      confidence: number;              // 0..1
      evidence?: Record<string, unknown>;
    }>;
  }
  ```

- Ship `epfo.mock.connector.ts` and `udyam.mock.connector.ts` returning deterministic fixture data. **State explicitly** in code comments and `docs/architecture.md` that live access to such systems requires formal government data-sharing agreements; the prototype uses mocks with a documented integration path.
- Connectors must be **consent-gated** (run only for purposes the trainee has consented to) and **audit-logged**.
- Record every step in `VerificationAttempt`; set `Outcome.verificationLevel` to the highest level reached and feed the result into the trust score and confidence label.
- Combine signals with a simple **confidence model**, not just binary results: weight each attempt by mechanism reliability, and require agreement or higher-level dominance to mark an outcome verified.

**Demo scope.** Fully implemented with mocks; Levels 3-4 use the mock bot and the field-officer portal.

### 14.3 Cross-Programme Identity Linking

**Purpose.** Programmes use different identifiers; a trainee who passes through several schemes should converge to a single outcome history without any scheme adopting a new master ID.

**Specification.**

- Build a **matching key** from normalised inputs: mobile number, date of birth, and normalised name phonetics. Apply a **salted, keyed hash (HMAC)** per environment. **Never store or expose raw identifiers in the matching layer.**
- **Do not derive keys from Aadhaar or Aadhaar fragments.** Doing so raises legal and collision risks; the original requirement "No Aadhaar as primary identifier" stands, and this addendum extends it to matching. If a scheme supplies such a value, treat it as an opaque source reference and hash it into `IdentityLink.sourceRefHash` only.
- Score candidate pairs using **fuzzy comparison** (for example Jaro-Winkler on names, exact/tolerance on DOB, phone match, district match) and combine into a confidence in `[0, 1]`.
- Thresholds (configurable): `>= 0.90` auto-link; `0.65 - 0.90` queue for manual review; `< 0.65` no link.
- Provide a **trainee-initiated fallback**: the "Claim My Record" flow ([6.1](#61-trainees)) lets a trainee whose phone number changed prove ownership through another route, or request manual linking.
- Provide reversible linking: every merge is undoable and audit-logged; a wrongly merged record must be splittable without data loss.
- Cross-programme use of a trainee's data requires the `identity_linking` consent purpose.

**Demo scope.** Seed script includes deliberate near-duplicates across two mock schemes to demonstrate auto-link, review-queue, and rejection paths.

### 14.4 Reason Classification Engine

**Purpose.** The problem statement requires identifying reasons for **non-placement** and **attrition**. One engine, two taxonomies.

**Taxonomies (stored in `reasons.taxonomy.ts`, versioned).**

| Kind | Categories |
|---|---|
| `non_placement` | `skill_mismatch`, `lack_of_local_opportunities`, `salary_expectations`, `location_constraints`, `interview_performance`, `employer_rejection`, `lack_of_job_information`, `other` |
| `attrition` | `better_opportunity`, `low_salary`, `relocation`, `workplace_conditions`, `skill_mismatch`, `lack_of_career_growth`, `personal_reasons`, `other` |

**Specification.**

- Accept free text (any supported language) or a structured pick-list choice, and return `{ category, confidence }`.
- **Prototype implementation:** a keyword/rule-based classifier with a clean interface (`ReasonClassifier`) so that an ML or LLM-backed implementation can be swapped in later. If an LLM is used, send **no personal identifiers**, only the reason text.
- Confidence below a configurable threshold sets `needsReview = true` and routes to a human review queue; reviewer corrections are stored for future model improvement.
- Prefer capturing the reason through a **tap-to-select** option first (lower burden, higher data quality), falling back to free text.
- Aggregate outputs feed the skill-gap engine, the scorecards, and the advisory report.

### 14.5 Job Relevance and Skill-Gap Engine

**Purpose.** Convert anecdotes into structured curriculum feedback.

**Specification.**

- Maintain `Skill`, `CourseSkill` (skills taught), and `OutcomeSkillRequirement` (skills the job actually required, captured at placement or follow-up).
- For each outcome compute `relevanceScore = |taught ∩ required| / |required|` and identify `missingSkills = required \ taught`.
- Aggregate per course, provider, district, and quarter to obtain a ranked list of recurring gaps with **counts, share of affected trainees, and confidence**.
- Only flag a gap when the sample size meets a configurable minimum (avoid conclusions from a handful of records).
- Expose results through `GET /api/analytics/skill-gaps` and the `/admin/skill-gaps` page.

**Example.** Course trained on Python, SQL, ML; jobs require Python, SQL, Power BI → `missingSkills = [Power BI]`. Across a cohort this becomes: "Power BI missing in 41% of employed graduates, n = 86."

### 14.6 Equity and Demographic Analytics

**Purpose.** Meet the "demographic analytics" requirement in a way that supports policy action.

**Specification.**

- Break down placement, retention, and wage progression by **gender, category, disability, rural/urban, and district**, using only data the trainee consented to provide.
- Report **gaps relative to a reference group** with confidence intervals; never present a difference from a very small sample as fact.
- Add **intersectional views** (for example gender × rural/urban) where sample size allows; otherwise show "insufficient data".
- Provide targeted insight prompts, such as "Women complete training at parity but exit employment at 6 months at a higher rate", each linked to the underlying reason distribution.
- Apply small-cell suppression ([6.8](#68-analytics)) so that no view can identify an individual.

### 14.7 Context-Adjusted Provider Scorecard

**Purpose.** Ranking providers on raw placement rates penalises those serving disadvantaged areas and rewards cherry-picking. Provide fair, defensible comparison.

**Specification.**

- **Provider-level scorecard:** completion, employment, 6- and 12-month retention, wage progression, self-employment outcomes, job relevance, employer feedback, follow-up coverage.
- **Course-level drill-down:** the same indicators filtered to a single course, for example: *Completion 89% · Employment @6mo 67% · 12-mo retention 58% · Wage progression +18% · Job relevance 74% · Common gaps: SQL, Power BI · Outcome data coverage 82%.*
- **Adjusted score:** compute *observed versus expected* performance, where "expected" is estimated from local job-market indicators (district-level proxies), sector, and trainee demographic mix. Implementation for the prototype: a transparent regression or stratified-baseline approach in `adjustedScore.service.ts`, with the method documented in `docs/data-model.md`.
- Always display **raw and adjusted** values side by side, plus the **coverage label** for each number.
- Add a **confidence guardrail**: when follow-up coverage is below a configurable threshold, mark the provider score as "provisional" and do not rank it.

### 14.8 Outcome Trust Score and Data Coverage Labels (Extended)

The original 0-100 Trust Score stays exactly as specified in [6.3](#63-outcomes). This addendum adds:

- A **confidence label** per outcome: `verified_signal`, `confirmed_trainee`, `self_reported`, `unconfirmed`.
- A visible **coverage bar** on every aggregate metric and chart, showing the share of records in each label.
- An **explanation drawer** in the UI presenting the `trustBreakdown` for any outcome.

### 14.9 Response Incentive Layer

**Purpose.** Improve response rates, which directly improves data quality.

- Award **non-monetary** incentives for completed follow-ups: certificate upgrade, priority access to the next scheme cycle, or mobile-recharge credit (mock ledger only in the prototype).
- Record earnings in `IncentiveLedger`; require `incentive_communications` consent for reward messaging.
- **Guard against gaming:** incentives are earned only for consistent, non-contradicted responses and are capped per period.

### 14.10 Predictive Unreachability and Attrition Risk

**Purpose.** Enable proactive rather than reactive outreach.

- Compute `Trainee.unreachableRisk` in `[0, 1]` from early engagement signals: response latency, missed follow-ups, phone-number changes, channel failures, attendance, and assessment trend.
- **Prototype implementation:** a transparent logistic or weighted-score model with visible feature contributions; no opaque model. Retrain offline on seed data and document limitations.
- Use the score only to **prioritise outreach and assistance**, never to deny benefits or penalise a trainee. State this constraint in the UI and in `docs/architecture.md`.
- Include a short fairness check: monitor score distribution across demographic groups and flag disparities.

### 14.11 Micro-Verifier Network and Assisted Verification

**Purpose.** Cheaply and locally resolve the small share of cases stuck at Level 4.

- Add the `micro_verifier` role ([Section 5](#5-authentication-and-authorization)); tasks are assigned by district with a bounded, purpose-limited data view.
- Task lifecycle: `assigned → accepted → visited/called → evidence submitted → reviewed`.
- Double-check a random sample of micro-verifier results to deter fraud, and record verifier accuracy for weighting.

### 14.12 Hero Demo Flow

The system must support a smooth, repeatable end-to-end demonstration, driven by the `demo` script:

1. Trainee enrols and grants **purpose-level consent**.
2. Enrolment is completed → certificate issued → tracking begins.
3. **Level 1 mock signal** finds nothing conclusive → **Level 2** one-tap confirmation sent.
4. Trainee replies through the **mock WhatsApp bot**, including a wage band and a job-relevance answer with a missing skill.
5. Outcome appears with a **Trust Score, confidence label, and breakdown**.
6. An anomaly rule fires on a seeded suspicious batch and appears in the **Admin Anomaly Review** page.
7. Admin views the **coverage-labelled dashboard**, the **equity page**, and the **skill-gap panel**.
8. Admin generates the **Quarterly Curriculum Advisory Report** naming the recurring skill gap, affected courses, and the supporting data.

### 14.13 Advisory Report (Closed Feedback Loop)

- Generate a **Quarterly Curriculum Advisory Report** per provider and one consolidated report for scheme administrators.
- Contents: period, cohort size, coverage, top skill gaps with supporting counts, non-placement and attrition reason distribution, affected courses, adjusted scorecard summary, and concrete recommended actions.
- Deliver as **PDF and CSV**, store a reference in `AdvisoryReport`, and record delivery via the mock notification service.
- This is what turns analytics into a real deliverable and closes the loop: **train → track → verify → analyse → improve → retrain.**

### 14.14 Explicit Prototype Boundaries

State the following plainly in the README and `docs/architecture.md`, since honesty about scope is part of a credible system:

- All ecosystem signals (EPFO-style, Udyam/GST-style) are **mocks**; production requires formal data-sharing agreements.
- WhatsApp, SMS, and IVR are **simulated**; real providers plug in through `NotificationProvider`.
- Reason classification is rule-based in the prototype; ML/LLM is a documented upgrade path.
- Adjusted scoring uses simplified district proxies; production needs official labour-market data.
- A graph database is not required; the outcome history is modelled relationally and can migrate to a graph store when cross-programme volume warrants.
- Hosting for production must follow government-approved, compliant cloud requirements.

### 14.15 Roadmap (Documented, Not Built)

Voice IVR with multilingual speech-to-text; native mobile app; employer dashboard; separate training-provider analytics workspace beyond the built provider portal; integration with national skilling and credential systems (for example digital-credential and career portals); alumni/mentorship layer; and employer skill-demand forecasting from placement data.

---

## 15. Acceptance Criteria `[NEW]`

The build is considered complete when **all** of the following hold.

### Functional

- [ ] `docker compose up` starts PostgreSQL, Redis, API, and web with no manual steps beyond copying `.env.example`.
- [ ] Migration and seed produce a fully populated demo: admin login works and every dashboard shows data.
- [ ] A trainee can be enrolled, complete the course, receive the 30/90/180/365-day follow-up schedule, and respond via the mock bot.
- [ ] Trust score matches the specified formula for at least ten hand-verified fixtures, including boundary days and clamping.
- [ ] Withdrawing a consent purpose immediately stops related follow-ups and is reflected in analytics.
- [ ] Each anomaly rule is triggered by a seeded fixture and visible in the review page; flags never auto-reject outcomes.
- [ ] Employer link works once, expires, locks after repeated bad OTPs, and reveals only masked information.
- [ ] Identity linking demonstrates auto-link, manual-review, and rejection outcomes.
- [ ] Reason classification returns a category and confidence, and low-confidence items enter the review queue.
- [ ] Skill-gap and advisory report generate from seed data and download as PDF and CSV.

### Non-functional

- [ ] No raw tokens, OTPs, or passwords stored; sensitive fields encrypted at rest.
- [ ] Every protected route enforces role and row-level scoping; a trainee cannot read another trainee's data (verified by test).
- [ ] Every published aggregate carries a coverage label and respects small-cell suppression.
- [ ] Lint, type-check, unit tests, and integration tests pass in CI.
- [ ] Accessible (keyboard navigable, sufficient contrast) and usable at 360 px width.
- [ ] README lists prototype-only compromises and the path to production.

---

**Begin by generating Milestone 1: repository scaffolding, Docker setup, backend and frontend package configuration, Prisma schema (original models plus the additive `[NEW]` models), and the database seed script.**
