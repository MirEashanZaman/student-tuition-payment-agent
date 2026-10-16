# Security Self-Assessment Report

**Project:** Student Tuition Payment Agent
**Assessment date:** 2026-10-16
**Scope:** Current repository implementation for the FinTechathon sandbox. This is a self-assessment, not an independent penetration test, compliance certification, or production-readiness approval.

## 1. Permission Tiers

The backend defines three tiers in `backend/src/agent/guardrails/permission-tier.guard.ts`. HTTP routes use JWT authentication, a minimum-tier guard, and (on selected account and transfer routes) a student-scope guard.

| Tier | Intended capability | Current enforcement |
|---|---|---|
| `READ_ONLY` | Read balances, compare remittance routes, and view audit data. | `PermissionTierValidator` permits `getBalance`, `compareRoutes`, and `getAuditLog`. Protected account, route-comparison, and transfer-list endpoints declare a minimum of `READ_ONLY`. |
| `DRAFT` | Create or manage a pending tuition-transfer draft without settling funds. | The validator permits `createTransferDraft`; draft routes require at least `DRAFT`. Creation validates financial limits and produces a pending-confirmation transfer. |
| `EXECUTE` | Confirm a pending transfer after consent and confirmation-token checks. | The validator rejects automated `confirmTransfer` calls. The confirmation service requires `userConsent: true`, a matching token, a pending transfer, and a fresh financial-limit check. The HTTP route declares `EXECUTE`. |

The tiers are ordered minimum access levels (`READ_ONLY` < `DRAFT` < `EXECUTE`), not separate user roles. **Current limitation:** `AuthService.login` issues every successful student session with `permissionTier: EXECUTE`. Consequently, the HTTP tier guard does not currently provide role-based separation between read-only, draft, and execute users. The tool validator blocks agent-initiated confirmation, but the API relies on an authenticated session, a valid draft token, and a consent boolean; it does not independently prove that a human physically clicked the UI.

## 2. Financial and Input Safeguards

- The financial guard defaults to a 400,000 BDT per-transfer limit and a 1,000,000 BDT daily limit. Environment variables can override these values.
- Non-positive amounts and amounts above the 5,000,000 BDT anomaly ceiling are rejected.
- Transfer confirmation checks available balance and limits again before settlement.
- Confirmation requires a pending transfer, matching confirmation token, and explicit `userConsent: true`.
- Prompt-injection detection blocks recognized override/bypass attempts before passing the message to the agent. User-facing text is escaped for HTML by the prompt-injection filter; React text rendering also avoids interpreting ordinary message strings as markup.
- These controls have automated regression tests in `backend/test/security.spec.ts`. Passing tests are evidence of tested cases, not proof that all attack variants are prevented.

## 3. Audit Logging

The backend records operational events such as login outcomes, transfer confirmations or rejections, safety-limit blocks, prompt-injection flags, and agent actions. Logs are stored in the configured database or the in-memory sandbox.

**The audit log is not immutable in the current application.** The controller exposes audit deletion without an authorization guard, and there is no external append-only store, cryptographic chaining, or demonstrated tamper detection. Some agent log entries also use a fixed loopback IP rather than a verified client address. Treat the log as application audit data, not a tamper-proof compliance record.

## 4. Known Risks and Follow-Up

| Priority | Known risk | Current exposure / impact | Recommended action |
|---|---|---|---|
| Critical | Unprotected administrative and data-management endpoints | Rate updates/deletions, audit-log deletion, sandbox reset, and log export do not declare authentication or permission guards in `AgentController`. A caller may change rates, erase evidence, reset data, or retrieve exported sandbox data. | Require authentication and explicit administrative permissions; disable sandbox-management endpoints outside development/test; restrict log export and deletion. |
| High | Authenticated users all receive `EXECUTE` | Students do not receive differentiated least-privilege tiers. Any authenticated student session satisfies routes requiring `EXECUTE`. | Assign tier from trusted server-side role/policy, default to least privilege, and grant execution only through a separately approved workflow. |
| High | Incomplete ownership enforcement on chat and transfer-ID operations | Chat accepts a caller-supplied student ID without the JWT/scope guards. Transfer-ID routes use `StudentScopeGuard`, which compares the route `id` directly with the JWT student ID rather than loading the transfer and checking its owner. This does not establish record ownership correctly. | Derive chat identity exclusively from the validated JWT. For every transfer operation, load the transfer and verify its owning account against the authenticated student before reading or mutating it; test cross-student IDs. |
| High | JWT signing secret has a built-in fallback | `JwtService` uses a repository-defined fallback secret when `JWT_SECRET` is absent. Deployments that omit the environment variable could accept tokens signed with a publicly known default. | Fail application startup in non-development environments unless a strong secret is configured; rotate secrets and define a key-rotation plan. |
| Medium | Confirmation is not strong step-up authentication | Confirmation checks a token and a request-provided consent boolean, but does not require re-authentication, MFA, or an independently verified approval channel. | Require step-up authentication or a trusted approval signal before real-money execution; keep the sandbox clearly separated from production. |
| Medium | Sandbox data and mock clearing rails | Seeded identities, demo credentials, in-memory fallback, and mock financial corridors are not suitable for real student accounts or settlement. | Do not connect real funds until identity verification, live provider integration, operational reconciliation, and production data controls are implemented and reviewed. |
| Medium | Audit evidence can be altered or incomplete | Logs are application/database records, can be deleted through an unguarded route, and do not have cryptographic tamper evidence or verified client-IP provenance. | Restrict write/delete access, use centralized append-only storage, add integrity verification and retention controls, and capture trusted network metadata. |
| Medium | Security controls can be misconfigured | Financial thresholds can be overridden through environment variables; fallback behavior may apply to invalid or zero values. | Validate configuration at startup, reject invalid values, and enforce production-approved limits independently of agent prompts. |

## 5. Self-Assessment Conclusion

The repository implements useful sandbox safeguards: tier definitions, transfer and daily limits, consent/token checks, prompt-injection handling, and regression tests. However, the current state has significant authorization and audit limitations described above. In particular, all student JWTs receive `EXECUTE`, several administrative endpoints are unguarded, and chat/transfer ownership checks are incomplete. **This implementation should be treated as a demonstration sandbox and must not be used to authorize or settle real funds until the high-priority risks are fixed and independently reviewed.**
