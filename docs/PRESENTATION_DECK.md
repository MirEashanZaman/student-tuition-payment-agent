# FinTechathon 2026 Presentation Deck

**Topic C: Cross-Border & Student Finance Assistant**  
**Project:** Student Tuition Payment Agent  
**Format:** 10-Minute Presentation Structure & Speaker Script  

> **Note:** `docs/FINTECHATHON_2026_PRESENTATION.pptx` is the primary and official presentation slide deck for competition submission. This document provides the matching slide-by-slide transcript, content layout, and speaker presentation notes.

---

### Slide 1: Title Slide
- **Header:** FINTECHATHON 2026 | INTERNATIONAL TRACK | TOPIC C
- **Title:** Student Tuition Payment Agent
- **Subtitle:** An AI agent that compares routes, drafts the payment, and never moves money without the student's approval.
- **Presenters:** Mir Eashan Zaman & Ishmam Mubtasim
- **Institution:** American International University-Bangladesh (AIUB)
- **Three Pillars:** Compare routes | Draft the transfer | Student confirms

**Speaker Notes:**  
Good day, esteemed judges and organizers. We are Mir Eashan Zaman and Ishmam Mubtasim from AIUB. Today, we are presenting our Student Tuition Payment Agent—an autonomous, security-first financial assistant designed to solve the friction of international university tuition payments from Bangladesh. Our core design philosophy is simple: the AI can compare routes and draft transfers, but it can never unilaterally move student funds without explicit human confirmation.

---

### Slide 2: The Tuition Remittance Problem
- **Category:** THE PROBLEM
- **Title:** The Tuition Remittance Problem
- **Key Challenges:**
  - **Hidden FX markups:** Low upfront fees can hide extra cost inside the exchange rate.
  - **Slow transfers:** Wires pass through several banks and can take days, risking late fees or enrollment holds.
  - **No guidance:** Students cannot easily see which route is cheapest, fastest, or safest.
- **Summary:** Result: stress, extra cost, and missed deadlines for students and families.

**Speaker Notes:**  
Every semester, thousands of international students and their families face major hurdles sending tuition abroad. Advertised transfer fees look low, but hidden currency spreads significantly increase total costs. Traditional wire routes route through multiple intermediary correspondent banks, taking days to clear and risking university course drops. Most critically, students have zero guidance on which corridor balances cost, delivery speed, and reliability.

---

### Slide 3: Our Solution: A Safe Tuition Agent
- **Category:** OUR SOLUTION
- **Title:** Our Solution: A Safe Tuition Agent
- **Key Capabilities:**
  - **Route optimization:** Scores cost, speed, and reliability together.
  - **Deadline sentinel:** Warns when a route may arrive after the tuition due date.
  - **Permission tiers:** The AI can read and draft. Only the student can approve a payment.
  - **Explainable choices:** Shows why a route won, with weights of 50 / 30 / 20.

**Speaker Notes:**  
Our solution is an intelligent tuition payment agent built with strict financial engineering guardrails. It calculates optimal remittance corridors using a multi-objective scoring formula across cost, speed, and reliability. Its deadline sentinel actively warns students if a slower route risks missing their university invoice deadline. Crucially, strict permission tiers prevent autonomous fund movement, and explainable breakdowns show students exactly why a corridor was recommended.

---

### Slide 4: Architecture & Tech Stack
- **Category:** ARCHITECTURE
- **Title:** Architecture & Tech Stack
- **Components:**
  - **Next.js 14:** Chat & dashboard, Audit viewer, Login
  - **NestJS API:** Permission guards, Safety rules, Agent tools
  - **PostgreSQL:** accounts, rates, transfers, audit_log
  - **LLM agent:** Gemini or offline sandbox
  - **Production Engineering:** Docker Compose run, GitHub Actions CI, Zod validation, 80 Jest tests

**Speaker Notes:**  
Our architecture is built for security, resilience, and testability. The frontend uses Next.js 14 with a high-performance hybrid rendering model and custom dark fintech styling. The backend is a hardened NestJS API implementing permission guards, safety rules, and agent tools. Data is stored in PostgreSQL across four core tables. The AI agent supports Google Gemini or an offline deterministic sandbox, validated by Docker Compose orchestration, GitHub Actions CI, and 80 automated Jest tests.

