# Backend Implementation Plan
# Skill Outcome Tracking System — TrapRat / Kaushal Sankalp

> **Derived from:** `skill-outcome-tracker-master-prompt-v2.md` (v2.0) + analysis of existing React/Vite frontend in this repo.
> **Status:** Full implementation blueprint — ready for phased execution.

---

## Table of Contents

1. [Overview and Objectives](#1-overview-and-objectives)
2. [Tech Stack](#2-tech-stack)
3. [Repository and Folder Structure](#3-repository-and-folder-structure)
4. [Environment Variables](#4-environment-variables)
5. [Database Schema (Prisma)](#5-database-schema-prisma)
6. [Authentication and Authorization](#6-authentication-and-authorization)
7. [API Modules — Detailed Endpoints](#7-api-modules--detailed-endpoints)
8. [Trust Score Engine](#8-trust-score-engine)
9. [Anomaly Detection Engine](#9-anomaly-detection-engine)
10. [Signal-First Verification Orchestrator](#10-signal-first-verification-orchestrator)
11. [Background Jobs and Scheduler](#11-background-jobs-and-scheduler)
12. [Mock Notification Service](#12-mock-notification-service)
13. [Security, Privacy and Audit](#13-security-privacy-and-audit)
14. [Advanced Modules](#14-advanced-modules)
15. [Docker and Infrastructure Setup](#15-docker-and-infrastructure-setup)
16. [Frontend Backend Integration Map](#16-frontend-backend-integration-map)
17. [Phased Implementation Order](#17-phased-implementation-order)
18. [Acceptance Checklist](#18-acceptance-checklist)

---

## 1. Overview and Objectives

The backend serves the **TrapRat 360 / Kaushal Sankalp** Skill Outcome Intelligence Platform — a government-grade system that:

| # | Goal |
|---|------|
| 1 | Registers trainees with a unique **Skill Outcome ID** (KSL-YYYY-XXXXX) |
| 2 | Tracks full training lifecycle: provider > course > batch > enrolment > certification |
| 3 | Captures first post-training outcome: employed / self-employed / apprenticeship / studying / seeking_work / not_available / other |
| 4 | Schedules retention follow-ups at **30 / 90 / 180 / 365 days** (optionally 540 / 730 days) |
| 5 | Verifies outcomes through a 4-level signal-first escalation ladder |
| 6 | Computes a **Trust Score (0-100)** with explainable breakdown per outcome |
| 7 | Detects placement anomalies and flags them for human review |
| 8 | Provides role-based dashboards: trainee, provider, employer, field officer, admin |
| 9 | Enforces granular, revocable, purpose-level **consent** aligned to India DPDP Act 2023 |
| 10 | Classifies reasons for non-placement / attrition and generates quarterly curriculum advisory reports |

---

## 2. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Runtime | **Node.js 20 LTS** | Long-term support, wide ecosystem |
| Language | **TypeScript 5.x** | Type safety, matches frontend TS services already in repo |
| Framework | **Express 4** | Lightweight, flexible, well-understood |
| ORM | **Prisma 5** | Type-safe, migration-driven, excellent PostgreSQL support |
| Database | **PostgreSQL 16** | Relational integrity, JSON columns, full-text search |
| Cache / Queue | **Redis 7 + BullMQ** | Durable job queue with retry/DLQ |
| Auth | **JWT** (access 15 min + refresh 7 days) with **httpOnly cookies** | |
| Validation | **Zod** | Consistent with frontend (already uses Zod + RHF) |
| File Storage | **Local disk** (dev) / **MinIO** (Docker, production-compatible) | |
| API Docs | **Swagger / OpenAPI** auto-generated from Zod schemas via zod-to-openapi | |
| Testing | **Vitest** (unit) + **Supertest** (integration) | |
| Logging | **Pino** (structured JSON) | |
| Security | **Helmet**, **express-rate-limit**, **bcrypt**, **AES-256-GCM** field encryption | |
| CI | **GitHub Actions** | |

---

## 3. Repository and Folder Structure

```text
skill-outcome-tracker/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── env.ts
│   │   │   │   └── database.ts
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── trainees/
│   │   │   │   ├── providers/
│   │   │   │   ├── courses/
│   │   │   │   ├── batches/
│   │   │   │   ├── enrolments/
│   │   │   │   ├── outcomes/
│   │   │   │   │   └── trustScore.service.ts
│   │   │   │   ├── employers/
│   │   │   │   ├── followups/
│   │   │   │   │   └── followups.scheduler.ts
│   │   │   │   ├── documents/
│   │   │   │   ├── consent/
│   │   │   │   ├── analytics/
│   │   │   │   ├── anomalies/
│   │   │   │   │   └── anomalyRules.ts
│   │   │   │   ├── verification/
│   │   │   │   │   ├── verification.orchestrator.ts
│   │   │   │   │   └── connectors/
│   │   │   │   │       ├── connector.interface.ts
│   │   │   │   │       ├── epfo.mock.connector.ts
│   │   │   │   │       └── udyam.mock.connector.ts
│   │   │   │   ├── identity/
│   │   │   │   ├── reasons/
│   │   │   │   │   └── reasons.taxonomy.ts
│   │   │   │   ├── skills/
│   │   │   │   │   ├── skillGap.service.ts
│   │   │   │   │   └── advisoryReport.service.ts
│   │   │   │   ├── equity/
│   │   │   │   │   ├── equity.service.ts
│   │   │   │   │   └── adjustedScore.service.ts
│   │   │   │   └── incentives/
│   │   │   ├── middlewares/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── role.middleware.ts
│   │   │   │   ├── consent.middleware.ts
│   │   │   │   └── error.middleware.ts
│   │   │   ├── services/
│   │   │   │   └── notification.service.ts
│   │   │   ├── utils/
│   │   │   │   ├── logger.ts
│   │   │   │   ├── errors.ts
│   │   │   │   ├── trustScoreUtils.ts
│   │   │   │   ├── crypto.ts
│   │   │   │   └── idGenerator.ts
│   │   │   ├── app.ts
│   │   │   └── server.ts
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/   (existing React/Vite frontend)
├── infra/
│   ├── docker-compose.yml
│   └── .env.example
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── data-model.md
├── Makefile
└── README.md
```

---

## 4. Environment Variables

File: `apps/api/.env.example`

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/skill_outcome_db

# JWT
JWT_SECRET=change_me_to_32_char_random_string
JWT_REFRESH_SECRET=change_me_to_another_32_char_string
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Redis
REDIS_URL=redis://localhost:6379

# App
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:4000

# File storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10

# Field encryption (AES-256-GCM)
FIELD_ENCRYPTION_KEY=32_byte_hex_key_here
FIELD_HMAC_KEY=32_byte_hex_key_here

# Identity linking
IDENTITY_HMAC_SALT=unique_salt_per_environment

# Notification (mock)
MOCK_NOTIFICATIONS=true

# MinIO (optional for Docker)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=skill-outcome-docs

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10

# Anomaly thresholds (configurable)
ANOMALY_EMPLOYER_BULK_THRESHOLD=20
ANOMALY_PLACEMENT_SPIKE_DAYS=7
ANOMALY_RAPID_CONFIRM_MINUTES=5

# Identity linking thresholds
IDENTITY_AUTO_LINK_THRESHOLD=0.90
IDENTITY_REVIEW_THRESHOLD=0.65

# Small-cell suppression
ANALYTICS_MIN_CELL_SIZE=10

# Follow-up cadence (days, comma separated)
FOLLOWUP_CADENCE=30,90,180,365

# Advisory report cron
ADVISORY_REPORT_CRON=0 2 1 1,4,7,10 *
```

---

## 5. Database Schema (Prisma)

### 5.1 Enums

```prisma
enum Role {
  admin
  provider_admin
  provider_staff
  employer
  field_officer
  trainee
  micro_verifier
}

enum OutcomeType {
  employed
  self_employed
  apprenticeship
  studying
  seeking_work
  not_available
  other
}

enum ConsentType {
  follow_up_contact
  employer_contact
  document_upload
  analytics
  job_sharing
  placement_tracking
  employment_tracking
  wage_tracking
  self_employment_tracking
  identity_linking
  incentive_communications
}

enum ConsentStatus    { granted  withdrawn }
enum EnrolmentStatus  { enrolled completed dropped_out transferred }
enum VerificationStatus { pending verified rejected }
enum DocType {
  joining_letter
  payslip
  id_card
  business_photo
  invoice
  udyam_cert
  other
}
enum OutcomeSource {
  trainee_self_report
  employer_confirm
  document
  field_officer
  ecosystem_signal
}
enum AnomalySeverity  { low medium high }
enum AnomalyStatus    { open under_review resolved dismissed }
enum BatchStatus      { planned ongoing completed }
enum FollowupStatus   { pending completed skipped failed }
enum FollowupChannel  { sms whatsapp ivr call field_visit }
enum ConfidenceLabel  { verified_signal confirmed_trainee self_reported unconfirmed }
enum IncentiveKind    { certificate_upgrade priority_access recharge_credit }
enum IncentiveStatus  { earned redeemed expired }
```

### 5.2 Core Models

```prisma
model User {
  id           String      @id @default(uuid())
  email        String      @unique
  passwordHash String
  role         Role
  providerId   String?
  profile      UserProfile?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  @@map("users")
}

model Trainee {
  id               String    @id @default(uuid())
  skillOutcomeId   String    @unique
  name             String
  gender           String
  dob              DateTime?
  category         String?
  disability       Boolean?
  ruralUrban       String?
  phonePrimary     String    // AES-256-GCM encrypted at rest
  phoneSecondary   String?
  email            String?
  district         String
  state            String
  pincode          String?
  consentStatus    String    @default("pending")
  consentTimestamp DateTime?
  unreachableRisk  Float?
  enrolments       Enrolment[]
  outcomes         Outcome[]
  followups        OutcomeFollowup[]
  documents        Document[]
  consentRecords   ConsentRecord[]
  identityLinks    IdentityLink[]
  incentives       IncentiveLedger[]
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  @@index([district, state])
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
  courseSkills   CourseSkill[]
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
  status      BatchStatus      @default(planned)
  enrolments  Enrolment[]
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  @@map("batches")
}

model Enrolment {
  id                    String          @id @default(uuid())
  traineeId             String
  trainee               Trainee         @relation(fields: [traineeId], references: [id])
  batchId               String
  batch                 Batch           @relation(fields: [batchId], references: [id])
  enrolmentDate         DateTime
  status                EnrolmentStatus @default(enrolled)
  attendancePercent     Float?
  assessmentScore       Float?
  certificateNumber     String?
  certificateIssuedDate DateTime?
  outcomes              Outcome[]
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt
  @@map("enrolments")
}

model Employer {
  id                String    @id @default(uuid())
  name              String
  contactPhone      String?   // encrypted
  contactEmail      String?   // encrypted
  district          String?
  state             String?
  sector            String?
  isVerified        Boolean   @default(false)
  verificationCount Int       @default(0)
  outcomes          Outcome[]
  tokens            VerificationToken[]
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  @@map("employers")
}

model Outcome {
  id                  String             @id @default(uuid())
  traineeId           String
  trainee             Trainee            @relation(fields: [traineeId], references: [id])
  enrolmentId         String?
  enrolment           Enrolment?         @relation(fields: [enrolmentId], references: [id])
  outcomeType         OutcomeType
  outcomeDate         DateTime
  employerId          String?
  employer            Employer?          @relation(fields: [employerId], references: [id])
  jobRole             String?
  wageBandLow         Int?
  wageBandHigh        Int?
  isRelatedToTraining String?
  source              OutcomeSource
  trustScore          Int                @default(0)
  trustBreakdown      Json?
  isVerified          Boolean            @default(false)
  verifiedAt          DateTime?
  verifiedBy          String?
  verificationLevel   Int?
  confidenceLabel     ConfidenceLabel?
  employmentType      String?
  selfEmploymentType  String?
  apprenticeshipStage String?
  exitReason          String?
  documents           Document[]
  followups           OutcomeFollowup[]
  anomalyFlags        AnomalyFlag[]
  verificationAttempts VerificationAttempt[]
  verificationTokens  VerificationToken[]
  outcomeReasons      OutcomeReason[]
  skillRequirements   OutcomeSkillRequirement[]
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt
  @@index([traineeId])
  @@index([outcomeType, isVerified])
  @@map("outcomes")
}

model OutcomeFollowup {
  id            String          @id @default(uuid())
  traineeId     String
  trainee       Trainee         @relation(fields: [traineeId], references: [id])
  outcomeId     String?
  outcome       Outcome?        @relation(fields: [outcomeId], references: [id])
  scheduledDate DateTime
  actualDate    DateTime?
  status        FollowupStatus  @default(pending)
  channel       FollowupChannel
  responseData  Json?
  notes         String?
  notificationLogs NotificationLog[]
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  @@unique([traineeId, scheduledDate, channel])
  @@index([status, scheduledDate])
  @@map("outcome_followups")
}

model Document {
  id                 String             @id @default(uuid())
  traineeId          String
  trainee            Trainee            @relation(fields: [traineeId], references: [id])
  outcomeId          String?
  outcome            Outcome?           @relation(fields: [outcomeId], references: [id])
  docType            DocType
  fileUrl            String
  contentHash        String?
  uploadedBy         String?
  uploadedAt         DateTime           @default(now())
  verificationStatus VerificationStatus @default(pending)
  verifiedBy         String?
  verifiedAt         DateTime?
  notes              String?
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
  @@index([contentHash])
  @@map("documents")
}

model ConsentRecord {
  id          String        @id @default(uuid())
  traineeId   String
  trainee     Trainee       @relation(fields: [traineeId], references: [id])
  consentType ConsentType
  status      ConsentStatus
  grantedAt   DateTime      @default(now())
  withdrawnAt DateTime?
  notes       String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  @@index([traineeId, consentType])
  @@map("consent_records")
}

model AuditLog {
  id          String   @id @default(uuid())
  entityType  String
  entityId    String
  action      String
  performedBy String?
  performedAt DateTime @default(now())
  changes     Json
  ipAddress   String?
  prevHash    String?
  entryHash   String?
  createdAt   DateTime @default(now())
  @@index([entityType, entityId])
  @@map("audit_logs")
}
```

### 5.3 Extension Models

```prisma
model AnomalyFlag {
  id          String          @id @default(uuid())
  ruleCode    String
  severity    AnomalySeverity
  status      AnomalyStatus   @default(open)
  reason      String
  entityType  String
  entityId    String
  outcomeId   String?
  outcome     Outcome?        @relation(fields: [outcomeId], references: [id])
  reviewedBy  String?
  reviewNote  String?
  evidence    Json?
  slaDeadline DateTime?
  createdAt   DateTime        @default(now())
  resolvedAt  DateTime?
  updatedAt   DateTime        @updatedAt
  @@index([status, severity])
  @@map("anomaly_flags")
}

model NotificationLog {
  id         String   @id @default(uuid())
  channel    String
  recipient  String
  payload    Json
  status     String   @default("queued")
  followupId String?
  followup   OutcomeFollowup? @relation(fields: [followupId], references: [id])
  createdAt  DateTime @default(now())
  @@map("notification_logs")
}

model VerificationToken {
  id         String    @id @default(uuid())
  outcomeId  String
  outcome    Outcome   @relation(fields: [outcomeId], references: [id])
  employerId String?
  employer   Employer? @relation(fields: [employerId], references: [id])
  tokenHash  String    @unique
  otpHash    String?
  expiresAt  DateTime
  usedAt     DateTime?
  attempts   Int       @default(0)
  createdAt  DateTime  @default(now())
  @@map("verification_tokens")
}

model VerificationAttempt {
  id         String  @id @default(uuid())
  outcomeId  String
  outcome    Outcome @relation(fields: [outcomeId], references: [id])
  level      Int
  mechanism  String
  result     String
  confidence Float?
  detail     Json?
  createdAt  DateTime @default(now())
  @@index([outcomeId])
  @@map("verification_attempts")
}

model IdentityLink {
  id            String   @id @default(uuid())
  traineeId     String
  trainee       Trainee  @relation(fields: [traineeId], references: [id])
  sourceScheme  String
  sourceRefHash String
  matchKeyHash  String
  confidence    Float
  status        String
  reviewedBy    String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@unique([sourceScheme, sourceRefHash])
  @@index([matchKeyHash])
  @@map("identity_links")
}

model OutcomeReason {
  id          String   @id @default(uuid())
  outcomeId   String
  outcome     Outcome  @relation(fields: [outcomeId], references: [id])
  kind        String
  category    String
  rawText     String?
  confidence  Float?
  needsReview Boolean  @default(false)
  reviewedBy  String?
  createdAt   DateTime @default(now())
  @@index([kind, category])
  @@map("outcome_reasons")
}

model Skill {
  id            String                    @id @default(uuid())
  name          String                    @unique
  category      String?
  courseSkills  CourseSkill[]
  outcomeSkills OutcomeSkillRequirement[]
  @@map("skills")
}

model CourseSkill {
  id       String @id @default(uuid())
  courseId String
  course   Course @relation(fields: [courseId], references: [id])
  skillId  String
  skill    Skill  @relation(fields: [skillId], references: [id])
  @@unique([courseId, skillId])
  @@map("course_skills")
}

model OutcomeSkillRequirement {
  id        String  @id @default(uuid())
  outcomeId String
  outcome   Outcome @relation(fields: [outcomeId], references: [id])
  skillId   String
  skill     Skill   @relation(fields: [skillId], references: [id])
  @@unique([outcomeId, skillId])
  @@map("outcome_skill_requirements")
}

model AdvisoryReport {
  id          String   @id @default(uuid())
  providerId  String?
  period      String
  summary     Json
  fileUrl     String?
  generatedAt DateTime @default(now())
  deliveredTo Json?
  @@map("advisory_reports")
}

model IncentiveLedger {
  id        String          @id @default(uuid())
  traineeId String
  trainee   Trainee         @relation(fields: [traineeId], references: [id])
  kind      IncentiveKind
  reason    String
  status    IncentiveStatus @default(earned)
  createdAt DateTime        @default(now())
  @@map("incentive_ledger")
}
```

---

## 6. Authentication and Authorization

### Auth Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | Public | Create user |
| POST | /api/auth/login | Public | Returns JWT access + refresh cookie |
| POST | /api/auth/refresh | Cookie | Rotate refresh token |
| POST | /api/auth/logout | Auth | Invalidate refresh token |
| GET | /api/users/me | Auth | Current user profile |
| PUT | /api/users/me | Auth | Update profile |

### JWT Strategy

- Access token: 15m expiry, bearer header
- Refresh token: 7d expiry, httpOnly SameSite=Strict Secure cookie
- Refresh rotated on every use, reuse detection triggers full revocation

### Role Permissions Matrix

| Resource | admin | provider_admin | provider_staff | employer | field_officer | trainee | micro_verifier |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| All trainees | YES | Own provider | Own provider | NO | Assigned | Self only | Assigned task |
| Outcomes | YES | Own provider | Own provider | Verify only | Assigned | Self only | Assigned task |
| Analytics | YES | Own provider | Own provider | NO | NO | NO | NO |
| Providers CRUD | YES | Self only | Read | NO | NO | NO | NO |
| Anomaly review | YES | View | NO | NO | NO | NO | NO |
| Audit logs | YES | NO | NO | NO | NO | NO | NO |
| Wage data | YES | YES | YES | NO | NO | Self | NO |

> Row-level scoping enforced in service layer from JWT. Client-supplied IDs for scoping are never trusted.

---

## 7. API Modules — Detailed Endpoints

### 7.1 Trainees — /api/trainees

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | /api/trainees | admin, provider_admin | Register trainee; auto-generate skillOutcomeId (KSL-YEAR-NNNNN) |
| GET | /api/trainees | admin, provider | List: providerId, batchId, district, search, page, limit |
| GET | /api/trainees/:id | admin, provider, field, trainee(self) | Full detail |
| PUT | /api/trainees/:id | admin, provider | Update |
| POST | /api/trainees/:id/claim-record | Public | OTP-gated record claim |

**Claim-Record Flow:** Submit name + course + district + year + phone -> fuzzy search (no match disclosure) -> OTP to registered phone -> verify -> link account. Rate-limited: 5 req/15min by IP, 3 req/hour by phone.

### 7.2 Providers — /api/providers

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | /api/providers | admin | Create |
| GET | /api/providers | admin, provider | List |
| GET | /api/providers/:id | admin, provider | Detail |
| PUT | /api/providers/:id | admin, provider_admin | Update |
| GET | /api/providers/:id/stats | admin, provider | Quick stats |

### 7.3 Courses — /api/courses

| Method | Path | Roles |
|--------|------|-------|
| POST | /api/courses | admin, provider_admin |
| GET | /api/courses | All auth |
| GET | /api/courses/:id | All auth |
| PUT | /api/courses/:id | admin, provider_admin |

### 7.4 Batches — /api/batches

| Method | Path | Roles |
|--------|------|-------|
| POST | /api/batches | admin, provider_admin |
| GET | /api/batches | admin, provider |
| GET | /api/batches/:id | admin, provider |
| PUT | /api/batches/:id | admin, provider_admin |

### 7.5 Enrolments — /api/enrolments

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | /api/enrolments | admin, provider | Enrol trainee |
| GET | /api/enrolments | admin, provider | List |
| GET | /api/enrolments/:id | admin, provider, trainee(self) | Detail |
| PUT | /api/enrolments/:id | admin, provider | Update attendance/assessment |
| POST | /api/enrolments/:id/complete | admin, provider | Complete enrolment |
| POST | /api/enrolments/bulk-import | admin, provider_admin | CSV import with validation report |

**POST /api/enrolments/:id/complete side effects (DB transaction):**
1. Set status = completed, store certificateNumber + certificateIssuedDate
2. Create initial Outcome placeholder (outcomeType: other, source: trainee_self_report)
3. Schedule 30/90/180/365-day OutcomeFollowup records
4. Enqueue runSignalChecks BullMQ job
5. Write AuditLog entry

### 7.6 Outcomes — /api/outcomes

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | /api/outcomes | admin, provider | Create |
| GET | /api/outcomes | admin, provider | List with filters |
| GET | /api/outcomes/:id | admin, provider, trainee(self) | Full detail with trustBreakdown |
| PUT | /api/outcomes/:id | admin, provider, trainee(self) | Update |
| POST | /api/outcomes/:id/verify | admin, provider, field | Manual verification |
| POST | /api/outcomes/:id/recalculate-trust-score | admin | On-demand recalc with breakdown |
| POST | /api/outcomes/:id/reasons | admin, provider, trainee(self) | Record reason |

### 7.7 Employers — /api/employers

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | /api/employers | admin, provider | Create |
| GET | /api/employers | admin, provider | List |
| GET | /api/employers/:id | admin, provider, employer(self) | Detail |
| PUT | /api/employers/:id | admin, provider | Update |
| POST | /api/employers/:id/send-verification-link | admin, provider | Generate token + mock send |
| GET | /api/public/verify/:token | Public | Masked context, rate-limited |
| POST | /api/public/verify/:token | Public | Submit confirmation, rate-limited, OTP check |

**Security hardening:** SHA-256 token hash stored. bcrypt OTP hash stored. Single-use, 72h expiry, lock after 5 bad OTPs. Employer.verificationCount incremented. QR payload = same token URL. Full audit log.

### 7.8 Follow-ups — /api/followups

| Method | Path | Roles |
|--------|------|-------|
| POST | /api/followups/schedule | admin, provider |
| GET | /api/followups | admin, provider, trainee(self) |
| PUT | /api/followups/:id | admin, provider |
| POST | /api/followups/:id/record-response | admin, provider, trainee(self) |
| POST | /api/webhooks/notifications/response | Public HMAC-signed |

### 7.9 Documents — /api/documents

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | /api/documents/upload | admin, provider, trainee(self) | Multipart; validates type and size |
| GET | /api/documents | admin, provider, trainee(self) | List |
| GET | /api/documents/:id/signed-url | Auth | Short-lived signed URL |
| PUT | /api/documents/:id/verify | admin, provider, field | Verify or reject |

**Upload side-effects:** SHA-256 hash -> duplicate detection -> AnomalyFlag. Strip EXIF/GPS. Optional OCR (feature flag + consent). Recalculate trust score.

### 7.10 Consent — /api/consent

| Method | Path | Roles |
|--------|------|-------|
| GET | /api/consent | admin, provider, trainee(self) |
| POST | /api/consent | trainee, admin |
| GET | /api/consent/history | trainee, admin |

**Withdrawal takes effect immediately:** Cancel queued BullMQ follow-up jobs. Exclude from analytics.

### 7.11 Analytics — /api/analytics

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | /api/analytics/outcomes/summary | admin | System-wide funnel |
| GET | /api/analytics/provider/:id | admin, provider | Provider dashboard metrics |
| GET | /api/analytics/provider/:id/scorecard | admin, provider | Context-adjusted scorecard |
| GET | /api/analytics/district/:district | admin | District metrics |
| GET | /api/analytics/course/:id | admin, provider | Course metrics |
| GET | /api/analytics/equity | admin | Outcome gaps by demographics |
| GET | /api/analytics/skill-gaps | admin, provider | Curriculum gap analysis |
| GET | /api/analytics/reasons | admin, provider | Non-placement/attrition distribution |
| GET | /api/analytics/data-quality | admin | Coverage heatmap |
| GET | /api/analytics/advisory-reports | admin, provider | List reports |
| POST | /api/analytics/advisory-reports/generate | admin | Trigger quarterly report |

**Every metric carries a coverage object:**
```json
{
  "value": 78.4,
  "coverage": {
    "verifiedPct": 34,
    "confirmedPct": 28,
    "selfReportedPct": 26,
    "unconfirmedPct": 12,
    "followupCoveragePct": 79
  }
}
```

**Small-cell suppression:** n < ANALYTICS_MIN_CELL_SIZE returns null with "suppressed": true

### 7.12 Anomalies — /api/anomalies

| Method | Path | Roles |
|--------|------|-------|
| GET | /api/anomalies | admin |
| GET | /api/anomalies/:id | admin |
| PUT | /api/anomalies/:id/review | admin |
| POST | /api/anomalies/:id/request-reverification | admin |

### 7.13 Identity — /api/identity

| Method | Path | Roles |
|--------|------|-------|
| POST | /api/identity/link-candidates | admin, provider_admin |
| GET | /api/identity/review-queue | admin, provider_admin |
| POST | /api/identity/:id/resolve | admin, provider_admin |

### 7.14 Health and Docs

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Liveness check |
| GET | /ready | Readiness: DB + Redis ping |
| GET | /api/docs | Swagger UI (dev only) |

---

## 8. Trust Score Engine

File: `src/modules/outcomes/trustScore.service.ts`

### 8.1 Scoring Rules

```typescript
function calculateTrustScore(outcome, documents, anomalyFlags, previousOutcomes) {
  let score = 0;
  const breakdown = [];

  // BASE by source
  const basePoints = {
    trainee_self_report: 25,
    employer_confirm:    40,
    document:            30,
    field_officer:       35,
    ecosystem_signal:    30,
  }[outcome.source] ?? 0;
  score += basePoints;
  breakdown.push({ component: `${outcome.source}_base`, points: basePoints });

  // EMPLOYER VERIFICATION BONUS
  if (outcome.source === 'employer_confirm' && outcome.isVerified) {
    score += 20;
    breakdown.push({ component: 'employer_verified_bonus', points: 20 });
  }

  // DOCUMENT BONUS (max 20)
  const verifiedDocs = documents.filter(d => d.verificationStatus === 'verified').length;
  const docBonus = Math.min(verifiedDocs * 10, 20);
  if (docBonus > 0) {
    score += docBonus;
    breakdown.push({ component: 'verified_documents', points: docBonus });
  }

  // RECENCY BONUS
  const days = daysBetween(new Date(), outcome.updatedAt);
  if (days <= 30)       { score += 15; breakdown.push({ component: 'recency_30d',  points: 15 }); }
  else if (days <= 90)  { score += 10; breakdown.push({ component: 'recency_90d',  points: 10 }); }
  else if (days <= 180) { score += 5;  breakdown.push({ component: 'recency_180d', points:  5 }); }

  // CONSISTENCY BONUS
  if (previousOutcomes.length > 0 && isConsistentWithHistory(outcome, previousOutcomes)) {
    score += 10;
    breakdown.push({ component: 'consistent_history', points: 10 });
  }

  // ANOMALY PENALTY
  const openFlags = anomalyFlags.filter(f => f.status === 'open' || f.status === 'under_review');
  if (openFlags.length > 0) {
    score -= 15;
    breakdown.push({ component: 'anomaly_penalty', points: -15 });
  }

  // CLAMP 0-100
  score = Math.max(0, Math.min(100, score));
  return { score, breakdown };
}
```

### 8.2 Confidence Label

```typescript
function deriveConfidenceLabel(attempts, outcome) {
  if (attempts.some(a => a.level === 1 && a.result === 'confirmed')) return 'verified_signal';
  if (attempts.some(a => (a.level === 2 || a.level === 3) && a.result === 'confirmed')) return 'confirmed_trainee';
  if (outcome.source === 'trainee_self_report') return 'self_reported';
  return 'unconfirmed';
}
```

### 8.3 Recalculation Triggers

- Outcome created or updated
- Document verified or rejected
- Employer verification submitted
- Anomaly flag opened or resolved
- Weekly cron job `recalculateTrustScores`

---

## 9. Anomaly Detection Engine

File: `src/modules/anomalies/anomalyRules.ts`

### 9.1 Rule Catalogue

| Rule Code | Trigger Condition | Severity | Entity |
|---|---|---|---|
| employer_bulk_confirm | Employer confirms > THRESHOLD trainees in SPIKE_DAYS days | high | employer |
| identical_batch_details | 3+ trainees same batch share identical jobRole/joinDate/employer/wageBand | high | outcome |
| placement_spike | Provider weekly placement > 3x 12-week rolling average | medium | provider |
| multi_fulltime | Trainee has 2+ active full-time outcomes simultaneously | high | trainee |
| duplicate_document | Document SHA-256 hash matches existing doc from different trainee | medium | document |
| signal_contradiction | Level-1 mock signal contradicts trainee/provider claim | high | outcome |
| provider_outlier | Provider placement/verification > 2 std deviations above adjusted expectation | medium | provider |
| rapid_confirmation | Employer confirmations from same IP arrive < RAPID_CONFIRM_MINUTES apart | high | employer |
| impossible_timeline | Outcome start date precedes batch completion or is in the future | medium | outcome |
| cherry_picking_risk | Dropout rate of low-score trainees > 2x overall dropout in evaluation window | high | provider |

**All rules:** Store evidence JSON. Never auto-reject. Trust penalty only while open or under_review. All thresholds configurable.

### 9.2 Review Workflow

```
open -> under_review -> resolved
              |
           dismissed
```

SLA timer starts on creation. Every state change is audit-logged.

---

## 10. Signal-First Verification Orchestrator

File: `src/modules/verification/verification.orchestrator.ts`

### 10.1 Escalation Levels

| Level | Mechanism | Trigger |
|---|---|---|
| 1 | Authorized/mock ecosystem signal (EPFO, Udyam) | On outcome create |
| 2 | One-tap confirmation sent to trainee | Level 1 inconclusive |
| 3 | Automated WhatsApp bot / SMS / IVR | Level 2 no response in N days |
| 4 | Field officer or micro-verifier assignment | Level 3 failed after M attempts |

### 10.2 Connector Interface

```typescript
interface SignalConnector {
  name: string;
  check(input: {
    traineeId: string;
    consentedPurposes: string[];
  }): Promise<{
    result: 'confirmed' | 'contradicted' | 'inconclusive';
    confidence: number;
    evidence?: Record<string, unknown>;
  }>;
}
```

### 10.3 Mock Connectors (Prototype Only)

- **epfo.mock.connector.ts** — returns verified for employed trainees, inconclusive for self-employed
- **udyam.mock.connector.ts** — returns confirmed for Udyam-registered trainees
- NOTE: "Live EPFO/Udyam access requires formal government data-sharing agreements. These are prototype mocks."

### 10.4 Orchestrator Behavior

- Consent-gated: runs only for purposes trainee consented to
- Every step recorded in VerificationAttempt
- Outcome.verificationLevel set to highest level reached
- Confidence model: weighted average across mechanism reliability
- Contradiction: AnomalyFlag(signal_contradiction) created, confidence label lowered

---

## 11. Background Jobs and Scheduler

Queue: BullMQ on Redis 7

| Job Name | Trigger | Purpose |
|---|---|---|
| scheduleFollowups | On enrolment complete | Create OutcomeFollowup records |
| sendFollowupMessages | Daily 0 8 * * * | Send pending follow-ups |
| recalculateTrustScores | Weekly 0 2 * * 0 | Bulk recalculate all active outcomes |
| runSignalChecks | On outcome create + weekly | Run Level-1 connectors |
| classifyReasons | On reason submission | Auto-classify reasons |
| computeSkillGaps | Weekly | Aggregate skill gap analysis |
| generateAdvisoryReports | Quarterly cron | Generate PDF/CSV reports |
| computeUnreachableRisk | Weekly | Update Trainee.unreachableRisk |
| runAnomalyRules | Daily 0 1 * * * | Scan for anomaly patterns |

**Reliability:** Exponential backoff 1s/2s/4s/8s/16s/DLQ. All jobs idempotent. Follow-up jobs deduplicated by (traineeId, scheduledDate, channel) Prisma unique constraint.

---

## 12. Mock Notification Service

File: `src/services/notification.service.ts`

**Interface:**
```typescript
interface NotificationProvider {
  sendSms(to: string, message: string): Promise<void>;
  sendWhatsApp(to: string, message: string, templateId?: string): Promise<void>;
  sendIvr(to: string, script: string): Promise<void>;
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}
```

- Logs to Pino + persists to NotificationLog table
- MOCK_NOTIFICATIONS=true: all sends no-op with logged payloads
- Dev-only: /api/dev/notification-inbox shows all mock messages
- "Simulate reply" button calls POST /api/webhooks/notifications/response

**Mock WhatsApp Bot State Machine:**
```
START -> "Are you currently employed? [Yes] [No] [Update]"
  YES -> "Job type? [Full-time] [Part-time] [Gig]"
          -> "Wage band? [<10k] [10-15k] [15-20k] [20-25k] [25k+]"
              -> "Using training skills? [Yes] [Partly] [No]"
                  -> DONE
  NO  -> "Why did you leave? [Better opportunity] [Low salary] [Other]"
          -> DONE (record attrition reason)
```

Templates in English + Hindi. Pluggable NotificationProvider interface for Twilio, Gupshup, MSG91, Exotel.

---

## 13. Security, Privacy and Audit

### Security Layers

| Layer | Implementation |
|---|---|
| Password hashing | bcrypt cost 12 or argon2id |
| JWT signing | RS256 asymmetric keys |
| Transport | HTTPS enforced, strict HSTS |
| Headers | helmet(): CSP, X-Frame-Options |
| CORS | Strict allow-list from FRONTEND_URL |
| CSRF | csurf or double-submit cookie |
| Rate limiting | express-rate-limit; strict on /auth, /public/verify, /claim-record |
| Request size | express.json limit 10kb |
| Input validation | Zod schemas on every handler |
| Upload validation | MIME whitelist + magic-byte check + size limit |

### Field Encryption (AES-256-GCM)

Encrypted fields: Trainee.phonePrimary, phoneSecondary, email; Employer.contactPhone, contactEmail.
Lookup via keyed HMAC-SHA256 stored alongside encrypted value.

### Audit Log Design

- Every sensitive action creates AuditLog entry
- Hash-chain: entryHash = SHA256(prevHash + payload)
- Phone numbers masked in logs: 98******21
- Admin-only GET /api/audit-logs

**Actions logged:** outcome create/update/verify, document upload/verify, consent grant/withdraw, employer verification, user role change, anomaly review.

### Privacy and DPDP Act 2023

| Principle | Implementation |
|---|---|
| Purpose limitation | Each consent type maps to specific uses, enforced in middleware |
| Data minimisation | Wage bands not exact salary; no Aadhaar |
| Withdrawal | Immediate effect on queued jobs and analytics |
| Grievance contact | Visible on all consent screens |
| Retention | Configurable anonymisation schedule |

---

## 14. Advanced Modules

### 14.1 Reason Classification Engine

Taxonomies (versioned in reasons.taxonomy.ts):

| Kind | Categories |
|---|---|
| non_placement | skill_mismatch, lack_of_local_opportunities, salary_expectations, location_constraints, interview_performance, employer_rejection, lack_of_job_information, other |
| attrition | better_opportunity, low_salary, relocation, workplace_conditions, skill_mismatch, lack_of_career_growth, personal_reasons, other |

Prototype: keyword/rule-based ReasonClassifier interface (pluggable for ML/LLM).
Low confidence -> needsReview=true -> human queue. Outputs feed skill-gap engine and advisory reports.

### 14.2 Skill Gap Engine

- relevanceScore = |taught ∩ required| / |required|
- missingSkills = required minus taught
- Aggregated per course/provider/district/quarter
- Only flagged when sample >= ANALYTICS_MIN_CELL_SIZE
- Example: "Power BI missing in 41% of employed graduates, n=86"

### 14.3 Equity Analytics

- Breakdown by gender, category, disability, rural/urban, district
- Gaps relative to reference group with confidence intervals
- Intersectional views where sample allows
- Small-cell suppression throughout
- Only consent-provided demographic data used

### 14.4 Context-Adjusted Provider Scorecard

- Metrics: completion, employment, 6/12-month retention, wage progression, job relevance, follow-up coverage
- Adjusted score: transparent stratified-baseline regression (observed vs expected from district proxies)
- Raw + adjusted values shown side-by-side with coverage labels
- Provisional flag when follow-up coverage below threshold

### 14.5 Cross-Programme Identity Linking

- Matching key: HMAC of (normalised name phonetics + DOB + phone + district)
- No Aadhaar in matching layer
- Jaro-Winkler fuzzy matching; exact/tolerance on DOB and phone
- Thresholds: >= 0.90 auto-link, 0.65-0.90 review queue, < 0.65 no link
- Reversible: every merge audit-logged, wrongly merged records splittable
- Requires identity_linking consent

### 14.6 Predictive Unreachability

- Trainee.unreachableRisk (0..1) from: response latency, missed follow-ups, phone changes, channel failures, attendance, assessment trend
- Transparent weighted-score model
- Used only to prioritise outreach — NEVER to deny benefits
- Fairness check: score distribution monitored across demographic groups

### 14.7 Response Incentive Layer

- Non-monetary rewards: certificate_upgrade, priority_access, recharge_credit (mock ledger)
- Recorded in IncentiveLedger
- Requires incentive_communications consent
- Anti-gaming: capped per period, only for consistent non-contradicted responses

### 14.8 Micro-Verifier Network

- micro_verifier role: assigned tasks only, no wage data, no bulk listings
- Task lifecycle: assigned -> accepted -> visited -> evidence submitted -> reviewed
- Random sample double-check to deter fraud
- Verifier accuracy tracked for signal weighting

### 14.9 Advisory Report Generation

- Quarterly report per provider + consolidated admin report
- Contents: period, cohort size, coverage, top skill gaps, attrition reasons, scorecard summary, recommended actions
- PDF + CSV; stored in AdvisoryReport; mock notification delivery
- Closes feedback loop: train -> track -> verify -> analyse -> improve -> retrain

---

## 15. Docker and Infrastructure Setup

File: `infra/docker-compose.yml`

```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: skill_outcome_db
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports: ["9000:9000", "9001:9001"]
    volumes: [minio_data:/data]
  api:
    build: ../apps/api
    ports: ["4000:4000"]
    env_file: .env
    depends_on: [postgres, redis, minio]
  web:
    build: ../apps/web
    ports: ["5173:5173"]
    depends_on: [api]
volumes:
  postgres_data:
  minio_data:
```

File: `Makefile`

```makefile
up:
	docker compose -f infra/docker-compose.yml up -d
down:
	docker compose -f infra/docker-compose.yml down
migrate:
	cd apps/api && npx prisma migrate dev
seed:
	cd apps/api && npx prisma db seed
test:
	cd apps/api && npm test
lint:
	cd apps/api && npm run lint
demo:
	cd apps/api && npx ts-node src/scripts/demo.ts
```

---

## 16. Frontend Backend Integration Map

Existing frontend service files -> backend routes:

| Frontend Service | Function | Backend Route |
|---|---|---|
| api.ts | Axios base config | VITE_API_URL=http://localhost:4000 |
| auth.ts | login(), refresh() | POST /api/auth/login, POST /api/auth/refresh |
| traineeApi.ts | getTrainees(), getTrainee(id) | GET /api/trainees, GET /api/trainees/:id |
| providerApi.ts | getProvider() | GET /api/providers/:id |
| outcomeApi.ts | getOutcomes(), verifyOutcome() | GET /api/outcomes, POST /api/outcomes/:id/verify |
| followupApi.ts | getFollowups(), recordResponse() | GET /api/followups, POST /api/followups/:id/record-response |
| documentApi.ts | uploadDocument(), verifyDoc() | POST /api/documents/upload, PUT /api/documents/:id/verify |
| analyticsApi.ts | getSummary() | GET /api/analytics/outcomes/summary |
| adminApi.ts | getAnomalies(), reviewAnomaly() | GET /api/anomalies, PUT /api/anomalies/:id/review |
| employerApi.ts | sendVerificationLink() | POST /api/employers/:id/send-verification-link |

New service files to add:

| New File | Routes |
|---|---|
| consentApi.ts | /api/consent/* |
| identityApi.ts | /api/identity/* |
| skillGapApi.ts | /api/analytics/skill-gaps |
| equityApi.ts | /api/analytics/equity |
| reasonsApi.ts | /api/analytics/reasons |
| incentivesApi.ts | /api/incentives/* |

---

## 17. Phased Implementation Order

### Phase 1 — Foundation (Week 1)

- Repo scaffolding: folder structure, package.json, tsconfig.json, Docker files, .env.example
- Prisma schema: all models (core + extensions), first migration
- Seed script: 1 admin, 3 providers, 6 courses, 10 batches, 40 trainees, outcomes, documents, anomalies, identity near-duplicates
- Config: env.ts (Zod-parsed), database.ts (Prisma singleton)

Deliverable: `docker compose up && make seed` -> all tables populated

### Phase 2 — Auth and Core Modules (Week 2)

- Auth module: register, login, refresh, logout with httpOnly cookies and refresh rotation
- Users module: /api/users/me GET and PUT
- Middleware: auth, role, error
- Providers, Courses, Batches CRUD
- Enrolments CRUD + POST /complete with all side-effects
- Logger + error utilities

Deliverable: Admin can login, create providers/courses/batches, enrol trainees

### Phase 3 — Outcomes and Verification (Week 3)

- Trainees module: CRUD + claim-record (OTP mock)
- Trust Score service: all rules + breakdown + recalculation triggers
- Outcomes module: CRUD + verify + recalculate-trust-score
- Verification orchestrator: Level 1-4 state machine + EPFO/Udyam mock connectors
- Employer module: CRUD + verification link + public verify endpoints

Deliverable: Full outcome creation and trust score calculation end-to-end

### Phase 4 — Follow-ups and Notifications (Week 4)

- Follow-ups module: schedule, list, record-response, webhook
- Mock notification service with NotificationLog persistence
- Mock WhatsApp bot: multi-step state machine with English + Hindi templates
- BullMQ jobs: sendFollowupMessages, scheduleFollowups, recalculateTrustScores
- Notification inbox endpoint (dev-only)

Deliverable: Complete follow-up lifecycle: schedule -> notify -> respond -> update outcome

### Phase 5 — Documents and Consent (Week 5)

- Documents module: upload (multipart, EXIF strip, SHA-256 hash), signed URL, verify
- Consent module: grant/withdraw with immediate side-effects, history
- Consent middleware
- Anomaly rule: duplicate_document

Deliverable: Document upload works, consent withdrawal stops follow-ups immediately

### Phase 6 — Analytics and Anomalies (Week 6)

- Analytics module: all endpoints with coverage labels and small-cell suppression
- Anomaly engine: all 10 rules, runAnomalyRules job, review workflow, SLA timers
- Additional BullMQ jobs: runSignalChecks, runAnomalyRules
- Audit logs: hash-chained entries, admin viewer

Deliverable: Admin dashboard fully populated; anomalies visible and reviewable

### Phase 7 — Advanced Features (Week 7)

- Identity module: fuzzy matching, HMAC keys, auto-link / review queue / resolve
- Reasons engine: keyword classifier, taxonomy, low-confidence review queue
- Skill gap engine: relevance score, missing skills, aggregation
- Equity analytics: demographic breakdowns with suppression
- Context-adjusted scorecard: stratified baseline, raw vs adjusted
- Advisory report generation: PDF + CSV, mock delivery
- Incentive layer: ledger, consent gate, anti-gaming
- Predictive unreachability: weighted score model
- Micro-verifier role: task assignment, bounded data view

Deliverable: All 15 acceptance criteria met; every dashboard fully populated

### Phase 8 — Polish and CI (Week 8)

- OpenAPI/Swagger at /api/docs
- Unit tests: trust score (all rules + boundary + clamping), anomaly rules, reasons classifier
- Integration tests: auth, enrolment complete, outcome create, employer verify, consent withdrawal
- GitHub Actions CI: install, lint, type-check, test, build
- Demo script: replays hero demo flow
- Documentation: README, architecture.md, api.md, data-model.md
- Prototype boundary statements in README and architecture docs

Deliverable: `make test` passes; `make demo` runs hero flow end-to-end

---

## 18. Acceptance Checklist

### Functional

- [ ] docker compose up starts PostgreSQL, Redis, API, and web with no manual steps
- [ ] make seed populates every dashboard; admin login works
- [ ] Full trainee lifecycle: enrol -> complete -> follow-up schedule -> mock bot response
- [ ] Trust score matches formula for 10+ hand-verified fixtures including boundary days (30, 90, 180) and clamping at 0 and 100
- [ ] Withdrawing consent immediately stops follow-ups and excludes from analytics
- [ ] All 10 anomaly rules triggered by seeded fixtures; visible in review; never auto-reject
- [ ] Employer link: works once, expires, locks after 5 bad OTPs, shows only masked info
- [ ] Identity linking: demonstrates auto-link, manual-review, and rejection paths
- [ ] Reason classification: returns category + confidence; low-confidence routes to review queue
- [ ] Skill-gap and advisory reports generate from seed data; download as PDF and CSV

### Non-Functional

- [ ] No raw tokens, OTPs, or passwords stored; sensitive fields AES-256-GCM encrypted
- [ ] Every protected route enforces role + row-level scoping; trainee cannot read another trainee's data (verified by test)
- [ ] Every aggregate carries coverage label; small-cell suppression active (n < 10)
- [ ] Lint, type-check, unit tests, and integration tests pass in GitHub Actions CI
- [ ] WCAG 2.1 AA accessible; usable at 360 px width
- [ ] README lists all prototype-only compromises and the path to production

---

## Appendix A — Prototype Boundaries

| Boundary | Production Path |
|---|---|
| EPFO/Udyam signals are mocks | Formal data-sharing agreement required |
| WhatsApp/SMS/IVR simulated | Plug in NotificationProvider adapter (Twilio, Gupshup, MSG91, Exotel) |
| Reason classification keyword/rule-based | ML/LLM classifier via ReasonClassifier interface |
| Adjusted scoring uses district proxies | Official NSSO/PLFS/State Employment data |
| File storage is local disk/MinIO | AWS S3 or Government-approved object storage |
| Hosting is local Docker | Government-approved cloud or NIC infrastructure |

## Appendix B — Key Design Decisions

1. **Skill Outcome ID as primary identifier** — KSL-YYYY-XXXXX format, never Aadhaar
2. **Trust Score is explainable** — every score ships with trustBreakdown array
3. **Anomaly flags never auto-reject** — human review always required
4. **Consent is append-only** — full audit history; latest record per type is authoritative
5. **Row-level scoping in service layer** — provider/trainee IDs from JWT, never from client
6. **Hash-chain audit logs** — tamper-evident without a blockchain
7. **Small-cell suppression** — configurable min cell size (default 10) to prevent re-identification
8. **Mock-first, provider-pluggable** — all external services behind interfaces for easy swap

---

*Plan generated: 2026-09-26 | Based on: skill-outcome-tracker-master-prompt-v2.md v2.0 + TrapRat frontend codebase analysis*
