# Security & Compliance Assessment Report
**FinTechathon 2026 | International Track — Topic C: Cross-Border & Student Finance Assistant**
**Project:** Student Tuition Payment Agent
**Assessment Date:** 2026-10-17
**Scope:** Repository implementation for the FinTechathon sandbox. This document serves as a comprehensive security self-assessment report detailing the permission tiers architecture, access control enforcement, and the formal known-risk register.

## 1. Executive Summary & Assessment Scope

This self-assessment evaluates the software architecture, cryptographic safeguards, guardrails, and risk boundaries implemented in the Student Tuition Payment Agent sandbox application. The application enables Bangladeshi university students to compute, compare, draft, and confirm cross-border tuition remittances while preventing unauthorized balance depletion, over-limit transactions, prompt-injection attacks, cross-account data leakage, and automated agent overreach.

> [!NOTE]
> **Sandbox Environment Notice:** All remittance corridors, exchange rates, bank clearing gateways, and account balances run in a simulated sandbox environment for demonstration and algorithmic evaluation. The system operates on simulated mock data and is not connected to live production SWIFT rails or real currency.

The assessment covers:
- Tri-tier permission architecture and role-based access control.
- In-depth permission matrix across all REST endpoints and agent tools.
- Human-in-the-loop confirmation controls and token lifecycles.
- Financial safety guardrails (per-transfer limit, daily limit, anomaly ceiling).
- Prompt-injection defenses and input sanitization (XSS and script neutralization).
- Append-only audit trail recording and event schema.
- Comprehensive Known-Risk List (Risk Register).

## 2. Permission Tiers Architecture

To prevent autonomous agent hallucination or malicious client abuse from executing financial transactions unilaterally, the application enforces a strict hierarchical tri-tier permission model: `READ_ONLY` < `DRAFT` < `EXECUTE`.

### Tier Definitions

1. **READ_ONLY**:
   - **Target Persona / State:** Public exploration, unverified sessions, inquiry-only queries, student read access.
   - **Allowed Actions:** Account balance review, historical transfer reading, corridor rate lookups, route comparisons, audit trail querying, informational chat prompts.
   - **Explicit Restrictions:** Blocked from generating transfer drafts, modifying draft records, cancelling drafts, and executing confirmations.
   - **Enforcement Guard:** `@RequirePermissionTier(PermissionTier.READ_ONLY)` and `PermissionTierGuard`.

2. **DRAFT**:
   - **Target Persona / State:** Authenticated students preparing tuition remittance drafts.
   - **Allowed Actions:** All `READ_ONLY` actions plus `createTransferDraft`, `updateTransferDraft` (recipient university, student registration number), `deleteTransferDraft`, and `cancelTransfer`.
   - **Explicit Restrictions:** Blocked from executing payments, transferring funds, or invoking `confirmTransfer`. Funds remain in the student balance and are not debited.
   - **Enforcement Guard:** `@RequirePermissionTier(PermissionTier.DRAFT)` and `PermissionTierGuard`.

3. **EXECUTE**:
   - **Target Persona / State:** Verified human student authorizing a finalized transaction draft.
   - **Allowed Actions:** All `DRAFT` actions plus `confirmTransfer`, `compensateTransfer` (Saga rollback), account deposits, and daily limit adjustments (admin only).
   - **Crucial Safety Boundary:** The AI agent and automated background workers are strictly barred from the `EXECUTE` tier. Even when a user session possesses `EXECUTE` permissions, `AgentToolsService.confirmTransfer` requires `isUserInitiated = true`, a matching single-use one-time confirmation token, token freshness within 15 minutes, explicit boolean user consent (`userConsent: true`), and verified 6-digit Step-Up 2FA OTP verification (`twoFactorPin`).
   - **Enforcement Guard:** `@RequirePermissionTier(PermissionTier.EXECUTE)` and `PermissionTierValidator.validateToolExecution`.

### Permission Matrix