---

### Slide 5: Three Permission Tiers (Security 30%)
- **Category:** SECURITY | 30% OF SCORE
- **Title:** Three Permission Tiers
- **Permission Tiers:**
  - **READ_ONLY (AI allowed):** Check balance, compare routes, read the audit log. No money moves.
  - **DRAFT (AI allowed):** Create a pending transfer with a one-time token. Balance is unchanged.
  - **EXECUTE (Human only):** Confirm payment with dual-layer verification: single-use token + mandatory 6-digit Step-Up 2FA OTP. The AI is strictly blocked here.
- **Hard Limits:** 400,000 BDT per transfer | 1,000,000 BDT per day. Enforced in backend code, not in the AI prompt.

**Speaker Notes:**  
To address the hackathon's security criterion, we engineered three strict permission tiers. The AI operates only in READ_ONLY and DRAFT tiers. In DRAFT tier, it generates a pending transfer and a single-use one-time token, but student balances remain untouched. Fund settlement belongs solely to the EXECUTE tier, where automated AI execution is strictly blocked by code. Only the human student providing explicit consent, the matching one-time token, and a verified 6-digit step-up 2FA OTP can confirm. Hard transfer caps of 400,000 BDT per transfer and 1,000,000 BDT per day are enforced in backend code, never left to LLM prompts.

---

### Slide 6: How the Agent Ranks Routes (Innovation 30%)
- **Category:** INNOVATION | 30% OF SCORE
- **Title:** How the Agent Ranks Routes
- **Formula:**
  $$\text{Score} = 0.50 \times \text{Cost} + 0.30 \times \text{Speed} + 0.20 \times \text{Reliability} - \text{DeadlinePenalty}$$
- **Deadline Penalty:** 40 points if a route arrives after the tuition due date.
- **Corridors Comparison:**
  - **EduPay Prime (Best overall):** Rate 119.19 BDT/USD | 24 hours | Fee 350 BDT + 0.15% | 99% reliable
  - **SwiftWire Express (Fastest):** Rate 120.10 BDT/USD | 4 hours | Fee 1,200 BDT + 0.35% | 97% reliable
  - **GlobalCampus Pay (Licensed MTO):** Rate 119.80 BDT/USD | 48 hours | Fee 600 BDT + 0.20% | 94% reliable
  - **National Bank Wire (Legacy bank):** Rate 121.50 BDT/USD | 72 hours | Fee 2,500 BDT + 0.50% | 89% reliable

**Speaker Notes:**  
For innovation, our route scoring engine balances cost at 50%, clearance speed at 30%, and network reliability at 20%. If a corridor's estimated delivery exceeds the student's tuition deadline, a heavy 40-point penalty is deducted immediately. Here, EduPay Prime scores highest overall for balanced value, while SwiftWire Express is available when 4-hour urgent delivery is required.

---

### Slide 7: The Demo Flow (Task Completion 40%)
- **Category:** TASK COMPLETION | 40% OF SCORE
- **Title:** The Demo Flow
- **Six Demonstration Steps:**
  1. **Ask & compare:** "Pay my $3,000 tuition." Four routes are ranked.
  2. **Direct Draft:** EduPay Prime direct corridor draft: 358,454.85 BDT. Balance unchanged.
  3. **2FA Step-Up & Confirm:** Student enters 6-digit OTP and approves. Balance debits: 850,000 to 491,545.15 BDT.
  4. **Roll back:** Saga rollback restores 358,454.85 BDT to the account.
  5. **Over limit:** $4,500 = 537,507.28 BDT. Blocked at the 400,000 cap.
  6. **Attack:** Prompt injection and shell-bomb payloads are blocked and logged.

**Speaker Notes:**  
Our live evaluation demo verifies six practical flows. First, the student asks to pay $3,000 tuition and the agent ranks four corridors. Second, clicking the chosen corridor directly creates a draft for 358,454.85 BDT without redundant prompt loops, while the student balance remains untouched. Third, the student completes mandatory 6-digit Step-Up 2FA OTP verification and approves, debiting the balance from 850,000 to 491,545.15 BDT with a cryptographic receipt. Fourth, an automated Saga compensating rollback restores the full 358,454.85 BDT. Fifth, an attempt to send $4,500—which equals 537,507.28 BDT—is blocked by the 400,000 BDT cap. Sixth, prompt injections and shell-bomb attacks are neutralized and logged.

