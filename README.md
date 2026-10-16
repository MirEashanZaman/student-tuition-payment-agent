# Student Tuition Payment Agent
**FinTechathon 2026 | International Track — Topic C: Cross-Border & Student Finance Assistant**

> An autonomous AI-powered cross-border financial assistant built for international students paying foreign university tuition from Bangladesh (BDT). Engineered with strict **Permission Tiers**, a **Multi-Objective Route Optimization Engine**, **Proactive Deadline Warnings**, and **Hard Financial Safety Guardrails**.

---

## Key Highlights & Scoring Alignment

- **Task Completion (40%):** Complete end-to-end tuition settlement flow from natural language query (`"Pay my $3,000 tuition from BDT"`), corridor comparison, draft creation, to settlement confirmation and receipt generation.
- **Security & Compliance (30%):** Strict Tri-Tier Permission Model (`READ_ONLY`, `DRAFT`, `EXECUTE`). The autonomous LLM is strictly blocked from moving money unilaterally. Enforces 400,000 BDT per-transfer limit and 1,000,000 BDT daily limit in compiled backend code with tamper-evident audit logging.
- **Innovation & Interaction (30%):** Rich Next.js dark fintech interface with glassmorphism, interactive corridor comparison cards, explainable "Why I chose this route" breakdown, and urgent tuition deadline warnings.

---

## Enterprise Architectural Patterns

| Feature | Pattern | How it is used |
|---|---|---|
| Route comparison and ranking | Strategy | Scoring classes for balanced, cheapest, fastest, and reliable (`RouteScoringStrategy`). Dynamic strategy swapping when user requests speed or cost priority. |
| Transfer lifecycle (draft, confirm, execute, fail) | State machine (a light Saga) | Statuses: pending -> confirmed -> executed. If execution fails, an automated compensating step releases reserved funds back to student account. |
| Safety checks (limits, confirmation, unusual amounts) | Chain of Responsibility | Small checks run in order: injection check, permission check, anomaly check, limit check, confirmation check. Any check can block and give an explicit reason. |
| The 5 agent tools exposed to the LLM | Facade | `AgentToolsService` hides the bank gateway, rates repository, safety guards, and audit services behind a simple interface. |
| LLM and mock bank | Dependency Inversion (the D in SOLID) | Code to interfaces like `ILlmClient` and `IBankGateway`. In tests fakes are swapped in without external dependencies. |
| Audit logging | Observer (NestJS events) | Services emit events like `transfer.confirmed`, and an audit listener writes the log. Safety and domain code stays free of logging code. |
| Database access | Repository | Repositories (`AccountRepository`, `RateRepository`, `TransferRepository`, `AuditRepository`) keep SQL and storage logic out of services. |
| Schema validation & HTTP transport | Contract & Transport | Zod enforces runtime schema contracts on tool inputs and API payloads; Axios provides type-safe HTTP communication with error handling and interceptors. |
| Services in general | SOLID, Singleton | NestJS providers are singletons by default with single responsibility isolation. |

---

## SOLID Principles Architecture

| Principle | Implementation in Project | Benefits |
|---|---|---|
| **S - Single Responsibility** | `TuitionCalculationService` isolates pure financial and deadline math; `AgentToolsService` acts solely as orchestrator; `PromptInjectionFilter` handles prompt threat analysis. | High testability, zero side-effects during financial calculations. |
| **O - Open / Closed** | `RouteScoringStrategy` permits adding strategies without changing existing code; `SafetyRuleEngine` allows registering arbitrary compliance rules dynamically. | New payment corridors, discount tiers, or sanctions checks plug in without refactoring. |
| **L - Liskov Substitution** | `IBankGateway` (mock and live clearing rails), `ILlmClient` (Gemini and offline sandbox), and repository implementations are completely interchangeable. | Full offline sandbox execution with zero network requirements for testing and evaluation. |
| **I - Interface Segregation** | Fine-grained interfaces: `IAccountReader` vs `IAccountWriter`, `IRateReader` vs `IRateWriter`, `ITransferReader` vs `ITransferWriter`, `IAuditReader` vs `IAuditWriter`. | Read-only consumers cannot accidentally mutate financial state. |
| **D - Dependency Inversion** | High-level modules depend on interface injection tokens (`ACCOUNT_REPOSITORY_TOKEN`, `RATE_REPOSITORY_TOKEN`, `TUITION_CALCULATOR_TOKEN`, etc.). | Complete decoupling of core business logic from database drivers and external AI APIs. |

---

## Monorepo Project Structure

