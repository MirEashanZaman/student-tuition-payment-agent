# Student Tuition Payment Agent
**FinTechathon 2026 | International Track — Topic C: Cross-Border & Student Finance Assistant**

> An autonomous AI-powered cross-border financial assistant built for international students paying foreign university tuition from Bangladesh (BDT). Engineered with strict **Permission Tiers**, a **Multi-Objective Route Optimization Engine**, **Proactive Deadline Warnings**, and **Hard Financial Safety Guardrails**.

---

## Key Highlights & Scoring Alignment

- **Task Completion (40%):** Complete end-to-end tuition settlement flow from natural language query (`"Pay my $3,000 tuition from BDT"`), corridor comparison, draft creation, to settlement confirmation and receipt generation.
- **Security & Compliance (30%):** The API defines and enforces `READ_ONLY`, `DRAFT`, and `EXECUTE` permission tiers, with ownership checks on account and transfer records. The autonomous LLM is blocked from moving money unilaterally. The backend enforces transfer and daily limits and records application audit events.
- **Innovation & Interaction (30%):** Rich Next.js dark fintech interface with glassmorphism, interactive corridor comparison cards, explainable "Why I chose this route" breakdown, and urgent tuition deadline warnings.

---

## Advanced Faculty-Recommended Features

1. **Salt & Scrypt Password Security:** User credentials are protected using a 16-byte cryptographically secure random salt and the `scrypt` key derivation function (64-byte key length), verified via `crypto.timingSafeEqual` to prevent side-channel timing attacks.
2. **SHA-256 Transaction Fingerprinting:** Every confirmed tuition transfer generates a SHA-256 integrity checksum recorded in the append-only audit trail and rendered on the certificate.
3. **Official PDF Tuition Payment Certificate:** Built with a pure TypeScript PDF 1.4 vector generator ([pdf-generator.ts](frontend/src/lib/pdf-generator.ts)) providing downloadable and printable A4 certificates with verification URL and integrity checksum.
4. **Smart Tuition Installment Planner:** Formulates 2- or 3-part split payment milestones ([tuition-calculation.service.ts](backend/src/agent/services/tuition-calculation.service.ts)) ensuring each settlement strictly respects the 400,000 BDT per-transfer limit and course registration deadlines.
5. **Sandbox Card Deposit & Top-Up Modal:** Interactive virtual credit card modal allowing students to top up account balances using test card numbers (`4242 4242 4242 4242`) with automatic card number masking (`**** **** **** 4242`) in the audit log.
6. **Step-Up 2FA & Dynamic OTP Verification:** Financial settlements (`EXECUTE` tier) enforce mandatory step-up 2FA verification using a 6-digit time-sensitive one-time PIN (OTP) issued dynamically (`POST /api/auth/step-up-otp`) and validated alongside the single-use one-time confirmation token, preventing automated or hijacked fund debits.

> [!NOTE]
> **Sandbox Evaluation Notice:** All remittance corridors, foreign exchange rates, mock bank clearing gateways, and account balances run in a simulated sandbox environment for demonstration and algorithmic evaluation (not connected to live production SWIFT rails or real currency).

---

## Architectural Design Patterns

