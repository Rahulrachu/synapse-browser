# Synapse Browser Agent Demonstration Results

The controlled demonstration page was served at `http://127.0.0.1:8765/agent-demo.html`.

Observed actions:

1. Initial page inspection showed the Search catalog input, Search catalog button, Message textarea, Send message button, Open details button, and a long scroll target.
2. The search field was filled with `browser automation` using its accessible label.
3. The Search catalog button was clicked and the page verified `Results loaded for “browser automation”`.
4. The message composer was filled with `Please review the workflow before sending.`.
5. The page displayed that sending is confirmation-gated, demonstrating the sensitive-action pause before clicking Send message.

Screenshots captured by the browser during the flow:

- `/home/ubuntu/screenshots/127_0_0_1_2026-08-13_03-56-24_4934.webp` — initial page
- `/home/ubuntu/screenshots/127_0_0_1_2026-08-13_03-56-41_5488.webp` — filled search and verified result
- `/home/ubuntu/screenshots/127_0_0_1_2026-08-13_03-56-51_8145.webp` — message filled, confirmation gate visible
