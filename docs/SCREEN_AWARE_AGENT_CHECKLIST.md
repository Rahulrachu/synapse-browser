# Screen-Aware Agent Implementation Checklist

## Project boundary

Work only in `Rahulrachu/synapse-browser`. Do not import, reference, merge, or modify any separate ORION AI Platform project.

## Core architecture

The agent must preserve the existing DOM controller and add a hybrid screen-aware layer. The required loop is: observe DOM and screenshot, understand, plan, ground a target, act through the real browser interaction layer, observe again, verify, recover when needed, and continue within bounded budgets.

## Visual perception

The production path must capture real browser screenshots with timestamp, tab ID, URL, viewport dimensions, device-pixel ratio, scroll position, and image dimensions. A provider abstraction must expose screenshot analysis, target detection, OCR/text reading, region description, and target localization. Unavailable providers must return explicit unavailable/error states rather than fabricated results.

Detected targets must include category, description, bounds, center, confidence, nearby text, likely action, clickability, and visibility. OCR must return recognized text, bounding boxes, confidence, and reading order. The system must support DOM-poor and visually rendered controls without hardcoded site-specific selectors or coordinates.

## Hybrid grounding and actions

For every visual-capable action, inspect DOM, capture a screenshot, analyze visual state, match DOM elements to visual regions, score candidates, select a safe target, execute through actual browser input APIs, capture a fresh observation, and verify a state transition. Coordinate clicks require visibility, in-viewport bounds, overlay checks, confidence thresholds, permission checks, real input dispatch, and post-action observation.

Confidence must be configurable. High-confidence matches may execute, medium-confidence matches require additional grounding, and low-confidence matches must stop or ask for confirmation. The agent must never randomly click.

## Recovery and state

Maintain goal, subgoal, current URL/tab, page state, observations, actions, expected and actual outcomes, confidence, attempts, recovery count, approved origins, and sensitive-action state. Handle moved targets, navigation, popups, cookie banners, modals, stale targets, failed DOM actions, failed visual actions, and unexpected pages by invalidating stale observations and re-grounding.

## Safety

Preserve confirmation requirements for send, submit, post, publish, delete, payment, purchase, transfer, authentication, account creation, and irreversible actions. Visual intelligence must never bypass the existing policy.

## Validation and deliverables

Add unit tests for screenshot capture, perception, OCR, bounds, confidence, hybrid grounding, actions, verification, recovery, and safety. Add real browser E2E tests for search/navigation, a visually obvious but semantically poor target, popup recovery, dynamic movement, and sensitive-action confirmation. Add stress metrics for repeated multi-step tasks. Demonstrate at least one DOM task, one visual-click task, and one recovery task with screenshots and operational summaries, without exposing private chain-of-thought.

The final report must state the before/after capability, missing pieces, implementation files, provider used, screenshot/OCR/grounding/click/verification/recovery/safety details, E2E tests and counts, real tasks completed, limitations, and final commit hash. Never claim screen awareness without evidence of a real screenshot, target identification, real click, fresh observation, and verified state change.
