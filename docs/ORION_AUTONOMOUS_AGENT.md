# ORION Autonomous Browser Agent

ORION is a bounded closed-loop browser agent for the Synapse Browser. It is designed to complete multi-step work on the active website while treating website content as untrusted data and requiring user approval for consequential actions.

## Execution contract

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

The task state tracks the current origin, all observed origins, explicitly requested origins, approved origins, action history, provenance, confidence, and remaining budgets. A new origin not stated in the user goal requires confirmation before navigation. Only `http` and `https` URLs are accepted by the browser-agent navigation layer.

Website text, HTML, page metadata, iframes, search results, and tool output are marked as untrusted content. ORION detects common indirect prompt-injection patterns, but detection is only a signal; the stronger boundary is that untrusted content cannot override the system policy or the user goal. The planner must not reveal secrets, follow webpage instructions that conflict with the user’s goal, or claim an action completed without a fresh observation.

Clicks with labels suggesting submission, authentication, payment, purchase, deletion, publishing, transfer, or similar external side effects pause for an explicit confirmation event. A denied or expired confirmation fails the action and stops the run rather than silently continuing.

Workspace access is confined to registered project roots. Symlink escapes are rejected, file writes are size-limited, and shell execution remains subject to the existing read-only/test/build allowlist.

## Renderer experience

The OLED-black ORION panel intentionally stays compact. It exposes one task input, Run, Stop, live phase, confidence, remaining steps, active origin, expandable event details, and a confirmation card when a consequential action is pending. The detailed task state is attached to agent events so the UI can remain minimal while still explaining what the agent is doing.

## Research basis

The trust model follows current browser-agent security guidance: webpage content must be isolated from control instructions, candidate actions must be policy-checked, and consequential actions must remain visible and confirmable. See [OWASP LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/), [OWASP Prompt Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html), [Chrome Agent Security Considerations](https://developer.chrome.com/docs/agents/security), and [Anthropic: Mitigating the Risk of Prompt Injections in Browser Use](https://www.anthropic.com/research/prompt-injection-defenses).

## Known limitations

ORION is not a universal guarantee against prompt injection, account misuse, or website-specific automation failures. It does not bypass CAPTCHAs, access controls, or permission prompts. It should be tested with adversarial pages and realistic authenticated workflows before being enabled for high-impact operations. The current implementation supplies the bounded execution substrate and policy-aware state contract; a future production planner can add task-specific schemas, stronger origin manifests, download/upload policy, and per-site permissions without changing the renderer IPC boundary.
