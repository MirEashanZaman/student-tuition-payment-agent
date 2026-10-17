# Security & Compliance Assessment Report
**FinTechathon 2026 | International Track — Topic C: Cross-Border & Student Finance Assistant**
**Project:** Student Tuition Payment Agent
**Assessment Date:** 2026-10-17
**Scope:** Repository implementation for the FinTechathon sandbox. This document serves as a comprehensive security self-assessment report detailing the permission tiers architecture, access control enforcement, and the formal known-risk register.

## 1. Executive Summary & Assessment Scope

This self-assessment evaluates the software architecture, cryptographic safeguards, guardrails, and risk boundaries implemented in the Student Tuition Payment Agent sandbox application. The application enables Bangladeshi university students to compute, compare, draft, and confirm cross-border tuition remittances while preventing unauthorized balance depletion, over-limit transactions, prompt-injection attacks, cross-account data leakage, and automated agent overreach.

The assessment covers:
- Tri-tier permission architecture and role-based access control.
- In-depth permission matrix across all REST endpoints and agent tools.
- Human-in-the-loop confirmation controls and token lifecycles.
- Financial safety guardrails (per-transfer limit, daily limit, anomaly ceiling).
- Prompt-injection defenses and input sanitization (XSS and script neutralization).
- Immutable audit trail recording and event schema.
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
   - **Crucial Safety Boundary:** The AI agent and automated background workers are strictly barred from the `EXECUTE` tier. Even when a user session possesses `EXECUTE` permissions, `AgentToolsService.confirmTransfer` requires `isUserInitiated = true`, a matching cryptographic single-use confirmation token, token freshness within 15 minutes, and explicit boolean user consent (`userConsent: true`).
   - **Enforcement Guard:** `@RequirePermissionTier(PermissionTier.EXECUTE)` and `PermissionTierValidator.validateToolExecution`.

### Permission Matrix