| Feature | Pattern | How it is used |
|---|---|---|
| Route comparison and ranking | Strategy | Scoring classes for balanced, cheapest, fastest, and reliable (`RouteScoringStrategy`). Dynamic strategy swapping when user requests speed or cost priority. |
| Transfer lifecycle (draft, confirm, execute, fail) | State machine (a light Saga) | Statuses: pending -> confirmed -> executed -> settled. Authenticated student owners can trigger atomic, idempotent saga rollback for confirmed or executed transfers to restore balances. |
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
├── backend/                   # NestJS Hardened Backend API
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
├── frontend/                  # Next.js 14 Interactive Web Application (Hybrid SSG/CSR)
│   ├── src/
│   │   ├── app/
│   │   │   ├── chat/          # Agent Chat Studio (CSR)
│   │   │   ├── dashboard/     # Financial Dashboard & Ledgers (CSR)
│   │   │   ├── audit/         # Audit & Safety Log Inspector (CSR)
│   │   │   ├── login/         # Student Authentication (CSR)
│   │   │   ├── faq/           # How It Works & Security FAQ (SSG)
│   │   │   ├── globals.css    # Custom dark fintech design system & glassmorphism
│   │   │   ├── layout.tsx     # SEO metadata & viewport configuration
│   │   │   └── page.tsx       # Home Overview & Interactive App Root (SSG)
│   │   ├── lib/api.ts         # Type-safe API client
│   │   └── types/             # TypeScript domain models
│   ├── Dockerfile
│   └── package.json
│
├── docs/                      # FinTechathon 2026 Official Deliverables
│   ├── TECHNICAL_DOCUMENTATION.pdf  # Primary official submission technical documentation (rendered PDF)
│   ├── TECHNICAL_DOCUMENTATION.md   # Markdown source: architecture, scoring math, lifecycle flow
│   ├── SECURITY_REPORT.md           # Permission tiers, limit enforcement, risk matrix
│   ├── PRESENTATION_DECK.md         # 10-minute pitch deck slides & speaker notes
│   ├── FINTECHATHON_2026_PRESENTATION.pptx # Primary official presentation slide deck
│   ├── DEMO_SCRIPT.md               # 5-minute video demonstration script
│   ├── EXECUTION_EVIDENCE.md        # Sandbox test execution logs with timestamps
│   ├── execution-evidence.json      # Raw sandbox audit log export
│   └── LICENSE                      # Open-source MIT License document copy
│
├── docker-compose.yml         # One-command orchestration (PostgreSQL + Backend + Frontend)
├── .env.example               # Environment template (No secrets or real keys)
├── LICENSE                    # Root repository MIT License
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

### Option 1: Using Docker Compose (Hardened Sandbox)

Run directly with no manual edits required (`.env.example` supplies pre-configured sandbox defaults):

