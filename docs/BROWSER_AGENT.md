# Browser Agent Takeover

Synapse Browser now exposes a structured browser-agent takeover layer for the active website tab. The controller runs in the Electron main process and uses the tab’s existing `webContents` to inspect the live DOM and perform user-like interactions without exposing arbitrary JavaScript execution to the renderer.

## Capability model

The renderer calls the allowlisted `browser-agent:run` IPC channel with one structured action at a time. The controller supports page inspection, navigation, clicking, filling, keyboard presses, and bounded scrolling. Inspection returns the current URL, title, visible interactive elements, and a bounded text snapshot. Targets prefer user-facing properties such as role, accessible name, label, placeholder, and visible text; a CSS selector is available only as an escape hatch.

This design follows the locator principles used by modern browser automation systems: user-facing roles and names are more resilient than brittle DOM paths, and actions should resolve the current element immediately before execution [1]. Navigation and dynamic page readiness are treated as ongoing browser state rather than a single “page loaded” moment [2].

## Safety boundaries

The controller rejects non-HTTP(S) navigation and keeps execution in the main process. It does not accept arbitrary scripts from the renderer. Clicks whose target looks like a submission, payment, purchase, deletion, publication, authentication, transfer, or other external side effect require an explicit `confirm: true` field. A production natural-language planner should preserve this pause and present the target, origin, and intended effect to the user before resuming.

This confirmation boundary is intentional. Browser agents operate with the user’s authenticated session and can affect external systems; research on browser-agent safety shows that harmful behavior can arise from a sequence of individually ordinary actions and recommends independent task/action guardrails and explicit confirmation for consequential operations [3]. The current controller is a deterministic enforcement layer, not a complete safety system: future planner work should add task-level policy checks, prompt-injection resistance, audit logging, cancellation, and domain-specific controls.

## IPC contract

```ts
await window.electron.invoke('browser-agent:run', {
  type: 'inspect',
  tabId: activeTabId,
});

await window.electron.invoke('browser-agent:run', {
  type: 'fill',
  target: { role: 'textbox', label: 'Search' },
  value: 'browser automation',
});

await window.electron.invoke('browser-agent:run', {
  type: 'click',
  target: { role: 'button', name: 'Submit' },
  confirm: true,
});
```

A result contains `ok`, the action type, an optional message, and an optional snapshot. Sensitive actions return `confirmationRequired: true` and do not touch the page until the caller retries with confirmation.

## Requirements for a full autonomous planner

The takeover controller is the execution substrate. To turn it into a full natural-language website agent, the planner must translate a user goal into bounded actions, call `inspect` after navigation and meaningful DOM changes, select targets using role/name/label/placeholder evidence, and stop when the goal is complete or the page becomes ambiguous. It should never treat page text as trusted instructions: website content is untrusted data and can contain prompt injection.

The planner should also include a maximum step budget, per-action timeout, cancellation token, action trace, origin-aware confirmation prompts, and a policy that keeps credentials, payment details, one-time codes, CAPTCHA solving, and irreversible external actions under direct user control. Frames, shadow DOM, downloads, popups, and file uploads require separate capability review before being enabled.

## References

[1]: https://playwright.dev/docs/locators "Playwright Locators"

[2]: https://playwright.dev/docs/navigations "Playwright Navigations"

[3]: https://invariantlabs.ai/blog/enhancing-browser-agent-safety "Enhancing Browser Agent Safety with Guardrails"
