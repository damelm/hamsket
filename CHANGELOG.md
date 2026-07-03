# Changelog

## [1.0.3] - 2026-07-03

### Fixed

- Second pass at WhatsApp voice messages not playing (the 1.0.2 timer fix wasn't enough on its own). Live diagnosis against a real session showed the app never even opened an audio stream at the OS level, and that WhatsApp was being told the browser is "Chrome 130" while the real engine is Chromium 150 — WhatsApp Web serves version-dependent code for its voice-message player, and a stale hardcoded user agent is the classic trigger for exactly this breakage in Franz/Rambox-family apps. The UA is no longer hardcoded: it's now derived at runtime from the real one by stripping only the `OpsDesk/x` and `Electron/x` tokens, so it always matches the actual Chromium version, on every platform and after every Electron upgrade. Applied to service webviews and the link viewer.
- Webviews now run with `autoplayPolicy: 'no-user-gesture-required'` — chat apps start playback from code paths Chromium doesn't always credit as a user gesture (e.g. auto-playing the next voice note in a sequence).

## [1.0.2] - 2026-07-03

### Added

- **In-app sandboxed link viewer.** Links clicked inside a service used to be silently blocked by the popup hardening (nothing happened at all). They now open in a floating OpsDesk window running under Chromium's renderer sandbox with no Node access and a throwaway in-memory session per window — no cookies or storage shared with the services or the host UI. A toolbar shows the real URL (host highlighted, anti-phishing) with back/forward/reload, copy-link, and an "open in system browser" escape hatch for sites that refuse embedded windows. OAuth login popups (Google/Microsoft/Apple) keep opening as real popups since those flows need `window.opener`. Downloads and permission prompts inside the viewer are denied.

### Fixed

- WhatsApp voice messages (and other in-service audio) failing to play: the 100ms `setTimeout` floor inherited from the original app's "lowered timer granularity" CPU optimization broke modern audio playback scheduling. Removed — Chromium throttles background pages on its own these days.

## [1.0.1] - 2026-07-03

Bug-fix release from testing the first real Windows installer.

### Fixed

- Service tab icons showed as broken images in the packaged app. The renderer loads via `file://` in production, and the icon `<img>` tags used an absolute path (`/whatsapp.png`), which a `file://` document resolves against the filesystem root instead of the app folder — changed to a relative path (`./whatsapp.png`).
- The sidebar was a fixed 76px wide, cutting off longer service names with no way to resize it. Added a drag handle on the sidebar's right edge; the width is persisted (`sidebarWidth` in config).
- Clicking the window's close (X) button quit the app entirely instead of minimizing to tray like the rest of the app implies. The `close` event now hides the window instead, unless the app is actually quitting (tray "Salir", the menu's Quit, or Cmd+Q on macOS).
- The Windows installer ran in NSIS's silent "one-click" mode — no progress bar, no confirmation of where it installed, no success/failure screen, just closes. Switched to the assisted NSIS installer (`oneClick: false`) with a directory picker, visible progress, and a finish screen.
- The File menu quit item was labeled "Exit" (Electron's English default); now "Salir".

## [1.0.0] - 2026-07-02

Full rewrite by [Damian Peña](https://github.com/damelm), downloaded from [TheGoddessInari/hamsket](https://github.com/TheGoddessInari/hamsket) (last upstream release: v0.6.5, 2022-08-06) and renamed to **OpsDesk**. See [NOTICE.md](./NOTICE.md) for the full lineage and license terms.

### Added

- New stack: Electron 43, Vite (via `electron-vite`), Preact, TypeScript.
- `NOTICE.md`, this changelog, GitHub Actions CI (lint, typecheck, unit tests, e2e smoke tests on Windows/macOS/Linux).
- Vitest unit tests and a Playwright e2e smoke test that launches the real app.
- New application icon (headset/call-center mark, no text) replacing all upstream branding.
- `scrypt`-based master password hashing (was MD5).
- `contextIsolation: true` + `contextBridge` for the main application window (was `nodeIntegration: true` + `@electron/remote`).

### Changed

- Renamed from Hamsket to **OpsDesk** (window title, menus, tray, installer, auto-launch entry). The GitHub repository is still named `hamsket` for continuity.
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