---

### Slide 8: Append-Only Audit Trail (Compliance)
- **Category:** COMPLIANCE
- **Title:** Append-Only Audit Trail
- **Event Audit Log Records:**
  | Event | Tier | Result |
  |---|---|---|
  | AUTH_REGISTRATION_SUCCESS | EXECUTE | SUCCESS |
  | ROUTE_COMPARISON | READ_ONLY | SUCCESS |
  | DRAFT_CREATED | DRAFT | SUCCESS |
  | STEP_UP_OTP_ISSUED | EXECUTE | SUCCESS |
  | CONFIRM_SUCCESS | EXECUTE | SUCCESS |
  | TRANSFER_COMPENSATED | EXECUTE | WARNING |
  | SAFETY_LIMIT_TRIGGERED | DRAFT | BLOCKED |
  | PROMPT_INJECTION_FLAGGED | READ_ONLY | FLAGGED |
  | PENETRATION_ATTACK_BLOCKED | READ_ONLY | BLOCKED |
- **Evidence Source:** `execution-evidence.json` (sandbox export)
- **Key Metric:** Every tool call, block, registration, 2FA challenge, and confirmation is logged.
- **Production Plan:** Stream logs to write-once storage (WORM).

**Speaker Notes:**  
Compliance requires tamper-evident visibility. Every action in our system emits an append-only audit event. The table on this slide displays the exact event types from our exported sandbox run, including registration onboarding, route comparisons, successful drafts, step-up 2FA challenges, confirmations, rollbacks, limit violations, and security blocks. In production, these events stream to write-once-read-many (WORM) cloud storage for regulatory compliance.

---

### Slide 9: 80 Tests, All Passing (Verification)
- **Category:** VERIFICATION
- **Title:** 80 Tests, All Passing
- **Test Metric:** 80/80 Jest tests pass across two test suites: security and hardening.
- **Financial Safety Suite (54 Tests):**
  - Transfer limits enforced (400k BDT per-transfer / 1M BDT daily)
  - AI cannot confirm payment (EXECUTE tier locked to human)
  - Dual-layer consent: matching token + verified 2FA OTP
  - Saga compensating rollback restores funds idempotently
  - Route ranking, fee calculations, and deadline warnings
- **Security Hardening Suite (26 Tests):**
  - Registration endpoint validation and auto-provisioning
  - Login and chat rate limiting with sliding windows
  - Tenant data isolation and IDOR cross-account protections
  - Cryptographic token verification & tampered JWT rejections
  - Prompt injection neutralization and perimeter WAF shell-bomb defenses
  - Admin-only role gating for sandbox resets

**Speaker Notes:**  
Every claim in our submission is backed by automated tests. We maintain 80 passing Jest test cases across two comprehensive suites: 54 in the core financial security suite and 26 in the security hardening suite. These verify limit enforcement, human consent barriers with step-up 2FA verification, Saga rollbacks, tenant isolation, student registration, tampered token rejections, and prompt injection filters.

---

### Slide 10: Roadmap & Next Steps
- **Category:** WHAT COMES NEXT
- **Title:** Roadmap & Next Steps
- **Milestones:**
  - **SHORT TERM (University integration):** Import tuition invoices from student portals.
  - **MEDIUM TERM (Real settlement):** Central bank sandbox and RTGS rails.
  - **LONG TERM (Split payments):** Pay from family savings and education loans.
- **Pre-Production Checklist:** Before going live: KYC and AML screening, distributed rate limiting, and an independent security audit.
- **Closing:** Thank you. Questions welcome.

**Speaker Notes:**  
Looking forward, our roadmap focuses on direct university invoice sync, national real-time gross settlement rails, and multi-source split payments. Before commercial launch, we will integrate KYC/AML identity verification and conduct an external security audit. Thank you to the judges, mentors, and organizers. We welcome your questions.
