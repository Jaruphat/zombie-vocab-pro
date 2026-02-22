# Zombie Vocab Pro

Zombie-themed vocabulary game (React + TypeScript + Vite + PWA).

Live site: `https://zombie-vocab-pro.vercel.app/`

## Local development

```bash
npm install
npm run dev
```

## Production checks

```bash
npm run lint
npm run build
```

## What was improved in this revision

- Fixed game-over flow bugs caused by stale `lives` checks.
- Prevented duplicate timeout handling from firing twice.
- Fixed zombie state transitions that could leave zombies stuck.
- Removed debug logs from gameplay interactions.
- Improved sprite animation code quality to pass strict lint.
- Fixed vocabulary store consistency (word updates/removals now sync with word sets).
- Reduced PWA precache payload from very large asset bundles to a mobile-safe size.
- Updated app metadata (`index.html`) for production branding.
- Removed duplicate manual service worker registration in app bootstrap.

## Android / Google Play preparation (Capacitor path)

This repo is currently a web app + PWA. For Play Store upload, wrap it as an Android app:

1. Install Capacitor packages:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```
2. Initialize Capacitor:
```bash
npx cap init "Zombie Vocab Pro" "com.yourcompany.zombievocabpro" --web-dir=dist
```
3. Add Android platform:
```bash
npx cap add android
```
4. Build web app and sync native project:
```bash
npm run build
npx cap sync android
```
5. Open Android Studio:
```bash
npx cap open android
```
6. In Android Studio, create signed release (`.aab`) and upload to Google Play Console.

## Release checklist

- Verify latest Google Play policy + target API requirements in Play Console before release.
- Add Privacy Policy URL in Play Console.
- Prepare store assets: app icon, feature graphic, screenshots, description.
- Test on real low-end and mid-range Android devices (performance + touch + audio behavior).
- Confirm app start, resume, offline handling, and orientation behavior.
