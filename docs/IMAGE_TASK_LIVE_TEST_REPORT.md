# Live Image Task Test Report

**Prompt tested:**

> Search for an iPhone 15 Pro Natural Titanium image, crop it to Instagram profile-picture size, and save the cropped image in the AI panel. Do not publish, send, follow, or perform any external side effect.

## Current result

The end-to-end task **still does not complete**, but the second run verified meaningful progress and exposed the next concrete capability boundaries.

| Stage | Observed result | Status |
|---|---|---|
| Renderer-only preview | The prompt is accepted, but the preview intentionally reports that ORION is available only in the Synapse desktop app. | Expected limitation |
| Desktop panel access | After native browser bounds were clamped, the ORION panel remained visible and accepted the full prompt. | Fixed and verified |
| Agent launch | The Run control started the real desktop agent and the panel changed to LIVE. | Working |
| Provider compatibility | The first run misreported an unsupported `gpt-4o-mini` model as a malformed message. The runtime now uses `OPENAI_MODEL` or supported `gpt-4.1-mini` by default and parses provider errors accurately. | Fixed and validated |
| Website navigation | ORION navigated Google to an image-search URL. | Working |
| CAPTCHA / permission boundary | Google displayed an unusual-traffic CAPTCHA and a storage-access permission prompt. ORION did not bypass either boundary. | Correctly blocked; user takeover required |
| Image acquisition, deterministic crop, and AI-panel asset save | Not reached because the search page required CAPTCHA handling, and the current tool set has no dedicated binary image download/crop/asset-save tool. | Not implemented end to end |

## Verification

The current source validation passed:

- `pnpm test --run`: **8 files passed, 31 tests passed**.
- `pnpm build`: passed.
- The desktop host launched successfully under Electron.
- The desktop screen recording finalized successfully at `/home/ubuntu/synapse-provider-fixed-task.mp4`.

## Safety behavior

The test deliberately prohibited external side effects. The agent stopped at Google’s CAPTCHA and permission boundary rather than attempting to solve, bypass, or fabricate completion. This behavior is required for a robust agent. Authenticated social-media actions, follows, message sends, and other consequential actions must remain confirmation-gated and may require user takeover.

## Remaining engineering work

The general browser-agent substrate now supports DOM observation, screenshot-backed visual observation, semantic actions, confidence-gated coordinate clicks, navigation, bounded recovery, and confirmation gates. It is **not yet a universal “any prompt” agent** because website-specific blockers and task-specific capabilities still exist.

To complete image tasks reliably, the repository needs a dedicated, policy-controlled asset pipeline: download or receive an image through an approved browser/file path, validate MIME type and size, crop deterministically to a requested aspect ratio or square dimensions, persist the result in a defined AI Workspace asset store, and render that asset in the AI panel with provenance and verification. Those operations must not be simulated by a text note.

The latest screenshots and screen recording show the real state and should be reviewed alongside this report. No claim is made that the image was cropped or saved because the test did not reach a verified asset artifact.
