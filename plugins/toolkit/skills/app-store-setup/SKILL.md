---
name: app-store-setup
description: Set up a mobile app on Google Play and the App Store for the first time, through the consoles in the user's Chrome. Covers app records, signing and deep-link files, CI upload credentials, the store listing and its graphics, the policy declarations, tester tracks and TestFlight, and getting the first release ready to submit. Use when the user wants an app "on the Play Store / App Store", testers on Play testing or TestFlight, or a store listing or declaration filled in. Not for building or uploading a later build; use `ship` or the repo's release workflow.
---

# App store setup

Getting an app into the stores is a **checklist** worked through two consoles (Play Console, App Store Connect) plus the repo and its website. Most of it is forms; the hard parts are the few one-way choices and the gotchas no form warns about. The two platform playbooks hold the checklists:

- Google Play: [`play-console.md`](play-console.md)
- App Store and TestFlight: [`app-store-connect.md`](app-store-connect.md)

Use the `chrome-browser` skill for the consoles: work in new tabs of the user's signed-in Chrome, close them at the end.

## Guardrails

These hold for every step, whatever the user said earlier in the conversation:

- **Declarations wait for an OK.** Before any Save or Submit that makes a legal declaration (content rating, data safety or App Privacy, target audience and age, ads, government, financial, health, trader status, export compliance, accepting terms, signing-key choices), show the user exactly what you are about to save and wait. An answer the user's brief doesn't cover is the user's call: show the options and recommend one.
- **Passwords, 2FA and payment details are the user's.** When a console asks to sign in or verify, say which tab and wait; they type it.
- **Account permissions are confirmed first.** Inviting a user or service account, or changing who can publish, needs a yes for that specific change.
- **The send for review button is the user's click** unless they say otherwise. Everything up to it you may prepare.
- Copy secrets (keys, keystores) straight from the downloaded file into a CI secret (`gh secret set NAME < file`), then delete the file. Secrets never go in chat, commits or docs.

## Steps

1. **Inventory.** Before touching a console, find what already exists. Done when you can fill each row:
   - the repo: package / bundle id, version scheme, signing setup, the release workflow and which secrets it reads, `gh secret list` (names only), the deep-link files the app expects (`assetlinks.json`, `apple-app-site-association`) and whether the site serves them;
   - the accounts: Play developer account (personal or organization), Apple Developer membership and Team ID, which Google / Apple account Chrome is signed in as;
   - what each console already has (app records, tracks, declarations done).
2. **Store facts.** Collect the answers every form will ask, once, in one table: app name, contact email, website, privacy policy and terms URLs (check each loads), account deletion URL, what data is collected and why, whether it has ads, user-generated content or chat, purchases, target ages, countries, category, sign-in model. Take them from the user's brief and the repo's legal and privacy docs; ask for the gaps in one message.
3. **Android**, following [`play-console.md`](play-console.md).
4. **iOS**, following [`app-store-connect.md`](app-store-connect.md).
5. **Report.** Tester links, the signing fingerprints (copied exactly), what is queued and what still blocks review, and each thing only the user can do, with where to click. Save the console ids and decisions to memory if the session has one.

## Lessons that cost a session to learn

- **Reviewers can't create accounts or read email.** An email-link or OTP sign-in leaves sign-in-only features untestable for Google and Apple. Apple (guideline 2.1) expects a working demo login. Plan a reviewer login (a fixed address plus a static code the API accepts) before the first Apple submission; for Google, note the gap in App access and accept the risk only if little sits behind sign-in.
- **Deep links follow the signing key that installed the app.** A Play install is signed with Play's app signing key, not the upload key, so `assetlinks.json` must list the **app signing key** SHA-256 (plus the upload key for sideloaded builds, plus any test key). iOS needs `<TeamID>.<bundle id>` in `apple-app-site-association`. Without these, sign-in links open the browser.
- **Screenshots and graphics come from the real app.** Run the app on an emulator or simulator against live data, capture screens, and frame them with a caption in HTML rendered by headless Chrome at the exact sizes. Raw phone captures are usually taller than Play's 2:1 limit. Look at every capture before using it: a store screenshot shows any UI bug to everyone.
- **File uploads through Chrome need a readable path.** The Chrome `file_upload` tool refuses `~/Downloads`; copy the file into the session scratchpad first. When a console offers no input to target, the user picks the file: give them the exact path.
- **Console values hidden behind Copy buttons** (fingerprints, keys) can be read by clicking Copy and running `pbpaste`.
- **Material-style consoles shift sideways** when an element is clicked by reference and the panel opens off-screen; reset with `document.querySelectorAll('*').forEach(e => e.scrollLeft = 0)` and click by coordinates.
- **The Actions budget and org policies block quietly.** A private repo out of Actions minutes shows runs as "failure" without logs; a Google Cloud org may forbid new service account keys (reuse an existing account's key and grant it access instead).
