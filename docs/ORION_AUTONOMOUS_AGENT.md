# ORION Autonomous Browser Agent

ORION is a bounded closed-loop browser agent for the Synapse Browser. It is designed to complete multi-step work on the active website while treating website content as untrusted data and requiring user approval for consequential actions.

## Execution contract

ORION uses an explicit task state machine in addition to the human-readable phase loop. Legal states are `IDLE`, `PLANNING`, `OBSERVING`, `ACTING`, `VERIFYING`, `RECOVERING`, `WAITING_FOR_USER`, `WAITING_FOR_PERMISSION`, `WAITING_FOR_AUTH`, `PAUSED`, `COMPLETED`, `FAILED`, `CANCELLED`, and `BLOCKED`. Terminal states cannot transition back into action. Illegal transitions fail closed rather than allowing the planner to mutate state arbitrarily.

Every run follows the same control loop:

| Phase | Contract |
| --- | --- |
| Observe | Inspect the active tab, URL, title, visible text, and semantic controls. |
| Understand | Maintain the user goal, current subgoal, current origin, memory, expected result, and confidence. |
| Plan | Select the next tool call within the step, time, retry, and recovery budgets. |
| Act | Use structured navigation, click, fill, key, scroll, workspace, or note operations. |
| Verify | Re-observe after navigation and important actions; success is not reported without evidence. |
| Recover | Re-observe and retry a failed action at most twice per tool call, with a global recovery cap. |

The runtime currently caps a task at **24 reasoning steps**, **two retries per action**, **eight recovery attempts**, and **10 minutes**. Cancellation aborts provider requests, workspace commands, and pending confirmations.

## Safety boundaries

The task state tracks the current origin, all observed origins, explicitly requested origins, approved origins, separate readable and writable origin sets, action history, provenance, confidence, progress hashes, completed milestones, pending approvals, and remaining budgets. Read permission does not imply write permission. A direct write is only eligible on the active origin or an explicitly writable origin, and cross-origin navigation is reviewed before the origin enters the readable set.
 A new origin not stated in the user goal requires confirmation before navigation. Only `http` and `https` URLs are accepted by the browser-agent navigation layer.

Website text, HTML, page metadata, iframes, search results, and tool output are marked as untrusted content. ORION detects common indirect prompt-injection patterns, but detection is only a signal; the stronger boundary is that untrusted content cannot override the system policy or the user goal. The planner must not reveal secrets, follow webpage instructions that conflict with the user’s goal, or claim an action completed without a fresh observation.

Clicks with labels suggesting submission, authentication, payment, purchase, deletion, publishing, transfer, or similar external side effects pause for an explicit confirmation event. The runtime constructs the action policy independently of model-provided arguments; a planner cannot set a confirmation flag to bypass this gate. Approval is bound to the normalized action, target origin, target description, and expiry window.
 A denied or expired confirmation fails the action and stops the run rather than silently continuing.

Workspace access is confined to registered project roots. Symlink escapes are rejected, file writes are size-limited, and shell execution remains subject to the existing read-only/test/build allowlist. Browser actions also receive stable idempotency keys derived from the tool name, origin, and normalized arguments. A verified duplicate consequential action is suppressed rather than replayed.

## Provenance and recovery

Every observation is labeled as untrusted web content. Findings may be recorded with source URL, source title, observation time, source state hash, destination origin, and transformation metadata. When a task crosses origins, the agent retains the provenance chain while re-establishing the new page observation and permission decision. Recovery is bounded: the runtime re-observes, records the failure, retries within the configured action budget, and stops on repeated identical state hashes or exhausted recovery attempts. It does not convert an unverified tool result into success.

## Adversarial validation

The repository includes focused tests for prompt-injection detection, formal state transitions, read/write origin behavior, idempotency, post-action verification, and cancellation. The `AgentStress.test.ts` harness processes 10,000 varied events including redirects, stale elements, delayed DOM updates, permission pauses, cross-origin changes, malformed results, retries, popups, tab churn, failures, confirmations, and cancellation. The test asserts bounded history, stable state hashes, terminal cancellation behavior, and illegal-transition rejection.

## Renderer experience

The OLED-black ORION panel intentionally stays compact. It exposes one task input, Run, Stop, live phase, confidence, remaining steps, active origin, expandable event details, and a confirmation card when a consequential action is pending. The detailed task state is attached to agent events so the UI can remain minimal while still explaining what the agent is doing.

## Research basis

The production-hardening model is also informed by Google's agentic-browser security guidance on indirect prompt injection, origin-set boundaries, separate user-alignment review, and confirmation for critical steps [1], OWASP's agent security guidance on least privilege, high-impact approval, audit trails, interruption, and idempotency [2], OWASP's prompt-injection guidance on treating external content as data and detecting obfuscated attacks [3], and BrowserGym's reproducible observation/action/termination evaluation model [4].


The trust model follows current browser-agent security guidance: webpage content must be isolated from control instructions, candidate actions must be policy-checked, and consequential actions must remain visible and confirmable. See [OWASP LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/), [OWASP Prompt Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html), [Chrome Agent Security Considerations](https://developer.chrome.com/docs/agents/security), and [Anthropic: Mitigating the Risk of Prompt Injections in Browser Use](https://www.anthropic.com/research/prompt-injection-defenses).

## Known limitations

ORION is not a universal guarantee against prompt injection, account misuse, or website-specific automation failures. It does not bypass CAPTCHAs, access controls, or permission prompts. It should be tested with adversarial pages and realistic authenticated workflows before being enabled for high-impact operations. The current implementation supplies the bounded execution substrate and policy-aware state contract; a future production planner can add task-specific schemas, stronger origin manifests, download/upload policy, and per-site permissions without changing the renderer IPC boundary.

## References

[1]: https://blog.google/security/architecting-security-for-agentic/ "Google: Architecting Security for Agentic AI"
[2]: https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html "OWASP AI Agent Security Cheat Sheet"
[3]: https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html "OWASP Prompt Injection Prevention Cheat Sheet"
[4]: https://github.com/ServiceNow/BrowserGym "ServiceNow BrowserGym"
