# Changelog

## [1.0.0] - 2026-07-02

Full rewrite of Hamsket by [Damian Peña](https://github.com/damelm), downloaded from [TheGoddessInari/hamsket](https://github.com/TheGoddessInari/hamsket) (last upstream release: v0.6.5, 2022-08-06). See [NOTICE.md](./NOTICE.md) for the full lineage and license terms.

### Added

- New stack: Electron 43, Vite (via `electron-vite`), Preact, TypeScript.
- `NOTICE.md`, this changelog, GitHub Actions CI (lint, typecheck, unit tests, e2e smoke tests on Windows/macOS/Linux).
- Vitest unit tests and a Playwright e2e smoke test that launches the real app.
- New application icon (headset/call-center mark, no text) replacing all upstream branding.
- `scrypt`-based master password hashing (was MD5).
- `contextIsolation: true` + `contextBridge` for the main application window (was `nodeIntegration: true` + `@electron/remote`).

### Changed

- Service catalog reduced from ~95 entries to 5: WhatsApp, Telegram, Slack, Nextcloud Talk (new — no upstream precedent), Element, plus a generic custom-URL type.
- Build no longer requires Java, Ruby, or Sencha Cmd — `npm install && npm run dev` is the entire setup.
- `electron-updater` (GitHub Releases) replaces the original custom update server.

### Removed

- Sencha Ext JS 5.1 (vendored framework, ~97 MB) and the entire Sencha Cmd/Ant build pipeline.
- `@electron/remote` usage in the main application window.
- Multi-language UI (the previous `resources/languages/*.js` files were tied to the Ext JS string system and had no equivalent in the new UI). Can be reintroduced later with a proper i18n library if needed.
- Spectron-based tests and the Azure DevOps pipeline definition.
- ~90 unused service icons and assorted legacy dev assets under `resources/`.

### Known limitations

- The unread-message detection script for each service (WhatsApp, Telegram, Slack, Element) was ported from the pre-2022 catalog and has **not been re-verified against the live sites** — these apps rename their CSS classes over time. A title-based fallback (`(3) Slack`-style unread counts) is used when a script's selector goes stale. Nextcloud Talk's script is a best-effort guess with no upstream precedent at all. Expect to need a fix here at some point.
- Windows/macOS/Linux installers are unsigned (no code-signing certificate configured).
