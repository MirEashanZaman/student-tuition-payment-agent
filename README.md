# Student Tuition Payment Agent
**FinTechathon 2026 | International Track — Topic C: Cross-Border & Student Finance Assistant**

> An autonomous AI-powered cross-border financial assistant built for international students paying foreign university tuition from Bangladesh (BDT). Engineered with strict **Permission Tiers**, a **Multi-Objective Route Optimization Engine**, **Proactive Deadline Warnings**, and **Hard Financial Safety Guardrails**.

---

## Key Highlights & Scoring Alignment

- **Task Completion (40%):** Complete end-to-end tuition settlement flow from natural language query (`"Pay my $3,000 tuition from BDT"`), corridor comparison, draft creation, to settlement confirmation and receipt generation.
- **Security & Compliance (30%):** Strict Tri-Tier Permission Model (`READ_ONLY`, `DRAFT`, `EXECUTE`). The autonomous LLM is strictly blocked from moving money unilaterally. Enforces 400,000 BDT per-transfer limit and 1,000,000 BDT daily limit in compiled backend code with tamper-evident audit logging.
- **Innovation & Interaction (30%):** Rich Next.js dark fintech interface with glassmorphism, interactive corridor comparison cards, explainable "Why I chose this route" breakdown, and urgent tuition deadline warnings.

---

## Monorepo Project Structure

```
├── backend/                   # NestJS Enterprise Backend API
│   ├── src/
│   │   ├── agent/             # Gemini LLM Service, Agent Tools, & Policy Guardrails
│   │   │   ├── guardrails/    # Permission tiers, financial limits, prompt injection filter
│   │   │   ├── tools/         # getBalance, compareRoutes, createDraft, confirmTransfer, getAuditLog
│   │   │   └── agent.service.ts
│   │   ├── database/          # PostgreSQL driver, migrations schema.sql, and seed scripts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/                  # Security & Compliance evaluation test suite (security.spec.ts)
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                  # Next.js 14 Interactive Web Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css    # Custom dark fintech design system & glassmorphism
│   │   │   ├── layout.tsx     # SEO metadata & viewport configuration
│   │   │   └── page.tsx       # Agent Chat Studio, Financial Dashboard, & Audit Inspector
│   │   ├── lib/api.ts         # Type-safe API client
│   │   └── types/             # TypeScript domain models
│   ├── Dockerfile
│   └── package.json
│
├── docs/                      # FinTechathon 2026 Official Deliverables
│   ├── TECHNICAL_DOCUMENTATION.md   # Architecture diagram, scoring math, lifecycle flow
│   ├── SECURITY_REPORT.md           # Permission tiers, limit enforcement, risk matrix
│   ├── PRESENTATION_DECK.md         # 10-minute pitch deck slides & speaker notes
│   ├── DEMO_SCRIPT.md               # 5-minute video demonstration script
│   └── EXECUTION_EVIDENCE.md        # Sandbox test execution logs with timestamps
│
├── docker-compose.yml         # One-command orchestration (PostgreSQL + Backend + Frontend)
├── .env.example               # Environment template (No secrets or real keys)
├── package.json               # Root scripts
└── README.md
```

---

## Prerequisites

- **Node.js**: v18.0.0 or higher (Tested on Node v20 & v24)
- **npm**: v9.0.0 or higher
- **Docker & Docker Compose**: (Optional, for single-command containerized run)

---

## Quick Start: One-Command Run

### Option 1: Using Docker Compose (Recommended for Production)

