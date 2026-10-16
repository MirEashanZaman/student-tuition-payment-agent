# Security Self-Assessment Report

**Project:** Student Tuition Payment Agent
**Assessment date:** 2026-10-16
**Scope:** Repository implementation for the FinTechathon sandbox. This is a self-assessment, not an independent penetration test, compliance certification, or production-readiness approval.

## 1. Authorization and Data Isolation

The API authenticates protected routes with JWTs, enforces minimum permission tiers, and scopes account and transfer access to the authenticated student's records. Transfer-ID operations load the transfer and compare its student owner rather than treating the transfer ID as a student ID. Audit reads are filtered by the authenticated account. Administrative mutations require a JWT whose database-backed role is `ADMIN`; sandbox reset and export are disabled in production.

The tiers are ordered minimum levels (`READ_ONLY` < `DRAFT` < `EXECUTE`), not independent roles. **Known limitation:** student logins are currently issued `EXECUTE`, so the app does not yet provide least-privilege tier assignment for different student workflows. Administrators must be provisioned through a trusted database/operations process; there is no public role-escalation route.

## 2. Input, Abuse, and Runtime Controls

- JSON and URL-encoded request bodies are limited to 16 KB. DTO validation rejects unknown fields and validates relevant lengths, amounts, dates, and enumerated preferences.
- The API applies bounded, per-IP in-memory rate limits: login 5 requests per 15 minutes, chat 20 per minute, and other API requests 120 per minute.
- CORS origins use an explicit allowlist. The backend sets security response headers and disables `X-Powered-By`.
- Production startup requires an explicitly configured JWT secret of at least 32 characters and a working PostgreSQL database. The known development signing-secret fallback is not accepted in production. Demo student credentials are not seeded or exposed in production.
- Backend and frontend Docker services run as the unprivileged `node` user and have CPU, memory, process-count, capability, and `no-new-privileges` restrictions.
- The source does not intentionally execute user-provided shell commands. The container limits reduce the impact of resource exhaustion; they do not make the application immune to denial-of-service attacks.

The in-memory rate limiter is per process, not shared across replicas, and its IP identity depends on the network/proxy configuration. Production deployments need a trusted reverse proxy or gateway with shared rate limits, request timeouts, TLS, and WAF/DDoS protections. CORS is a browser control, not authentication.

## 3. Financial and Prompt Safeguards

- Financial controls enforce configured per-transfer and daily limits, reject non-positive amounts, and flag unusually large amounts.
- Transfer confirmation requires a pending transfer, a matching confirmation token, explicit user consent, and a fresh financial-limit check.
- Prompt-injection detection blocks recognized override/bypass attempts before handing messages to the agent. User-facing text is escaped, and React renders ordinary text as text rather than markup.
- These checks have regression coverage in `backend/test/security.spec.ts` and HTTP authorization/rate-limit coverage in `backend/test/security-hardening.spec.ts`. Passing tests establish only the tested cases, not complete attack prevention.

## 4. Audit Logging

The backend records authentication, transfer, safety, and agent events. Audit reads are ownership-scoped; deletion is admin-only. The audit log is still ordinary mutable application/database data: it has no external append-only storage, cryptographic chaining, or demonstrated tamper detection. Some agent events use a loopback IP instead of verified client provenance. Do not treat these records as tamper-proof compliance evidence.

## 5. Known Risks and Follow-Up

| Priority | Known risk | Exposure / impact | Recommended action |
|---|---|---|---|
| High | Student sessions all receive `EXECUTE` | A student session satisfies routes requiring execution permission, even when its workflow should be read-only or draft-only. | Assign least-privilege tiers from trusted server-side policy and add an independent step-up approval for execution. |
| High | Rate limiting is local and in-memory | Limits reset on restart and are not shared across replicas; proxy misconfiguration can also make IP-based limits ineffective. | Enforce shared limits, trusted proxy boundaries, connection/request timeouts, and DDoS controls at the edge. |
| High | Demo financial model is not production settlement | Mock corridors, demo-only seed data, and the existing confirmation boolean/token are not identity verification, MFA, provider settlement, or reconciliation. | Keep real funds disconnected until identity verification, trusted step-up approval, production payment rails, reconciliation, and independent review exist. |
| Medium | Audit records are mutable and may have incomplete provenance | An administrator can delete logs; some events record loopback addresses; no tamper-evident external retention exists. | Send logs to a restricted append-only system, retain integrity evidence, and record client metadata only from trusted proxy headers. |
| Medium | No independent security assessment has been performed | Automated tests and code-level controls cannot establish resistance to all exploit chains, dependency vulnerabilities, or deployment misconfiguration. | Run dependency scanning and an independent penetration test before exposing the service to untrusted networks. |
| Medium | Container limits do not replace host/network controls | Resource controls reduce process exhaustion impact but do not stop all CPU, network, or application-layer denial of service. | Add host-level isolation, monitoring/alerting, upstream request limits, TLS termination, and incident response procedures. |

## 6. Conclusion

The repository now includes authentication and ownership guards for sensitive routes, protected administration, bounded request handling, production secret/database checks, container resource controls, and security regression tests. These are defense-in-depth improvements, not a guarantee against penetration, shell/resource-exhaustion attacks, or other attacks. Treat the project as a demonstration sandbox; do not use it to authorize or settle real funds without the follow-up controls and independent review above.
