# ORION Hardening Research Notes

## Google Chrome agentic security
Source: https://blog.google/security/architecting-security-for-agentic/

Google describes indirect prompt injection as a primary threat for agentic browsers, including malicious sites, third-party iframe content, and user-generated content. The source recommends layered defense rather than a single detector: a separate user-alignment critic isolated from untrusted web content, deterministic origin-set boundaries, user confirmation for critical steps, real-time threat detection, red-team testing, and continuous monitoring.

Google's origin-set design separates read-only origins from read-writable origins. New origins cannot be added merely because page content requests them; a trusted gating function checks task relevance. Navigations that reach unexpected origins are vetted before the agent continues. This supports implementing separate readable and writable origin sets in ORION rather than one shared origin list.

## OWASP AI Agent Security Cheat Sheet
Source: https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html

OWASP identifies prompt injection, tool abuse, data exfiltration, memory poisoning, goal hijacking, excessive autonomy, high-impact action abuse, decision/approval manipulation, denial of wallet, sensitive data exposure, and supply-chain attacks as agent risks. Recommended controls include least-privilege per-tool scoping, separate read/write tool sets, explicit authorization for sensitive operations, treating all external data as untrusted, isolated and validated memory, human approval for high-impact actions, action previews, audit trails, interruption/rollback, structured output validation, rate limits, and fail-closed behavior when policy or approval validation fails.

The cheat sheet specifically recommends binding approval to the exact action using actor, tool, normalized parameters, target, timestamp, and expiry, plus replay protection and idempotency for irreversible operations.

## OWASP Prompt Injection Prevention Cheat Sheet
Source: https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html

The source catalogs direct, indirect, encoded, typoglycemia, HTML/Markdown, multi-turn, persistent, tool-manipulation, context-poisoning, and multimodal injection. It recommends structured separation between instructions and data, input validation, fuzzy matching for obfuscation, output monitoring, human approval for high-impact tools, and explicit labeling of external content as data rather than commands.

## BrowserGym
Source: https://github.com/servicenow/browsergym

BrowserGym provides a reproducible environment for web-agent evaluation across MiniWoB, WebArena, VisualWebArena, WorkArena, AssistantBench, WebLINX, OpenApps, and TimeWarp. Its open-ended loop returns observations, accepts an action, and terminates with explicit success/failure state. This supports ORION's benchmark design: evaluate task outcomes and verification, not just whether an action function ran.