```
├── backend/                   # NestJS Enterprise Backend API
│   ├── src/
│   │   ├── agent/             # Gemini LLM Service, Agent Tools, & Policy Guardrails
│   │   │   ├── guardrails/    # Permission tiers, financial limits, prompt injection filter
│   │   │   ├── tools/         # getBalance, compareRoutes, createDraft, confirmTransfer, getAuditLog
│   │   │   └── agent.service.ts
│   │   ├── auth/              # Scrypt password hashing, JWT service, guards & controller
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
- **Frontend UI:** [http://localhost:4567](http://localhost:4567)
- **Backend API:** [http://localhost:4568](http://localhost:4568)
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
   *Backend starts at http://localhost:4568*

2. **In a separate terminal, install and run Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Frontend starts at http://localhost:4567*

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
11. `should validate inputs using Zod schemas and reject malformed payloads` (PASSED)
12. `should verify accounts and settle transfers using Axios HTTP bank gateway` (PASSED)
13. `should hash password and verify with scrypt correctly` (PASSED)
14. `should reject login with wrong password and write an audit log entry` (PASSED)
15. `should successfully login with valid credentials and return JWT session` (PASSED)
16. `should decode and verify valid JWT session token` (PASSED)
17. `should reject expired or tampered JWT token` (PASSED)

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

## RESTful API Endpoints

The system implements complete RESTful HTTP operations using `@Param()`, `@Body()`, `@Query()`, `@Get()`, `@Post()`, `@Put()`, `@Patch()`, and `@Delete()`:

- `POST /api/chat` - Natural language query processing (`@Body()`)
- `GET /api/accounts/:id` - Fetch student account balance & limits (`@Param('id')`)
- `PUT /api/accounts/:id/limits` - Update student daily limit (`@Param('id')`, `@Body()`)
- `POST /api/accounts/:id/deposit` - Deposit funds to student account (`@Param('id')`, `@Body()`)
- `GET /api/rates` - Remittance corridor rates with query filtering (`@Query('activeOnly')`, `@Query('targetCurrency')`)
- `GET /api/rates/:id` - Remittance corridor rate by ID (`@Param('id')`)
- `PUT /api/rates/:id` - Update remittance corridor rate or status (`@Param('id')`, `@Body()`)
- `DELETE /api/rates/:id` - Deactivate corridor rate (`@Param('id')`)
- `POST /api/routes/compare` - Compare remittance corridors with multi-objective scoring (`@Body()`)
- `GET /api/transfers` - List student transfers with status filtering (`@Query('studentId')`, `@Query('status')`)
- `GET /api/transfers/:id` - Transfer details by ID (`@Param('id')`)
- `POST /api/transfers/draft` - Create pending transfer draft (`@Body()`)
- `PUT /api/transfers/:id` - Update draft recipient before confirmation (`@Param('id')`, `@Body()`)
- `PATCH /api/transfers/:id` - Partial update of unconfirmed transfer draft (`@Param('id')`, `@Body()`)
- `DELETE /api/transfers/:id` - Discard transfer draft (`@Param('id')`)
- `POST /api/transfers/:id/confirm` - User-consented transfer execution (`@Param('id')`, `@Body()`)
- `POST /api/transfers/:id/compensate` - Saga compensating transaction rollback (`@Param('id')`, `@Body()`)
- `POST /api/transfers/:id/cancel` - Cancel transfer draft (`@Param('id')`)
- `GET /api/audit` - Immutable audit logs with tier and status filtering (`@Query('limit')`, `@Query('tier')`, `@Query('status')`)
- `GET /api/audit/:id` - Fetch specific audit log by ID (`@Param('id')`)
- `DELETE /api/audit/:id` - Remove audit log record (`@Param('id')`)
- `POST /api/sandbox/reset` - Reset sandbox database
- `GET /api/sandbox/export-logs` - Export full audit records archive

---

## Environment Variables

See `.env.example` for details:
```env
# Server
PORT=4568
FRONTEND_URL=http://localhost:4567

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

## Automated CI/CD Pipeline

The project features a GitHub Actions workflow (`.github/workflows/ci.yml`) triggering on pushes and pull requests to `main` and `Eashan`:

1. **Backend CI**: Automated dependency resolution (`npm ci`), Jest test suite execution (22/22 tests passing), and NestJS production build.
2. **Frontend CI**: Dependency installation and Next.js static and server optimization build.
3. **Docker Verification**: Builds multi-stage Docker images for both services to ensure container reproducibility.
4. **Security & Cleanliness**: Automated Node.js audit ensuring zero exposed secrets and code policy compliance.
5. **Deployment Verification**: Verifies Docker Compose and environment manifests for deployment.

---

## Submission Deliverables Index

All 6 official FinTechathon submission documents are prepared in the repository:
1. **Technical Documentation:** [`docs/TECHNICAL_DOCUMENTATION.md`](file:///docs/TECHNICAL_DOCUMENTATION.md)
2. **Security Self-Assessment:** [`docs/SECURITY_REPORT.md`](file:///docs/SECURITY_REPORT.md)
3. **Presentation Deck Script:** [`docs/PRESENTATION_DECK.md`](file:///docs/PRESENTATION_DECK.md)
4. **Demo Video Script:** [`docs/DEMO_SCRIPT.md`](file:///docs/DEMO_SCRIPT.md)
5. **Execution Evidence:** [`docs/EXECUTION_EVIDENCE.md`](file:///docs/EXECUTION_EVIDENCE.md)
6. **Source Code & Tests:** [`backend/`](file:///backend) & [`frontend/`](file:///frontend)
