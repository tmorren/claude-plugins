# App Store and TestFlight checklist

Work top to bottom. Items marked **(declaration)** follow the guardrail in `SKILL.md`: show, then wait for an OK. Apple asks for the Apple ID password and 2FA often; the user types them.

## 1. Membership and agreements

- developer.apple.com → Account → **Membership details**: entity, **Team ID** (10 characters), role, renewal date. An organization enrollment needs a D-U-N-S number and can take days, so check this first.
- Banners there and in App Store Connect ask to accept an updated **Program License Agreement** or the **App Store Connect Terms of Service**; uploads and new app records fail until the Account Holder accepts **(declaration)**. Free apps need no Paid Apps agreement or banking.

## 2. App ID

- Certificates, Identifiers & Profiles → Identifiers → **+** → App IDs → App → Description, **Explicit** bundle id, capabilities. Tick the capabilities the project's `.entitlements` declares (Associated Domains for universal links, push, Sign in with Apple, …). Game controller support is an `Info.plist` key, not a capability. In-App Purchase is always on.
- Click capability checkboxes by coordinate and zoom to verify: the accessibility tree's checkbox refs point at the wrong rows. Read the Confirm page before Register.
- Certificates and provisioning profiles: let **automatic signing** make them (`xcodebuild -allowProvisioningUpdates` with an App Store Connect API key, or Xcode signed in to the team).

## 3. App record

- appstoreconnect.apple.com → Apps → **+ New App**: platform, name (unique across the store: have a fallback such as "<Name>: <short tagline>"), primary language, the bundle id from the dropdown (it appears once the App ID exists), SKU (any internal id), user access.

## 4. API key for CI

- Users and Access → **Integrations** → App Store Connect API → Team Keys → **+**, role **App Manager**. The `.p8` downloads **once**. Put it straight into CI with the Key ID and Issuer ID (for example `ASC_KEY_P8`, `ASC_KEY_ID`, `ASC_ISSUER_ID`), then delete the file.
- The CI job archives with `xcodebuild archive … -allowProvisioningUpdates -authenticationKeyPath … DEVELOPMENT_TEAM=<TeamID> CODE_SIGN_STYLE=Automatic`, and exports with an `ExportOptions.plist` of `method` `app-store-connect`, `destination` `upload`. That upload *is* the TestFlight build.
- Build numbers must grow on every upload; derive them from the version (for example `major*1000000 + minor*1000 + patch`).
- macOS runners can sit unassigned ("job was not acquired by Runner") and cost ten times Linux minutes.

## 5. Universal links

- `https://<domain>/.well-known/apple-app-site-association`, no redirect, served as `application/json` (Cloudflare Pages: a `_headers` rule, since the file has no extension):
  `{"applinks":{"details":[{"appIDs":["<TeamID>.<bundle id>"],"components":[{"/":"/path/*"}]}]}}`
- Matches the app's `com.apple.developer.associated-domains` entitlement (`applinks:<domain>`). It only verifies on a signed build (TestFlight or device), never in the simulator.

## 6. TestFlight

- A build appears under TestFlight about 15–30 minutes after upload ("Processing"). **Export compliance**: set `ITSAppUsesNonExemptEncryption` to `NO` in `Info.plist` when the app only uses HTTPS, and the question disappears **(declaration)**.
- **Internal testing**: a group of App Store Connect users (up to 100); they install from the TestFlight app at once.
- **External testing**: testers by email or a public link (up to 10,000); the first build of each version goes through **Beta App Review** (about a day), which needs the test information: description, feedback email, and sign-in details if anything is behind sign-in.

## 7. App Store listing (the version page)

- **Screenshots**: 6.9" iPhone (1320×2868 or 1290×2796) is required; 13" iPad (2064×2752) if the app runs on iPad. Up to 10 each. Capture from the simulator, frame like the Play ones.
- Promotional text, description, keywords (100 characters, comma-separated, no spaces needed), support URL (required), marketing URL, version, copyright.
- **App Review information**: contact, notes, and a **demo account** if any feature needs sign-in. Apple expects one that works (guideline 2.1); see the reviewer lesson in `SKILL.md`.
- **App Privacy** (Apps → App Privacy): data types, linked to the user or not, used for tracking or not, purposes; must agree with the app's `PrivacyInfo.xcprivacy` and the Play data safety answers **(declaration)**.
- **Age rating** questionnaire, including user-generated content and unrestricted web access **(declaration)**.
- **Pricing and availability**: price tier (free), countries.
- **Content rights** (third-party content) **(declaration)**.
- Guideline notes worth checking before review: 4.7 (apps that run HTML5 games or mini-apps: a content index, age gating and reporting), 5.1.1(v) (in-app account deletion when the app creates accounts), 4.8 (Sign in with Apple when third-party sign-in is offered).

## 8. Submit

- Add the processed build to the version, then **Add for Review** → **Submit to App Review**. That click is the user's. Typical review: 1–3 days. "Manually release this version" keeps the launch moment in the user's hands.
