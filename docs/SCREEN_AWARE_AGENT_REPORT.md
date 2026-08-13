# Screen-Aware Synapse Agent Implementation Report

**Author:** Manus AI  
**Repository:** `Rahulrachu/synapse-browser`  
**Scope:** The attached screen-aware agent specification was applied only to the Synapse Browser repository. No separate ORION platform repository was imported or modified.

## Executive summary

Synapse now has a **hybrid browser-agent foundation** that preserves the existing DOM semantic-action path and adds a real screenshot-backed visual path. The agent can capture the active Electron `WebContentsView`, retain tab and viewport provenance, send the screenshot to a configured vision provider, receive structured visual targets and recognized text, validate target confidence and bounds, dispatch real Electron mouse input, and verify the result through a fresh DOM observation.

The implementation does not fabricate screen understanding when a provider is absent. In that state, `observe_screen` returns `available: false` with an explicit configuration error, and the agent must not treat the visual step as successful. Consequential visual actions continue to use the existing confirmation gate.

## Before and after

| Capability | Before | After |
|---|---|---|
| Page observation | DOM text and semantic controls | DOM text plus screenshot metadata and optional visual perception |
| Screenshot capture | Not exposed to the agent | Real `WebContentsView.capturePage()` capture with URL, tab, viewport, DPR, scroll, and image dimensions |
| Visual target schema | Not present | Category/type, description, bounds, center, confidence, nearby text, likely action, clickability, visibility |
| OCR/text path | Placeholder behavior existed in the legacy visual service | Vision-provider contract returns structured text, bounds, confidence, and reading order; unavailable providers fail explicitly |
| Coordinate click | Not present | In-viewport, bounded, visible-hit-checked, confidence-gated click through `sendInputEvent` |
| Verification | DOM action verification | Fresh DOM observation after visual click; no state-change evidence means failure |
| Safety | Existing semantic confirmation policy | Same policy applies to visual targets; visual intelligence cannot bypass confirmation |
| Tests | 25 tests in 7 files | 30 tests in 8 files, including screenshot metadata, coordinate safety, bounds, confidence, and unavailable-provider behavior |

## Implementation files

| File | Change |
|---|---|
| `src/main/ScreenPerceptionService.ts` | Added screenshot, visual target, structured text, provider, confidence, bounds, and explicit-unavailable contracts. Added OpenAI-compatible vision provider selection through `SYNAPSE_VISION_*` variables with `OPENAI_*` fallback. |
| `src/main/BrowserManager.ts` | Added real screenshot capture and metadata collection. Added coordinate input dispatch with viewport, hit-target, visibility, and bounds checks. |
| `src/main/BrowserAgentController.ts` | Added `observe_visual` and `visual_click`. Visual clicks are confidence-gated, safety-gated, dispatched through Electron input APIs, and verified with fresh page state. |
| `src/main/AgentRuntime.ts` | Added `observe_screen` and `click_visual` tools to the bounded agent loop. Visual results are treated as untrusted observations, and visual actions use origin/write permissions and confirmation flow. |
| `src/main/ScreenPerceptionService.test.ts` | Added tests for target bounds, center calculation, confidence rejection, and explicit unavailable perception. |
| `src/main/BrowserManager.test.ts` | Added tests for screenshot metadata and coordinate input safety. |
| `docs/SCREEN_AWARE_AGENT_CHECKLIST.md` | Preserved the complete requirement checklist derived from the attachment. |

## Visual pipeline

The production path is:

> **Inspect DOM → capture screenshot → analyze visual state → validate/ground target → execute real input → capture fresh observation → verify state transition → bounded recovery.**

`BrowserManager.captureScreenshot()` records the active tab ID, current URL, timestamp, CSS viewport dimensions, device-pixel ratio, scroll position, image dimensions, and PNG data. The screenshot is passed to the configured provider together with the current semantic snapshot. Provider output is schema-checked and then filtered through `clampVisualTarget()`, which rejects non-finite values, invalid confidence, zero-sized regions, and out-of-viewport regions.

`BrowserManager.clickAt()` does not use arbitrary JavaScript `.click()` calls. It checks the viewport, checks that `document.elementFromPoint()` resolves to a visible hit target, and dispatches `mouseMove`, `mouseDown`, and `mouseUp` through Electron’s real browser input surface. The controller then requires a changed URL or changed page text in a fresh semantic observation before reporting success.

## Provider configuration

The default provider is explicit and configurable. Set the following environment variables before launching Synapse when screenshot analysis is desired:

```text
SYNAPSE_VISION_API_KEY=...
SYNAPSE_VISION_BASE_URL=https://api.openai.com/v1
SYNAPSE_VISION_MODEL=gpt-4o-mini
```

`OPENAI_API_KEY`, `OPENAI_API_BASE`, and the default `gpt-4o-mini` model are accepted as compatibility fallbacks. The provider requests JSON containing `targets` and `text`. Target and text output is treated as untrusted model data and never overrides policy or origin permissions.

Without a configured key, the `UnavailableVisionProvider` is used. It raises a clear error for screenshot analysis, target detection, OCR/text reading, region description, and target localization. This is intentional: a missing visual model must never produce placeholder targets or false OCR.

## Safety and recovery

The existing task-state and confirmation controls remain authoritative. Visual targets whose descriptions suggest send, submit, payment, purchase, delete, publish, post, transfer, authentication, account creation, or other consequential effects are paused for confirmation. The runtime also requires the active origin to be approved for write actions. Stale or low-confidence targets are rejected, and the normal bounded retries and recovery loop remain in force.

The implementation does not bypass authentication, CAPTCHA, user takeover, origin permission, or confirmation requirements. It also does not claim that a message was sent merely because a coordinate event was dispatched; the post-action observation must show measurable page-state change.

## Validation

The following commands passed after implementation:

```text
pnpm test --run
pnpm build
```

The final automated result was **8 test files passed and 30 tests passed**. The stress harness continues to pass its 10,000-event resilience scenario. The production Electron/Vite build completed successfully. The repository emits an existing environment warning because the package declares Node `>=24` while the validation sandbox runs Node `22.13.0`; this warning did not prevent tests or build completion.

## Evidence and limitations

The repository-level evidence is the passing test suite and the implementation paths above. A full authenticated YouTube Studio → Telegram Saved Messages run was not performed because it would require the user’s authenticated sessions and would submit an external message. That operation must be run by the user in a connected desktop session with the normal confirmation step.

A real vision-provider E2E run also requires a configured vision API key and a live Electron page. The current environment did not expose an application vision credential specifically for Synapse, so the implementation was validated through deterministic unit coverage and build validation rather than claiming an unverified visual click. This report intentionally does not claim that screenshot target detection or Telegram sending was completed end to end.

The provider currently receives DOM context alongside the screenshot to improve grounding, but it does not yet include a dedicated DOM-to-visual matching score or popup-specific target registry. Those are appropriate next enhancements after a real provider-backed E2E harness is available. The current design already fails closed when visual perception is unavailable, rejects unsafe coordinates, and preserves the working DOM path.

## Final repository state

At delivery time, the working tree contains only the intended screen-awareness source, tests, and documentation changes. Generated build output and dependency artifacts were removed from the change set. The next commit should include the files listed in the implementation table and this report.
