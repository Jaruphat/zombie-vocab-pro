# Zombie Vocab Pro

Zombie-themed vocabulary game built with React, TypeScript, Vite, and PWA support.

Live site: `https://zombie-vocab-pro.vercel.app/`

## Current status

- Web build and lint pass locally.
- WebApp is the current primary delivery target.
- Capacitor Android project is already included in this repo.
- Android release flow now prunes unused sprite assets before sync/build.
- Release AAB verification now checks the `base` module against Google Play's 200 MB compressed download limit.

## WebApp highlights

- Multiple vocabulary set selection with classroom-friendly grouping
- 6 new `Primary 2` word sets imported from `vocab_db/`
- `Definition Match` mode for sentence-based English definition comprehension
- Local player profiles with small avatar upload
- Shared leaderboard support for Vercel deployments, with local fallback when cloud storage is unavailable
- Existing zombie battle loop preserved for both WebApp and Android wrapper builds

## Product direction

- `WebApp-first` right now: new features are being validated in browser before deeper mobile expansion
- Android / Google Play support is still maintained, but new product work is centered on the WebApp experience first
- See [`PRD.md`](./PRD.md) for the current product scope, priorities, and next improvements

## Local development

```bash
npm install
npm run dev
```

## Project commands

```bash
npm run lint
npm run build
npm run android:sync
npm run android:bundle
npm run android:verify-bundle
```

Notes:
- `npm run build` creates the production web build and prunes unused sprite sheets from `dist`.
- `npm run android:sync` rebuilds the web app, syncs Capacitor, and prunes copied Android web assets.
- `npm run android:bundle` builds the release `.aab`, tries to auto-detect Java from Android Studio when `JAVA_HOME` is missing, and then verifies module size after Gradle finishes.
- `npm run android:verify-bundle` can be run on an existing bundle at `android/app/build/outputs/bundle/release/app-release.aab`.

## Recent improvements

- Fixed game-over flow bugs caused by stale `lives` checks.
- Prevented duplicate timeout handling from firing twice.
- Fixed zombie state transitions that could leave zombies stuck.
- Removed debug logs from gameplay interactions.
- Improved sprite animation code quality to pass strict lint.
- Fixed vocabulary store consistency so word edits/removals stay in sync with word sets.
- Reduced PWA precache payload from very large asset bundles to a mobile-safe size.
- Added deterministic Android asset pruning to keep the Play Store bundle smaller.
- Added automated AAB size verification for the `base` module after release bundle builds.
- Added 6 structured `Primary 2` vocabulary sets with subject metadata.
- Added local player profiles with avatar upload for shared-device play.
- Added local WebApp ranking persistence and ranking UI.
- Added `definitionMatch` question mode for English definition comprehension.
- Updated app metadata (`index.html`) for production branding.
- Removed duplicate manual service worker registration in app bootstrap.

## Learning content

Vocabulary items can now include:

- English word
- Thai meaning
- difficulty
- part of speech
- English definition
- grade level
- subject

The new `Primary 2` sets use this richer structure so the game can generate comprehension questions beyond simple translation matching.

## Ranking behavior

- Player profiles remain `local-first`
- Shared leaderboard entries can sync across browsers/devices when Vercel Blob is connected
- If shared storage is unavailable, the app falls back to the current browser/device leaderboard

## Shared leaderboard setup on Vercel

1. Open the Vercel project dashboard for this site.
2. Go to `Storage` and create a `Blob` store with `Public` access.
3. Connect that Blob store to both `Preview` and `Production` for this project.
4. Redeploy the site so the `/api/leaderboard` function receives the Blob credentials.

Notes:
- The shared board stores score entries, player names, selected word set labels, and the compressed avatar image used when the score is submitted.
- Player profile editing itself still stays on each browser/device.

## Android / Google Play flow

1. Build and sync the web app into the Android wrapper:
```bash
npm run android:sync
```
2. Produce a release bundle and verify its size:
```bash
npm run android:bundle
```
3. Open the native project when you need to inspect signing, SDK, or release config:
```bash
npx cap open android
```
4. Upload the generated bundle from `android/app/build/outputs/bundle/release/app-release.aab` to Google Play Console.

## Release checklist

- Verify latest Google Play policy and target API requirements in Play Console before release.
- Add the Privacy Policy URL from `public/privacy.html` to Play Console.
- Prepare store assets: app icon, feature graphic, screenshots, and descriptions.
- Test on real low-end and mid-range Android devices for performance, touch, and audio behavior.
- Confirm app start, resume, offline handling, and orientation behavior.
- Use [`PLAY_STORE_CHECKLIST.md`](./PLAY_STORE_CHECKLIST.md) for the full store submission checklist.