| Endpoint / Action | Method | Minimum Tier | Scoping Guard | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/accounts/:id` | `GET` | `READ_ONLY` | `StudentScopeGuard` | Student balance, daily limit, and remaining allowance |
| `/api/rates` | `GET` | Public | None | Remittance corridors, inverse rates, flat & percentage fees |
| `/api/rates/:id` | `GET` | Public | None | Detailed corridor clearing speed and reliability profile |
| `/api/routes/compare` | `POST` | `READ_ONLY` | `StudentScopeGuard` | Algorithmic multi-objective route ranking |
| `/api/chat` | `POST` | `READ_ONLY` | `StudentScopeGuard` | Conversational assistant with prompt injection filter |
| `/api/transfers` | `GET` | `READ_ONLY` | `StudentScopeGuard` | Authenticated student transfer history |
| `/api/transfers/:id` | `GET` | `READ_ONLY` | `assertTransferOwner` | Specific transfer status and corridor details |
| `/api/audit` | `GET` | `READ_ONLY` | Account Scoped | Authenticated student immutable audit log |
| `/api/audit/:id` | `GET` | `READ_ONLY` | Account Scoped | Specific audit record entry |
| `/api/transfers/draft` | `POST` | `DRAFT` | `StudentScopeGuard` | Pre-transaction reservation draft with single-use token |
| `/api/transfers/:id` | `PUT/PATCH` | `DRAFT` | `assertTransferOwner` | Modifies university or registration number |
| `/api/transfers/:id` | `DELETE` | `DRAFT` | `assertTransferOwner` | Discards pending draft prior to confirmation |
| `/api/transfers/:id/cancel`| `POST` | `DRAFT` | `assertTransferOwner` | Cancels draft and logs `TRANSFER_CANCELLED` |
| `/api/transfers/:id/confirm`| `POST` | `EXECUTE` | `assertTransferOwner` | Debits balance, updates daily spent, advances state |
| `/api/transfers/:id/compensate`| `POST` | `EXECUTE` | `assertTransferOwner` | Saga rollback restoring reserved funds upon rail failure |
| `/api/transfers/:id/rollback`| `POST` | `EXECUTE` | `assertTransferOwner` | Saga rollback restoring student balance and unreserving gateway funds |
| `/api/accounts/:id/limits`| `PUT` | `EXECUTE` | `AdminRoleGuard` | Administrative limit adjustment |
| `/api/accounts/:id/deposit`| `POST` | `EXECUTE` | `AdminRoleGuard` | Administrative account funding |
| `/api/rates/:id` | `PUT/DELETE`| `EXECUTE` | `AdminRoleGuard` | Administrative corridor rate configuration |

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

---

## 3. Input, Abuse, and Runtime Controls

- **Security Armor WAF Middleware (`SecurityArmorMiddleware`)**: Protects application endpoints by recursively inspecting paths, parameters, query strings, headers, and parsed JSON request bodies. Neutralizes bash fork bombs (`:(){ :|:& };:`), command execution (`rm -rf`, `cat /etc/passwd`, `$(whoami)`, `` `whoami` ``, `powershell`, `cmd.exe /c`), path traversal (`../`, `..\`, `%2e%2e`), SQL injection (`UNION ALL SELECT`, `; DROP TABLE`, `; TRUNCATE TABLE`), prototype pollution (`__proto__`, `constructor.prototype`), null byte poisoning (`%00`, `\0`), and deep payload nesting bombs (>10 levels). Blocked requests trigger immediate HTTP 403 Forbidden responses and immutable audit logs under `PENETRATION_ATTACK_BLOCKED`.
- **Payload Sanitization (XSS Protection)**: `PromptInjectionFilter.sanitizeUserText` sanitizes HTML entities (`&`, `<`, `>`, `"`, `'`) across user prompts, university names, and student registration numbers, neutralizing script injection, polyglot payloads, SVG onload triggers, and attribute escapes.
- **Data Boundary Encapsulation**: User inputs are treated strictly as passive data payloads enclosed in `[DATA_PAYLOAD]` markers, preventing language models from misinterpreting text as instructions.
- **Request Body Quotas**: Express body parsers enforce a strict 16 KB payload ceiling. DTO validation pipes reject non-whitelisted fields, negative numbers, and out-of-range amounts.
- **Sliding-Window Rate Limiting**: `ApiRateLimitMiddleware` enforces client IP rate limiting: 5 attempts per 15 minutes on `/api/auth/login`, 20 requests per minute on `/api/chat`, and 120 requests per minute across general API endpoints.
- **Hardened HTTP Headers**: Helmet sets `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, and strips `X-Powered-By`.
- **Least-Privilege Containers**: Backend and frontend containers run as unprivileged `node` users with `read_only` root filesystems, dropped capabilities (`ALL`), `no-new-privileges: true`, and strict memory/CPU limits.

---

## 4. Known-Risk List (Risk Register)

The following risk register categorizes known vulnerabilities, structural limitations, and residual risks in this sandbox implementation, accompanied by impact assessments, active mitigations, and required production follow-ups.

| Risk ID | Category | Threat / Vulnerability Description | Severity | Current Sandbox Mitigation | Residual Risk & Required Production Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **Identity & Session** | Stateless JWT stored in client-side storage is susceptible to theft via physical device compromise or token leakage. | **High** | Short-lived tokens, HMAC-SHA256 signature verification, strict CORS allowlist, and zero client token exposure across SSR routes. | In production, migrate to secure, HttpOnly, SameSite=Strict cookies with rotating refresh tokens and server-side Redis revocation blocklists. |
| **SEC-02** | **Session Escalation** | Self-selection of permission tiers at registration could allow students to self-provision `EXECUTE` rights. | **High** | Physical human confirmation, single-use token match, 15-minute token TTL, and balance checks are enforced on every transfer regardless of tier. | Production requires server-side tier provisioning bound to institutional student verification and step-up biometric/SMS MFA for execution. |
| **SEC-03** | **Rate Limiting** | Rate limiting is implemented in-memory per Node.js process; counters reset on container restart and do not coordinate across horizontally scaled replicas. | **High** | Local sliding-window limiter throttles individual containers (5 auth / 15m, 20 chat / min, 120 api / min) with automated Retry-After headers. | Deploy distributed Redis token-bucket rate limiting at the API Gateway or ingress controller level with cloud-edge WAF / DDoS filtering. |
| **SEC-04** | **Financial Settlement** | Financial settlement corridors operate on simulated gateways (`MockBankGateway`) rather than actual SWIFT / RTGS banking rails. | **High** | High-fidelity mock banking gateway simulates settlement latencies, wire reference numbers, fee calculations, and Saga compensation rollbacks. | Integrate real correspondent banking APIs, ISO 20022 clearing rails, end-of-day bank reconciliation, and automated AML/CFT sanctions screening. |
| **SEC-05** | **Adversarial AI / LLM** | Prompt injection attacks might attempt novel multi-turn semantic jailbreaks to bypass conversational assistant rules. | **Medium** | Two-tier defense: `PromptInjectionFilter` heuristics intercept malicious keywords, while user prompts are wrapped in passive `[DATA_PAYLOAD]` delimiters. Limits and tiers are hardcoded in core NestJS code and cannot be modified by chat prompts. | Incorporate dedicated LLM guardrail models (e.g. Llama Guard, NeMo Guardrails) and secondary offline semantic moderation. |
| **SEC-06** | **Audit Immutability** | Audit records are stored in PostgreSQL / in-memory table where a compromised database superuser could theoretically alter records. | **Medium** | The audit log is append-only by design for all business and student operations; administrative pruning is restricted to verified `ADMIN` roles in sandbox development environments only. All 18 agent and security lifecycle events are automatically recorded with status and metadata. | Export audit logs in real-time to append-only, write-once-read-many (WORM) storage (e.g. AWS CloudTrail, Amazon QLDB, or dedicated SIEM syslog). |
| **SEC-07** | **Regulatory Compliance** | Sandbox operates without formal Bangladesh Bank Form A2 foreign exchange declaration integration or National Tax Identification (TIN) validation. | **Medium** | System models foreign tuition remittance limits (400,000 BDT per transfer, 1,000,000 BDT daily) as illustrative thresholds modeled on typical cross-border banking remittance caps and institutional velocity guardrails. | Implement formal regulatory reporting pipelines to the Bangladesh Bank Foreign Exchange Operation Department and student visa / university admission letter validation. |
| **SEC-08** | **Infrastructure Isolation** | Container limits protect individual pods from runaway memory exhaustion, but do not provide full multi-tenant kernel isolation. | **Low** | Docker containers enforce non-root user execution (`node:node`), read-only root filesystems, `no-new-privileges`, CPU/memory limits, and tmpfs volume mounts. | Deploy on hardened Kubernetes clusters with gVisor / Kata Containers runtime isolation and network security policies restricting pod egress. |
| **SEC-09** | **Exploit Surface & Shell Bombs** | Automated penetration tools or shell bombs targeting Node.js child process spawning, command injection, or path traversal. | **High** | `SecurityArmorMiddleware` actively intercepts shell bombs (`:(){ :|:& };:`), command execution, prototype pollution (`__proto__`), path traversal (`../`), and SQLi vectors. | Offload high-throughput WAF inspection to ingress Envoy filters, Coraza WAF, or Cloudflare Magic Transit in production environments. |

---

## 5. Security Verification & Test Coverage Summary

The system is validated through comprehensive automated test suites encompassing 80 test cases across two core specifications:

1. **[security.spec.ts](backend/test/security.spec.ts) (61 tests)**:
   - Financial limits enforcement (per-transfer, daily, anomaly ceiling, non-finite values).
   - Permission tier hierarchy and human-in-the-loop confirmation enforcement.
   - Multi-objective route scoring and deadline buffer penalties.
   - Comprehensive audit trail recording across all agent actions.
   - Advanced and polyglot XSS sanitization across draft fields and conversational messages.
   - Saga compensation pattern and automated fund restoration.
   - Cross-student scoping and IDOR prevention on account balances, transfer drafts, updates, confirmations, and cancellations.
   - RESTful parameter filtering, Zod schema validation, and scrypt password hashing.

2. **[security-hardening.spec.ts](backend/test/security-hardening.spec.ts) (19 tests)**:
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

The Student Tuition Payment Agent sandbox implements a robust, institutional-grade security architecture designed to prevent autonomous financial overreach, cross-tenant data leakage, and conversational manipulation. 

While the application achieves high defense-in-depth within its sandbox boundary, transition to live capital processing requires:
1. Connecting institutional KYC/identity verification to permission tier assignments.
2. Replacing in-memory rate limiting with distributed Redis edge token buckets.
3. Establishing live correspondent banking integrations with ISO 20022 message compliance and automated reconciliation.
4. Exporting audit trails to an external WORM-compliant SIEM system.
5. Undergoing an independent third-party penetration test and formal regulatory audit.