```bash
git clone https://github.com/MirEashanZaman/student-tuition-payment-agent.git
cd student-tuition-payment-agent
cp .env.example .env
docker compose up --build
```
Once started:
- **Frontend UI:** [http://localhost:4567](http://localhost:4567)
- **Backend API:** [http://localhost:4568](http://localhost:4568)
- **PostgreSQL Database:** `localhost:5433` (internal container port 5432, preventing conflicts with local PostgreSQL)

#### Step-Up 2FA in Docker & Local Runs
When confirming a payment transfer draft in the UI:
1. In the chat draft card under **2FA Step-Up Verification**, click **"Request Live OTP"**.
2. The server dynamically issues a 6-digit OTP (`POST /api/auth/step-up-otp`), displays a notification with the issued code, and automatically auto-populates the OTP verification input.
3. Click **"Authorize & Confirm Payment"** to finalize settlement.
*(In Docker where `NODE_ENV=production`, the static developer test PINs `123456`/`000000` are disabled by default, but can be enabled if desired by setting `ALLOW_SANDBOX_MFA_BYPASS=true` in `.env`).*

---

### Option 2: Running Locally (Development Mode)

In development, the backend uses an in-memory sandbox store if PostgreSQL is unavailable. In production mode it requires PostgreSQL and fails startup rather than silently falling back to ephemeral storage. Demo student credentials are seeded only outside production.

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

### Verified Test Cases (80 Passed):

All 80 test cases pass deterministically across two dedicated test suites:
- `test/security.spec.ts` (54 tests): Core financial invariants, permission tiers, Saga rollback restoration, multi-objective route ranking, and prompt injection filters.
- `test/security-hardening.spec.ts` (26 tests): Rate limiting, ownership boundary enforcement, production startup hardening, prototype pollution immunity, and WAF shell-bomb defenses.

See [backend/test/](backend/test/) for complete test suite definitions.

---

## Seed Data & Demonstration Persona

The database automatically seeds an initial student persona, authentication credentials, and 4 mock remittance corridors:

- **Student ID:** `STU-2026-BDT01`
- **Student Name:** Mir Eashan Zaman
- **Email:** `eashan.student@fintechathon.org`
- **Default Password:** `student123` (Hashed with Node.js scrypt)
- **Role:** `STUDENT`
- **Initial Balance:** `850,000.00 BDT` (~$7,112 USD)
- **Daily Spending Limit:** `1,000,000.00 BDT`

### Authentication Endpoints:
- `POST /api/auth/registration` - Register a new student account and auto-provision sandbox balance (aliases `POST /api/auth/register`)
- `POST /api/auth/login` - Authenticate credentials (`studentIdOrEmail`, `password`) and receive signed JWT
- `GET /api/auth/session` - Verify active JWT bearer token and retrieve student profile (aliases `GET /api/auth/me`)
- `POST /api/auth/logout` - Terminate session and record audit event
- `GET /api/auth/demo-credentials` - Quick sandbox demo credentials
- `POST /api/auth/step-up-otp` - Issue time-sensitive 6-digit 2FA step-up OTP for settlement authorization

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
- `POST /api/invoice/extract` - University tuition invoice document parsing (`@Body()`)
- `GET /api/accounts/:id` - Fetch student account balance & limits (`@Param('id')`)
- `PUT /api/accounts/:id/limits` - Update student daily limit (`@Param('id')`, `@Body()`)
- `POST /api/accounts/:id/deposit` - Deposit funds to student account (`@Param('id')`, `@Body()`)
- `POST /api/accounts/:id/card-deposit` - Student virtual credit card sandbox deposit (`@Param('id')`, `@Body()`)
- `GET /api/rates` - Remittance corridor rates with query filtering (`@Query('activeOnly')`, `@Query('targetCurrency')`)
- `GET /api/rates/stream` - Server-Sent Events (SSE) live rate ticker stream
- `GET /api/rates/live-feed` - Real-time market feed with spread calculations
- `GET /api/rates/:id` - Remittance corridor rate by ID (`@Param('id')`)
- `PUT /api/rates/:id` - Update remittance corridor rate or status (`@Param('id')`, `@Body()`)
- `DELETE /api/rates/:id` - Deactivate corridor rate (`@Param('id')`)
- `POST /api/routes/compare` - Compare remittance corridors with multi-objective scoring (`@Body()`)
- `POST /api/routes/installments` - Smart tuition installment split planner (`@Body()`)
- `GET /api/transfers` - List student transfers with status filtering (`@Query('studentId')`, `@Query('status')`)
- `GET /api/transfers/:id` - Transfer details by ID (`@Param('id')`)
- `GET /api/transfers/:id/receipt` - Official transfer verification receipt & checksum (`@Param('id')`)
- `POST /api/transfers/draft` - Create pending transfer draft (`@Body()`)
- `PUT /api/transfers/:id` - Update draft recipient before confirmation (`@Param('id')`, `@Body()`)
- `PATCH /api/transfers/:id` - Partial update of unconfirmed transfer draft (`@Param('id')`, `@Body()`)
- `DELETE /api/transfers/:id` - Discard transfer draft (`@Param('id')`)
- `POST /api/transfers/:id/confirm` - User-consented transfer execution with 2FA step-up OTP (`@Param('id')`, `@Body()`)
- `POST /api/webhooks/bank-clearing` - Inbound bank clearing settlement webhook with secret verification (`@Body()`, `@Headers()`)
- `POST /api/transfers/:id/compensate` - Saga compensating transaction rollback (`@Param('id')`, `@Body()`)
- `POST /api/transfers/:id/rollback` - Unified Saga rollback restoring student balance and unreserving gateway funds (`@Param('id')`, `@Body()`)
- `POST /api/transfers/:id/cancel` - Cancel transfer draft (`@Param('id')`)
- `GET /api/audit` - Append-only audit logs with tier and status filtering (`@Query('limit')`, `@Query('tier')`, `@Query('status')`)
- `GET /api/audit/:id` - Fetch specific audit log by ID (`@Param('id')`)
- `DELETE /api/audit/:id` - Sandbox development audit log pruning (AdminRoleGuard only) (`@Param('id')`)
- `POST /api/sandbox/reset` - Reset sandbox database to seed data (AdminRoleGuard & non-production only)
- `GET /api/sandbox/export-logs` - Export full audit records archive (AdminRoleGuard only)
- `POST /api/auth/step-up-otp` - Issue time-sensitive 6-digit 2FA step-up OTP (`@Req()`)

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
*(No real API keys or passwords are committed to the codebase. The default model identifier is `gemini-1.5-flash`, Google's low-latency multimodal LLM. Live API execution operates whenever a valid `GEMINI_API_KEY` is provided. If the key is omitted or left as `mock_key_offline_agent`, the application automatically activates its deterministic offline sandbox agent (`OfflineLlmClient`), enabling complete, instant evaluation of all conversational flows, corridor comparisons, and security guardrails with zero external network dependencies).*

---

## Automated CI/CD Pipeline

The project features a GitHub Actions workflow (`.github/workflows/ci.yml`) triggering on pushes and pull requests to `main` and `Eashan`:

1. **Backend CI**: Automated dependency resolution (`npm ci`), Jest test suite execution (80/80 tests passing), and NestJS production build.
2. **Frontend CI**: Dependency installation and Next.js static and server optimization build.
3. **Docker Verification**: Builds multi-stage Docker images for both services to ensure container reproducibility.
4. **Security & Cleanliness**: Automated Node.js audit ensuring zero exposed secrets and code policy compliance.
5. **Deployment Verification**: Verifies Docker Compose and environment manifests for deployment.

---

## Submission Deliverables Index

All official FinTechathon submission documents are prepared in the repository:
1. **Technical Documentation:** [docs/TECHNICAL_DOCUMENTATION.pdf](docs/TECHNICAL_DOCUMENTATION.pdf) (primary official submission document with rendered formulas and architecture diagrams; markdown source: [docs/TECHNICAL_DOCUMENTATION.md](docs/TECHNICAL_DOCUMENTATION.md))
2. **Security Self-Assessment:** [docs/SECURITY_REPORT.md](docs/SECURITY_REPORT.md)
3. **Presentation Deck:** [docs/FINTECHATHON_2026_PRESENTATION.pptx](docs/FINTECHATHON_2026_PRESENTATION.pptx) (primary official PowerPoint deck) & [docs/PRESENTATION_DECK.md](docs/PRESENTATION_DECK.md)
4. **Demo Video Script:** [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)
5. **Execution Evidence:** [docs/EXECUTION_EVIDENCE.md](docs/EXECUTION_EVIDENCE.md) & [docs/execution-evidence.json](docs/execution-evidence.json)
6. **Open-Source License:** [LICENSE](LICENSE) & [docs/LICENSE](docs/LICENSE)
7. **Source Code & Tests:** [backend/](backend/) & [frontend/](frontend/)
8. **Automated Evidence Generator Script:** [scratch/run_demo_and_export.js](scratch/run_demo_and_export.js)

---

## Team & Attribution

- **Mir Eashan Zaman** — Architecture, Security Engineering, Agent Guardrails (American International University-Bangladesh - AIUB)
- **Ishmam Mubtasim** — Product Design, Remittance Calculations, Strategy Engine (American International University-Bangladesh - AIUB)

---

## License

This project is licensed under the [MIT License](LICENSE) (also mirrored in [docs/LICENSE](docs/LICENSE)).