| Endpoint / Action | Method | Minimum Tier | Scoping Guard | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/auth/registration` | `POST` | Public | Rate Limited | Student registration & sandbox wallet auto-provisioning (aliases `/api/auth/register`) |
| `/api/auth/login` | `POST` | Public | Rate Limited | Student credential authentication with scrypt hashing and JWT issuance |
| `/api/auth/session` | `GET` | `READ_ONLY` | `JwtAuthGuard` | Verifies active JWT bearer token and returns student profile (aliases `/api/auth/me`) |
| `/api/auth/logout` | `POST` | `READ_ONLY` | `JwtAuthGuard` | Terminates student session and records audit event |
| `/api/auth/step-up-otp` | `POST` | `EXECUTE` | `StudentScopeGuard` | Issues time-sensitive 6-digit Step-Up 2FA OTP for settlement authorization |
| `/api/accounts/:id` | `GET` | `READ_ONLY` | `StudentScopeGuard` | Student balance, daily limit, and remaining allowance |
| `/api/accounts/:id/limits`| `PUT` | `EXECUTE` | `AdminRoleGuard` | Administrative limit adjustment |
| `/api/accounts/:id/deposit`| `POST` | `EXECUTE` | `AdminRoleGuard` | Administrative account funding |
| `/api/accounts/:id/card-deposit`| `POST` | `EXECUTE` | `StudentScopeGuard` | Virtual card deposit with automated card number masking |
| `/api/rates` | `GET` | Public | None | Remittance corridors, inverse rates, flat & percentage fees |
| `/api/rates/stream` | `GET` | Public | None | Server-Sent Events (SSE) live rate ticker stream |
| `/api/rates/live-feed` | `GET` | Public | None | Real-time market feed with spread calculations |
| `/api/rates/:id` | `GET` | Public | None | Detailed corridor clearing speed and reliability profile |
| `/api/rates/:id` | `PUT/DELETE`| `EXECUTE` | `AdminRoleGuard` | Administrative corridor rate configuration |
| `/api/routes/compare` | `POST` | `READ_ONLY` | `StudentScopeGuard` | Algorithmic multi-objective route ranking |
| `/api/routes/installments` | `POST` | `READ_ONLY` | `PermissionTierGuard` | Smart tuition installment split planner respecting transfer caps |
| `/api/invoice/extract` | `POST` | `READ_ONLY` | `StudentScopeGuard` | University tuition invoice document parsing & parameter extraction |
| `/api/chat` | `POST` | `READ_ONLY` | `StudentScopeGuard` | Conversational assistant with prompt injection filter |
| `/api/transfers` | `GET` | `READ_ONLY` | `StudentScopeGuard` | Authenticated student transfer history |
| `/api/transfers/:id` | `GET` | `READ_ONLY` | `assertTransferOwner` | Specific transfer status and corridor details |
| `/api/transfers/:id/receipt` | `GET` | `READ_ONLY` | `assertTransferOwner` | Official vector receipt data and SHA-256 fingerprint verification |
| `/api/transfers/draft` | `POST` | `DRAFT` | `StudentScopeGuard` | Pre-transaction reservation draft with single-use token |
| `/api/transfers/:id` | `PUT/PATCH` | `DRAFT` | `assertTransferOwner` | Modifies university or registration number |
| `/api/transfers/:id` | `DELETE` | `DRAFT` | `assertTransferOwner` | Discards pending draft prior to confirmation |
| `/api/transfers/:id/cancel`| `POST` | `DRAFT` | `assertTransferOwner` | Cancels draft and logs `TRANSFER_CANCELLED` |
| `/api/transfers/:id/confirm`| `POST` | `EXECUTE` | `assertTransferOwner` | Debits balance, verifies 2FA OTP & token, advances state |
| `/api/transfers/:id/compensate`| `POST` | `EXECUTE` | `assertTransferOwner` | Saga rollback restoring reserved funds upon rail failure |
| `/api/transfers/:id/rollback`| `POST` | `EXECUTE` | `assertTransferOwner` | Saga rollback restoring student balance and unreserving gateway funds |
| `/api/webhooks/bank-clearing`| `POST` | Public | Webhook Secret | Inbound settlement rail callback with HMAC secret validation |
| `/api/audit` | `GET` | `READ_ONLY` | Account Scoped | Authenticated student append-only audit log |
| `/api/audit/:id` | `GET` | `READ_ONLY` | Account Scoped | Specific audit record entry |
| `/api/audit/:id` | `DELETE` | `EXECUTE` | `AdminRoleGuard` | Administrative test teardown and sandbox reset (see Section 2.3) |

### Multi-Layer Enforcement Architecture

1. **HTTP Routing Layer (`NestJS Guards`)**:
   - `JwtAuthGuard`: Verifies HMAC-SHA256 signature, expiration, and payload integrity.
   - `PermissionTierGuard`: Validates the hierarchical tier (`READ_ONLY` = 1, `DRAFT` = 2, `EXECUTE` = 3).
   - `StudentScopeGuard`: Prevents IDOR attacks by verifying `:id` or `studentId` matches token claims.
   - `AdminRoleGuard`: Locks privileged operations to verified administrator sessions.

2. **Domain Service Layer (`AgentToolsService`)**:
   - Ownership assertion on every transfer modification, confirmation, update, and cancellation.
   - Verification of `isUserInitiated` flag on execution methods.
   - Pre-execution validation of account balances and daily limits.

3. **Rule Engine Layer (`SafetyRuleEngine`)**:
   - Chain-of-responsibility evaluating registered deterministic financial and security rules.
   - Anomaly detection, per-transfer ceiling (400,000 BDT), daily ceiling (1,000,000 BDT), and confirmation rules.

### Defense-in-Depth vs Heuristic Pattern Matchers
The prompt injection filter (`PromptInjectionFilter`) and perimeter WAF rules (`SecurityArmorMiddleware`) operate as first-line heuristic pattern matchers. The true, foundational financial guarantee is enforced deterministically in compiled NestJS code via `PermissionTierGuard`, `StudentScopeGuard`, and `FinancialLimitsGuard`. Even if an adversarial prompt or clever linguistic obfuscation bypasses regex keyword heuristics, the autonomous agent is physically prevented by backend code from executing settlements, elevating permissions, or raising transaction limits.

### Audit Ledger & Admin Endpoints
The audit trail operates strictly as an append-only ledger during standard student and agent workflows. Students and AI tools have zero capability to mutate or delete logs. The restricted `DELETE /api/audit/:id` endpoint requires `AdminRoleGuard` and is reserved strictly for sandbox environment resets, automated Jest test suite teardown, and regulatory right-to-erasure compliance testing.

---

## 3. Input, Abuse, and Runtime Controls

- **Security Armor WAF Middleware (`SecurityArmorMiddleware`)**: Protects application endpoints by recursively inspecting paths, parameters, query strings, headers, and parsed JSON request bodies. Neutralizes bash fork bombs (`:(){ :|:& };:`), command execution (`rm -rf`, `cat /etc/passwd`, `$(whoami)`, `` `whoami` ``, `powershell`, `cmd.exe /c`), path traversal (`../`, `..\`, `%2e%2e`), SQL injection (`UNION ALL SELECT`, `; DROP TABLE`, `; TRUNCATE TABLE`), prototype pollution (`__proto__`, `constructor.prototype`), null byte poisoning (`%00`, `\0`), and deep payload nesting bombs (>10 levels). Blocked requests trigger immediate HTTP 403 Forbidden responses and append-only audit logs under `PENETRATION_ATTACK_BLOCKED`.
- **Payload Sanitization (XSS Protection)**: `PromptInjectionFilter.sanitizeUserText` sanitizes HTML entities (`&`, `<`, `>`, `"`, `'`) across user prompts, university names, and student registration numbers, neutralizing script injection, polyglot payloads, SVG onload triggers, and attribute escapes.
- **Data Boundary Encapsulation**: User inputs are treated strictly as passive data payloads enclosed in `[DATA_PAYLOAD]` markers, preventing language models from misinterpreting text as instructions.
- **Request Body Quotas**: Express body parsers enforce a strict 16 KB payload ceiling. DTO validation pipes reject non-whitelisted fields, negative numbers, and out-of-range amounts.
- **Sliding-Window Rate Limiting**: `ApiRateLimitMiddleware` enforces client IP rate limiting: 5 attempts per 15 minutes on `/api/auth/login`, 20 requests per minute on `/api/chat`, and 120 requests per minute across general API endpoints.
- **Hardened HTTP Headers**: Helmet sets `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, and strips `X-Powered-By`.
- **Least-Privilege Containers**: Backend and frontend containers run as unprivileged node users with no-new-privileges: true. CPU/memory limits, read-only root filesystems, and dropped capabilities were removed to keep the sandbox portable across evaluator environments (see SEC-08).
- **Step-Up 2FA & Dynamic OTP Challenge**: `AgentToolsService.generateStepUpOtp` and `AgentToolsService.verifyStepUpPin` enforce dynamic, cryptographically generated 6-digit one-time PINs for all high-value `EXECUTE` tier operations. The PIN has a strict 300-second TTL and must be supplied along with the single-use `confirmationToken` to finalize settlement, neutralizing session-hijacking and automated bot script attacks.
- **Strict Registration DTO Validation**: `RegistrationDto` enforces strict regex patterns on `studentId` (`/^[A-Za-z0-9_-]{2,64}$/`), `studentName` (`/^[^\u0000-\u001F<>]{2,128}$/`), RFC 5322 compliant emails, and 64-byte `scrypt` password derivation with constant-time verification.

---

## 4. Known-Risk List (Risk Register)

The following risk register categorizes known vulnerabilities, structural limitations, and residual risks in this sandbox implementation, accompanied by impact assessments, active mitigations, and required production follow-ups.

| Risk ID | Category | Threat / Vulnerability Description | Severity | Current Sandbox Mitigation | Residual Risk & Required Production Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **Identity & Session** | Stateless JWT stored in client-side storage is susceptible to theft via physical device compromise or token leakage. | **High** | Short-lived tokens, HMAC-SHA256 signature verification, strict CORS allowlist, and zero client token exposure across SSR routes. | In production, migrate to secure, HttpOnly, SameSite=Strict cookies with rotating refresh tokens and server-side Redis revocation blocklists. |
| **SEC-02** | **Session Escalation** | Self-selection of permission tiers at registration could allow students to self-provision `EXECUTE` rights. | **High** | Physical human confirmation, single-use token match, 15-minute token TTL, mandatory 6-digit Step-Up 2FA OTP verification (`twoFactorPin`), and balance checks are enforced on every transfer regardless of tier. | Production requires server-side tier provisioning bound to institutional student verification and step-up biometric/SMS MFA for execution. |
| **SEC-03** | **Rate Limiting** | Rate limiting is implemented in-memory per Node.js process; counters reset on container restart and do not coordinate across horizontally scaled replicas. | **High** | Local sliding-window limiter throttles individual containers (5 auth / 15m, 20 chat / min, 120 api / min) with automated Retry-After headers. | Deploy distributed Redis token-bucket rate limiting at the API Gateway or ingress controller level with cloud-edge WAF / DDoS filtering. |
| **SEC-04** | **Financial Settlement & Sandbox Mock Data** | All accounts, exchange rates, corridor fees, and bank clearing settlement rails operate entirely on simulated mock data in a sandbox environment and are not connected to real money. | **High** | High-fidelity mock banking gateway (`MockBankGateway`) and deterministic rate repository simulate settlement latencies, wire reference numbers, fee calculations, and Saga compensation rollbacks for algorithmic evaluation. | The system is strictly an academic sandbox demonstration and not certified for live capital. Production requires real correspondent banking APIs, ISO 20022 clearing rails, central bank foreign exchange declaration integration (Form A2), and automated AML/CFT sanctions screening. |
| **SEC-05** | **Adversarial AI / LLM & Prompt Injection** | Prompt injection attacks might attempt novel multi-turn semantic jailbreaks to bypass conversational assistant rules. Regex and keyword filters are pattern matching and can theoretically be bypassed by clever linguistic obfuscation. | **Medium** | Multi-layer defense: While `PromptInjectionFilter` provides a first-line heuristic filter, foundational safety is enforced in compiled NestJS code (`PermissionTierGuard`, `StudentScopeGuard`, `FinancialLimitsGuard`). The agent is architecturally blocked from executing transfers or adjusting financial limits regardless of prompt manipulation. | Pattern-matching filters are an initial perimeter layer; production deployments should add dedicated semantic moderation guardrail models (e.g., Llama Guard, NeMo Guardrails) in addition to backend code invariants. |
| **SEC-06** | **Audit Immutability & Admin Teardown** | Audit records are stored in PostgreSQL / in-memory table. The presence of an admin `DELETE /api/audit/:id` endpoint must be reconciled with append-only requirements. | **Medium** | Standard student and agent operations are strictly append-only with zero mutation or deletion capabilities. The `DELETE /api/audit/:id` endpoint is restricted by `AdminRoleGuard` exclusively for automated Jest test suite teardown, sandbox environment resets, and GDPR right-to-erasure compliance testing. | In production, remove deletion endpoints entirely and export audit trails to tamper-proof, append-only, write-once-read-many (WORM) storage (e.g., AWS CloudTrail, Amazon QLDB, or dedicated SIEM syslog). |
| **SEC-07** | **Regulatory Compliance** | Sandbox operates without formal Bangladesh Bank Form A2 foreign exchange declaration integration or National Tax Identification (TIN) validation. | **Medium** | System models foreign tuition remittance limits (400,000 BDT per transfer, 1,000,000 BDT daily) as illustrative thresholds modeled on typical cross-border banking remittance caps and institutional velocity guardrails. | Implement formal regulatory reporting pipelines to the Bangladesh Bank Foreign Exchange Operation Department and student visa / university admission letter validation. |
| **SEC-08** | **Infrastructure Isolation** | Container limits protect individual pods from runaway memory exhaustion, but do not provide full multi-tenant kernel isolation. | **Low** | Containers run as a non-root user with no-new-privileges: true. Resource limits, read-only root filesystems, and capability dropping are not enabled in the sandbox compose file. | Restore CPU/memory limits, cap_drop: ALL, and read-only root filesystems; then deploy on hardened Kubernetes clusters with gVisor / Kata Containers runtime isolation and network security policies restricting pod egress. |
| **SEC-09** | **Exploit Surface & Shell Bombs** | Automated penetration tools or shell bombs targeting Node.js child process spawning, command injection, or path traversal. WAF pattern matching can be vulnerable to novel evasion techniques. | **High** | `SecurityArmorMiddleware` acts as an initial heuristic perimeter filter intercepting shell bombs (`:(){ :|:& };:`), command execution, prototype pollution (`__proto__`), path traversal (`../`), and SQLi vectors. Core domain security is enforced deterministically by parameterized queries, strict DTO validation pipes, and least-privilege sandboxing. | Offload high-throughput WAF inspection to ingress Envoy filters, Coraza WAF, or Cloudflare Magic Transit in production environments while keeping strict typed validation at the application tier. |
| **SEC-10** | **Step-Up 2FA & Sandbox Mode Bypass** | A developer static PIN (`123456` or `000000`) is supported in test environments to facilitate automated CI testing and rapid end-to-end evaluation without human TOTP delays. If active in production, this would undermine mandatory 2FA. | **Critical** | In sandbox mode a documented test PIN is accepted, and it is disabled when `NODE_ENV=production`. Specifically, the static PIN bypass is active in any non-production run (`NODE_ENV !== 'production'`) regardless of the `ALLOW_SANDBOX_MFA_BYPASS` flag. In production mode, the bypass is strictly disabled unless explicitly overridden. In the sandbox, the OTP is shown in the UI as a stand-in for SMS or authenticator delivery; in production it would be delivered out-of-band. | For production deployment, ensure `NODE_ENV=production` and `ALLOW_SANDBOX_MFA_BYPASS` is unset; integrate production-grade hardware security keys (WebAuthn/FIDO2) or carrier-verified SMS OTP gateways. |
| **SEC-11** | **Default Sandbox JWT Secret** | The Docker compose file and environment configuration ship a default sandbox JWT secret to support frictionless single-command evaluation. If deployed to production without modification, attackers could forge authentication tokens. | **High** | In production mode, `JwtService` enforces that any supplied secret must have at least 32 characters, preventing trivial brute-force attacks. | The compose file ships a default sandbox JWT secret; it must be rotated outside the sandbox. In live production, inject cryptographically random 256-bit secrets via external secret managers (e.g., HashiCorp Vault, AWS Secrets Manager) and enforce automated secret rotation. |

---

## 5. Security Verification & Test Coverage Summary

The system is validated through comprehensive automated test suites encompassing 80 test cases across two core specifications:

1. **[security.spec.ts](backend/test/security.spec.ts) (54 tests)**:
   - Financial limits enforcement (per-transfer, daily, anomaly ceiling, non-finite values).
   - Permission tier hierarchy and human-in-the-loop confirmation enforcement.
   - Multi-objective route scoring and deadline buffer penalties.
   - Comprehensive audit trail recording across all agent actions.
   - Advanced and polyglot XSS sanitization across draft fields and conversational messages.
   - Saga compensation pattern and automated fund restoration.
   - Cross-student scoping and IDOR prevention on account balances, transfer drafts, updates, confirmations, and cancellations.
   - RESTful parameter filtering, Zod schema validation, and scrypt password hashing.

2. **[security-hardening.spec.ts](backend/test/security-hardening.spec.ts) (26 tests)**:
   - IP-based rate limiting on authentication and conversational endpoints.
   - JWT authentication requirements and unauthorized 401 rejections.
   - Cross-student account read blocking (403 Forbidden).
   - Administrative endpoint role gating (403 Forbidden for student tokens).
   - Production startup assertions requiring 32-character secrets and database connections.
   - Sandbox reset and demo credential route disablement in production.
   - Shell bombing and bash fork bomb defense (403 Forbidden).
   - Command injection and process execution defenses (`; rm -rf`, `$(whoami)`, `powershell`).
   - Path traversal and local file inclusion defenses (`../../etc/passwd`).
   - SQL injection attack vector neutralization.
   - Prototype pollution payload interception (`__proto__`).
   - Null byte poisoning rejection (`%00`).
   - End-to-end Saga rollback on confirmed transfers (balance and quota restoration).
   - Draft transfer safe cancellation and rollback.
   - Cross-student unauthorized rollback rejection (403 Forbidden).
   - Duplicate rollback prevention (400 Bad Request).

---

## 6. Conclusion & Production Readiness Roadmap

The Student Tuition Payment Agent sandbox implements a robust, defense-in-depth security architecture designed to prevent autonomous financial overreach, cross-tenant data leakage, and conversational manipulation. 

While the application achieves high defense-in-depth within its sandbox boundary, transition to live capital processing requires:
1. Connecting institutional KYC/identity verification to permission tier assignments.
2. Replacing in-memory rate limiting with distributed Redis edge token buckets.
3. Establishing live correspondent banking integrations with ISO 20022 message compliance and automated reconciliation.
4. Exporting audit trails to an external WORM-compliant SIEM system.
5. Undergoing an independent third-party penetration test and formal regulatory audit.