```bash
# Clone the repository
git clone <repository-url>
cd "Student Tuition Payment Agent"

# Copy environment variables
cp .env.example .env

# Spin up PostgreSQL, Backend, and Frontend with one command
docker compose up --build
```
Once started:
- **Frontend UI:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:3001](http://localhost:3001)
- **PostgreSQL Database:** `localhost:5432`

---

### Option 2: Running Locally (Development Mode)

The backend features an intelligent automatic fallback: if PostgreSQL is not running locally, it seamlessly uses an embedded in-memory sandbox store so you can test immediately without any database installation!

1. **Install and run Backend:**
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```
   *Backend starts at http://localhost:3001*

2. **In a separate terminal, install and run Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Frontend starts at http://localhost:3000*

---

## Running Security & Evaluation Tests

Run the full automated security test suite covering all FinTechathon requirements:

```bash
cd backend
npm test
```

### Verified Test Cases:
1. `should block a single transfer draft exceeding the per-transfer limit (400,000 BDT)` (PASSED)
2. `should block transfers that would breach the daily limit (1,000,000 BDT)` (PASSED)
3. `should forbid the automated LLM/agent from unilaterally executing confirmTransfer` (PASSED)
4. `should reject confirmation if user consent boolean is false` (PASSED)
5. `should successfully execute transfer when valid token and explicit user consent are provided` (PASSED)
6. `should rank routes using weighted multi-objective score and identify cheapest route` (PASSED)
7. `should flag deadline warnings when route arrival date exceeds tuition deadline` (PASSED)
8. `should write an audit log entry for every single agent action` (PASSED)
9. `should safely flag and neutralize prompt injection attempts without crashing` (PASSED)
10. `should handle invalid inputs and unexpected data formats gracefully` (PASSED)

---

## Seed Data & Demonstration Persona

The database automatically seeds an initial student persona, authentication credentials, and 4 mock remittance corridors:

- **Student ID:** `STU-2026-BDT01`
- **Student Name:** Tanvir Ahmed
- **Email:** `tanvir.student@fintechathon.org`
- **Default Password:** `student123` *(Hashed with Node.js scrypt)*
- **Role:** `STUDENT`
- **Initial Balance:** `850,000.00 BDT` (~$7,112 USD)
- **Daily Spending Limit:** `1,000,000.00 BDT`

### Authentication Endpoints:
- `POST /api/auth/login` — Authenticate credentials (`studentIdOrEmail`, `password`) and receive signed JWT
- `GET /api/auth/session` — Verify active JWT bearer token and retrieve student profile
- `POST /api/auth/logout` — Terminate session and record audit event
- `GET /api/auth/demo-credentials` — Quick sandbox demo credentials

### Mock Corridors:
| Provider | Inverse Rate | Fees | Speed | Reliability | Rating |
|---|---|---|---|---|---|
| **EduPay Prime** | 119.19 BDT/USD | 350 BDT + 0.15% | 24 Hours | 99% | Tier-1 Direct Clearing (Rank #1) |
| **SwiftWire Express** | 120.10 BDT/USD | 1,200 BDT + 0.35% | 4 Hours | 97% | Priority SWIFT gpi |
| **GlobalCampus Pay** | 119.80 BDT/USD | 600 BDT + 0.20% | 48 Hours | 94% | Licensed MTO |
| **National Bank Wire** | 121.50 BDT/USD | 2,500 BDT + 0.50% | 72 Hours | 89% | Legacy Commercial Bank |

---

## Environment Variables

See `.env.example` for details:
```env
# Server
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fintech_agent?schema=public

# AI Engine (Runs in offline sandbox mode if key is omitted)
GEMINI_API_KEY=mock_key_offline_agent
GEMINI_MODEL=gemini-1.5-flash

# Financial Safety Policy Guardrails
MAX_TRANSFER_LIMIT_BDT=400000
DAILY_TRANSFER_LIMIT_BDT=1000000
```
*(No real API keys or passwords are committed to the codebase).*

---

## Submission Deliverables Index

All 6 official FinTechathon submission documents are prepared in the repository:
1. **Technical Documentation:** [`docs/TECHNICAL_DOCUMENTATION.md`](file:///docs/TECHNICAL_DOCUMENTATION.md)
2. **Security Self-Assessment:** [`docs/SECURITY_REPORT.md`](file:///docs/SECURITY_REPORT.md)
3. **Presentation Deck Script:** [`docs/PRESENTATION_DECK.md`](file:///docs/PRESENTATION_DECK.md)
4. **Demo Video Script:** [`docs/DEMO_SCRIPT.md`](file:///docs/DEMO_SCRIPT.md)
5. **Execution Evidence:** [`docs/EXECUTION_EVIDENCE.md`](file:///docs/EXECUTION_EVIDENCE.md)
6. **Source Code & Tests:** [`backend/`](file:///backend) & [`frontend/`](file:///frontend)
