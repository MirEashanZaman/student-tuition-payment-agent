# FinTechathon 2026 Presentation Deck Outline
**Topic C: Cross-Border & Student Finance Assistant**
**Project:** Student Tuition Payment Agent
**Format:** 10-Minute Presentation Structure & Speaker Script

---

### Slide 1: Title Slide
- **Project Title:** Student Tuition Payment Agent: Autonomous Cross-Border Settlement with Permission Tiers & Guardrails
- **Track:** International Track | Topic C
- **Team:** Mir Eashan Zaman & Ishmam Mubtasim (American International University-Bangladesh - AIUB)
- **Tagline:** Turning a stressful, opaque, multi-day tuition remittance into a transparent, safe, and intelligent 60-second experience.

---

### Slide 2: The International Student Problem
- **Context:** Tens of thousands of international students pursue higher education abroad each year, navigating complex cross-border tuition remittances plagued by significant foreign exchange markups, hidden wire intermediary charges, and strict university payment deadlines.
- **Pain Points:**
  1. *Opaque Exchange Rates:* Banks hide 2–5% markup spreads behind low advertised upfront wire fees.
  2. *Intermediary Delays:* Traditional SWIFT wires take 3–5 business days, risking university course cancellation and late fines.
  3. *Anxiety & Zero Transparency:* Students have no visibility into delivery dates or total landed costs.

---

### Slide 3: Our Solution — Autonomous Tuition Agent
- An agentic AI assistant combining natural language interaction with strict financial engineering:
  - **Multi-Objective Corridors Optimization:** Evaluates cost, speed, and reliability simultaneously.
  - **Deadline Sentinel:** Calculates arrival dates against university invoice due dates.
  - **Tri-Tier Permission Architecture:** Protects student balances against unauthorized or automated LLM actions.
  - **Explainability First:** Transparently explains "Why I chose this route" so students are in full control.

---

### Slide 4: Live Architecture & Tech Stack
- **Frontend:** Next.js 14 hybrid SSG/CSR architecture (instant SSG Home & FAQ landing for evaluators, dynamic CSR Chat, Dashboard, and Login) with custom dark fintech design system.
- **Backend:** NestJS enterprise architecture with modular policy guards and dependency injection.
- **Data Layer:** PostgreSQL schema with 4 core tables (`accounts`, `rates`, `transfers`, `audit_log`).
- **AI Engine:** Google Gemini 1.5 Flash with tool calling + high-fidelity offline sandbox fallback for resilient evaluation.

---

### Slide 5: The Tri-Tier Permission Model (Scoring Focus: Security 30%)
- *Why is this critical?* LLMs must never possess unilateral authority to move funds.
- **Tier 1 (READ_ONLY):** Balance inquiries, corridor comparisons, audit reviews.
- **Tier 2 (DRAFT):** Generates pending transfer drafts, locks rates, calculates fees, and generates a single-use confirmation token.
- **Tier 3 (EXECUTE):** Fund settlement. **Automated LLM execution is strictly blocked.** Only user-initiated consent with the cryptographic token triggers fund deduction.

---

### Slide 6: Multi-Objective Route Scoring Formula (Scoring Focus: Innovation 30%)
- Show formula: $\text{Score} = (0.50 \times \text{Cost}) + (0.30 \times \text{Speed}) + (0.20 \times \text{Reliability}) - \text{DeadlinePenalty}$
- Real comparison of 4 active corridors:
  - *EduPay Prime:* Lowest cost, 24h speed, 99% reliability (Rank #1).
  - *SwiftWire Express:* Urgent 4h speed, ideal for tight deadlines.
  - *GlobalCampus Pay:* Standard 48h MTO corridor.
  - *National Bank Wire (SWIFT TT):* 72h bank telegraphic transfer with high fees and deadline risk.

---

### Slide 7: Live Demonstration Flow (Scoring Focus: Task Completion 40%)
- **Flow 1 (Happy Path):** Student asks *"Pay my $3,000 tuition from BDT"* $\rightarrow$ Agent compares corridors $\rightarrow$ Student chooses EduPay Prime $\rightarrow$ Draft generated $\rightarrow$ Explicit confirmation $\rightarrow$ Confetti celebration & balance update to 491,545.15 BDT.
- **Flow 2 (Deadline Sentinel):** Urgent 24h deadline comparison flags 48h and 72h routes with bright warning banners.
- **Flow 3 (Safety Guardrails Block):** Attempting to transfer $4,500 USD (exceeding 400,000 BDT limit: 537,507.28 BDT) or prompt injection bypass is blocked and permanently logged.

---

### Slide 8: Compliance & Append-Only Audit Logging
- Every single tool invocation, parameter payload, security violation, and confirmation is recorded in `audit_log`.
- Append-only by design; filterable by permission tier and status (`SUCCESS`, `BLOCKED`, `FLAGGED`).
- One-click export for regulatory reporting and compliance auditing (`execution-evidence.json`).

---

### Slide 9: Automated Test Coverage & Verification
- 80/80 automated Jest security and integration test cases passing (54 tests in `security.spec.ts` and 26 tests in `security-hardening.spec.ts`):
  - Over-limit transfers blocked.
  - Transfers without confirmation blocked.
  - Audit logging for every action verified.
  - Route ranking and deadline penalties verified.
  - Prompt injection neutralization and WAF shell-bomb defenses verified.

---

### Slide 10: Roadmap & Production Next Steps
- **Short-Term:** Integrate live university student portal SSO (Canvas/Ellucian Banner).
- **Medium-Term:** Partner with central bank sandbox for instant BDT real-time gross settlement (RTGS).
- **Long-Term:** Multi-currency split payments (e.g. paying partial tuition from BDT and partial from foreign student loan).
- **Q&A:** Thank you to the judges and Tsinghua / WeBank organizers!
