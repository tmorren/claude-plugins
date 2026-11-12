# Google Play Console checklist

Work top to bottom. Each item names its place in the console and the gotcha that bit last time. Items marked **(declaration)** follow the guardrail in `SKILL.md`: show, then wait for an OK.

## 1. App record

- Home → **Create app**: name, default language, App (not Game, unless it is one), Free or Paid. Free can never become Paid later. The developer agreements on this form are acceptance of terms **(declaration)**.
- A new app is a **draft**; internal testers see a temporary name ("<package> (unreviewed)") until the first review.

## 2. First bundle, internal testing

- Test and release → Testing → **Internal testing** → Create new release.
- **Play App Signing** is normally already on ("Releases are signed by Google Play"). If the form asks, the Google-generated key is the default choice and it is fixed once an open track publishes **(declaration)**.
- **The first bundle must be uploaded by hand.** Play rejects API uploads until one exists. Build it with the repo's workflow, download the artifact, copy it to the scratchpad and use `file_upload`.
- Release name, release notes in the `<en-US>…</en-US>` block, Next, Save and publish. "No testers" and "no deobfuscation file" are warnings, not blockers.
- **Testers** tab: create an email list with the user's Play Store account (ask which), save, and read the opt-in link from the page (`https://play.google.com/apps/internaltest/<id>`).
- "Item not found" on the opt-in link means the wrong Google account in the browser or Play Store, the invite not accepted yet, or up to an hour of propagation.

## 3. App content (Policy → App content)

Each item is its own page; the overview lists what needs attention. All are **(declaration)**.

- **Privacy policy** URL.
- **Sign in details** (was "App access"): if any feature needs sign-in, choose "restricted" and add an entry (a name, credentials or instructions up to 500 characters, and a "full access" checkbox the user confirms). See the reviewer lesson in `SKILL.md`.
- **Ads**.
- **Content rating** (IARC): email, category (Game / Social or Communication / All Other App Types: pick by primary purpose), the IARC terms checkbox, then a questionnaire whose follow-ups depend on answers. List every answer for the user before saving, and again show the resulting ratings before the final Save.
- **Target audience**: picking only 13+ skips the "appeals to children" and ads questions.
- **Data safety**: collects yes/no, encrypted in transit, account creation methods, deletion URL, then each data type's collected/shared, ephemeral, required/optional and purposes. The Preview step shows what the listing will say; show it before Save.
- **Advertising ID**: check the bundle's manifest for `com.google.android.gms.permission.AD_ID` before answering No.
- **Government apps, Financial features, Health apps, News, COVID-19**: as applicable.
- **App-level trader status**: appears when the developer account is a trader; asks whether it applies and an optional Terms URL.

Every save offers "Go to Publishing overview"; changes queue there until sent for review.

## 4. Store presence

- **Store settings**: category, contact email (required), website. The contact details are "Save and publish": they go live at once.
- **Main store listing** (Grow users → Store presence → Store listings, or the dashboard's "Set up your store listing"): short description (80 characters), full description (4,000), app icon 512×512, feature graphic 1024×500, at least 2 phone screenshots (each side 320–3,840 px, the long side at most twice the short; 4 at 1080 px+ for promotion eligibility), tablet screenshots optional but needed for the tablet badge. Assets go through an asset library side panel; the upload input appears after its **Add assets** button. Drag screenshots into order.
- The Review step has an **AI asset declaration** (label assets or not) **(declaration)**.

## 5. Production (or closed testing)

- Production → **Countries / regions** → Add, tick, Save.
- Production → **Create new release** → Add from library (the bundle is already uploaded), name, the public "What's new" notes, Next, **Save**. Saving queues it; nothing is sent.
- An organization account can release straight to production; a personal account created after Nov 2023 needs a closed test with 12 testers for 14 days first.
- **Managed publishing** off means the app goes live the moment it is approved; turn it on if the user wants to pick the moment.
- Publishing overview → **Send N changes for review** unlocks once a reviewed track has a release; Google runs quick checks (up to ~15 minutes) and sends when they pass. That click is the user's.
- A notice about **catalog access** preferences refers to third-party app stores receiving Play's catalog export; the default includes the listing.

## 6. Automatic uploads from CI

- Google Cloud project: enable **Google Play Android Developer API**.
- A service account with a JSON key. If the org blocks key creation (`iam.disableServiceAccountKeyCreation`), reuse an existing account's key already in CI (for example Firebase App Distribution's).
- Play Console → **Users and permissions** → Invite new users → the service account's email, no account permissions, App permissions → the app → **Release apps to testing tracks** (confirm with the user first). It shows as Active at once.
- The workflow's upload step (for example `r0adkll/upload-google-play`) gets the JSON from a secret and uploads to `internal` with status `completed`.

## 7. Values to report

- Internal testing opt-in link.
- Setup → **App signing**: the app signing key and upload key SHA-256 fingerprints, read with the Copy buttons. Put the app signing key (and upload key) in the site's `/.well-known/assetlinks.json`.
