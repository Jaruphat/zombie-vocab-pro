# Zombie Vocab Pro - Google Play Store Checklist (June 23, 2026)

## 0) Scope and approach
- [x] Use `Capacitor` to wrap current React/Vite web app into Android app.
- [x] Keep package name stable (example: `com.jaruphat.zombievocabpro`).
- [ ] Decide release channel: `Closed testing` first, then `Production`.

Project status now:
- Web app is ready.
- Capacitor config and `android/` project are already checked into the repo.
- Release bundle flow is available through `npm run android:bundle`.
- The bundle command can auto-detect Android Studio's bundled Java when `JAVA_HOME` is not configured.
- Asset pruning and AAB size verification are in place to keep the `base` module under the 200 MB Play download limit.

---

## 1) Account and policy prerequisites
- [ ] Google Play Developer account created and paid (one-time **US$25**).
- [ ] Complete developer verification steps required by Play Console (if prompted).
- [ ] Prepare public Privacy Policy URL (HTTPS).
- [ ] Confirm data handling for Data safety form (what data is collected/shared/encrypted/deletable).

If your developer account is **Personal** and was created after **November 13, 2023**:
- [ ] Run a closed test with **at least 12 testers** for **14 consecutive days** before requesting Production access.

---

## 2) Local environment setup (Windows)
- [ ] Install latest Android Studio.
- [ ] Install Android SDK Platform **35** (Android 15) and related build tools.
- [ ] Ensure Java/Gradle toolchain is ready via Android Studio.
- [ ] Keep app target SDK compliant with current Play requirement.

---

## 3) Convert current web app to Android (Capacitor)

From project root (`zombie-vocab-pro`):

```powershell
npm run android:sync
```

Then:
- [ ] Open native project: `npx cap open android`
- [ ] Verify app id, app name, version code/version name in Android project.
- [ ] Set target/compile SDK to **35**.
- [ ] Test debug build on emulator/device.

Optional quality steps:
- [x] Generate proper app icons/splash for Android.
- [x] Verify safe area/notch behavior, landscape/portrait behavior, touch performance.

---

## 4) Release signing and AAB build
- [x] Create a release keystore (`.jks`) and store securely (backup in safe place).
- [x] Build signed **Android App Bundle (.aab)**.
- [x] Keep keystore alias/password documented securely.
- [x] Use Play App Signing (recommended/standard for new releases with App Bundles).
- [x] Ensure final App Bundle size stays within Play limit (200 MB base limit).
- [x] Add an automated post-build bundle size check for the `base` module.

---

## 5) Play Console app setup
- [ ] Create app entry in Play Console.
- [ ] Complete Store listing:
  - [ ] App name (up to 30 chars)
  - [ ] Short description (up to 80 chars)
  - [ ] Full description (up to 4000 chars)
  - [ ] Icon, feature graphic, screenshots (phone required)
- [ ] Set App category/tags/contact details.
- [ ] Set pricing and countries/regions.

---

## 6) Mandatory declarations and forms
- [ ] App access declaration (all functionality accessible for review).
- [ ] Ads declaration (yes/no).
- [ ] Content rating questionnaire.
- [ ] Target audience and content.
- [ ] Data safety form completed for release tracks (closed/open/production).
- [ ] Privacy Policy linked in Play Console and in-app where required.
- [ ] If account creation exists: account deletion requirement implemented and declared.

---

## 7) Testing track strategy
- [ ] Upload latest verified `.aab` to **Internal testing** (quick smoke test).
- [ ] Validate install/update flow, login (if any), audio, gameplay, crashes.
- [ ] Move to **Closed testing** and gather tester feedback/crash reports.
- [ ] For new personal accounts: satisfy **12 testers / 14 days** requirement.

---

## 8) Production release
- [ ] Request Production access (if account requires it).
- [ ] Create Production release with reviewed `.aab`.
- [ ] Confirm release notes and staged rollout percentage (recommended).
- [ ] Monitor review status (can take up to around 7 days in many cases).

---

## 9) Post-release operations
- [ ] Monitor Android vitals (ANR/crash).
- [ ] Monitor ratings/reviews and respond.
- [ ] Plan monthly maintenance release cycle.
- [ ] Re-check policy/target SDK deadlines each year.

---

## 10) Project-specific quick action list (next steps for this repo)
- [x] Add Capacitor dependencies and initialize config.
- [x] Add Android project and run on real device. (Android setup generated)
- [x] Produce first signed `.aab`.
- [x] Add AAB size verification to the release bundle command.
- [ ] Prepare Play listing assets + policy pages.
- [ ] Start Internal -> Closed test flow.
