# Zombie Vocab Pro - PRD

## Product Summary

Zombie Vocab Pro is a game-based vocabulary learning app where players defeat zombies by answering English vocabulary questions correctly. The current priority is to make the WebApp polished, stable, and classroom-ready before expanding the same experience further on mobile.

## Product Goals

- Turn vocabulary practice into a fun repeatable game loop.
- Support Thai learners with both translation-based and definition-based comprehension.
- Make it easy for teachers or parents to add and organize word sets.
- Let multiple learners share one device through lightweight local player profiles and ranking.
- Keep the WebApp reliable enough that future mobile builds reuse the same core flow without regression.

## Current Phase

`Phase 1: WebApp-first`

Scope for this phase:

- Finish the WebApp experience first.
- Keep Google Play / Android support working, but do not prioritize new mobile-only features yet.
- Validate new vocabulary and ranking features in browser-based usage first.

## Target Users

- Primary school students practicing English vocabulary.
- Teachers preparing classroom word lists.
- Parents supporting home review on a shared device.

## Core User Experience

1. A player selects or confirms their profile.
2. A player chooses word sets to study.
3. The game starts and presents vocabulary challenges while zombies advance.
4. Correct answers defeat zombies and increase score.
5. At game over, the score is saved to the local WebApp ranking board.
6. The player can switch profiles and compare scores on the same browser/device.

## Supported Learning Modes

### Existing

- English to Thai multiple choice
- Thai to English multiple choice
- Letter arrangement
- Typing/spelling flow support in the game engine

### Newly Added

- `Definition Match`
  - Focused on Primary 2 word sets that include English definition sentences
  - The player reads an English definition and chooses the correct word

## Vocabulary Content Requirements

### Default Sets

- Existing starter/default word sets must remain available.

### Primary 2 Expansion

- Add 6 new `Primary 2` word sets from `vocab_db/`
- Each word should support, when available:
  - English word
  - Thai meaning
  - difficulty
  - part of speech
  - English definition
  - grade level
  - subject

### Content Quality Expectations

- Data should be structured in code, not left embedded in images.
- The system should degrade safely when a word has no English definition.
- New word metadata must not break older word sets.

## Ranking and Player Profile Requirements

### WebApp Scope

- Allow the player to enter a name
- Allow the player to upload a small avatar image
- Allow multiple saved local profiles on the same browser/device
- Allow setting one active profile
- Automatically save ranking entries locally after a completed run

### Ranking Board

- Show top scores first
- Break ties by more recent run
- Show:
  - player name
  - player avatar
  - score
  - level
  - played time
  - selected word sets

### Out of Scope for This Phase

- Cross-device sync
- Cloud leaderboard
- Authentication
- Teacher dashboard

## Functional Requirements

### Gameplay

- Existing gameplay loop must continue working without regression.
- New question types must plug into the current game loop without rewriting combat.
- The system should not surface `definitionMatch` when the current active vocabulary has no definitions.

### Data Management

- Word sets should be selectable from the existing selector.
- Custom word management should keep working.
- Removing or editing words must remain consistent across word sets.

### Persistence

- Vocabulary state persists locally.
- Player profiles and ranking persist locally.
- New persisted fields should merge safely with older saved settings.

## Non-Functional Requirements

- WebApp must pass local `lint` and `build`.
- New features should not break existing Android build flow.
- Ranking and avatar storage should stay lightweight enough for browser local storage.
- UI should remain usable on desktop and tablet-sized screens.

## Success Criteria

- A user can select any of the 6 new Primary 2 sets and play immediately.
- A user can encounter definition-based questions when definitions exist.
- A user can create a local profile with name and avatar.
- A completed run appears in the local ranking board.
- The app still builds cleanly for WebApp and existing Android wrapper workflows.

## Known Constraints

- Ranking is local to the current browser/device.
- Some English definitions come from teacher-provided source sheets and should be preserved closely.
- Mobile-first polish is deferred until WebApp validation is complete.

## Recommended Next Improvements

- Add weak-word tracking and targeted review mode.
- Add import/export flow for structured CSV or Google Sheets vocabulary lists.
- Add automated tests for question generation and ranking persistence.
- Add optional teacher mode for locked classroom word-set selection.
- Add cloud sync only after WebApp behavior is stable and worth promoting to shared rankings.

## Release Guidance

### WebApp

- Keep preview deploys fast and frequent.
- Validate gameplay, ranking, and word-set switching in browser first.

### Mobile

- Continue treating mobile as a downstream consumer of the WebApp logic.
- Only resume deeper mobile feature work after WebApp UX is stable.
