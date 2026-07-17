# Changelog

## [1.5.0] - 2026-07-13

### Added

- **Visible update progress.** The update flow now shows what's happening instead of nothing:
  - "Buscar actualizaciones" shows "Buscando actualizaciones…", then either the download or **"Ya tenés la última versión."** (or an error) — a manual check always gives feedback.
  - While downloading, a toast shows **"Descargando actualización… N%"** with a progress bar.
  - When you click "Reiniciar ahora", a full-screen **"Instalando actualización… se reiniciará sola"** overlay reassures you while the silent installer runs, then the app relaunches on its own.

### Changed

- **Call-center default:** *Precargar todos los servicios al iniciar* is now on by default, so every line is live and notifying from startup. (Hibernation and tray-suspend stay off; proxy stays unset.) Adjustable in Preferencias.

## [1.4.0] - 2026-07-13

### Changed (hardening — for deployment on shared/operator machines)

- **Removed the source/repository signposts from the app.** "Acerca de" now shows only the app name, version, and "Hecho por Damián Peña"; the GitHub/source links and the "Repositorio en GitHub" / "Reportar un problema" menu items are gone. The GitHub URLs in the packaged `package.json` (author, repository, homepage, bugs) were stripped too. (The update feed `app-update.yml` still names the release repo — that's required for GitHub-based auto-update; removing it entirely would mean hosting updates on a private domain.)
- **DevTools/inspector disabled in production.** Neither the app window nor the service pages can open the inspector in a real build (still available under `npm run dev`).
- **Shipped JavaScript is obfuscated.** Production builds mangle identifiers and encode strings so the app internals aren't casually readable off disk. Applied to main, preload, and renderer; `npm run dev` stays plain. This raises the bar against curious tampering — it is not a hard lock, and anything that must be un-falsifiable (metrics, admin config) still belongs on the server.

## [1.3.2] - 2026-07-13

### Fixed

- **Updates now install silently.** "Reiniciar ahora" (and the on-quit install) used to launch the assisted setup wizard, forcing the operator to click through it. The auto-updater now runs the installer with `isSilent` so the update applies in the background and the app relaunches on its own — no dialog. (Takes effect from this version onward: a machine already on 1.3.2 updates silently; the manual step is only ever the very first install.)

## [1.3.1] - 2026-07-13

### Changed

- **Removing a service now deletes its session completely.** Previously the session folder was left on disk when a line was removed, so re-adding it created a brand-new (empty) session and left orphaned, crossed data behind. Now removing a service (any type, not just WhatsApp):
  - Asks for confirmation with a clear warning that the session — login, history, and saved data — will be permanently deleted and can't be undone.
  - Clears that session's storage/cache immediately (logout).
  - Deletes the on-disk partition folder (finished by the startup sweep below if Chromium had it locked while running).
- **Orphan sweep at startup.** Any session folder on disk that no current service points at is removed on launch, so the profile stays clean with no leftover or crossed sessions. Every live session — of any service — has exactly one folder; nothing lingers.

## [1.3.0] - 2026-07-13

### Added

- **Automatic updates from GitHub Releases.** A new GitHub Actions workflow builds the Windows installer and publishes a Release whenever a version tag (`v*`) is pushed. Installed apps check on startup (and every 6 hours), download in the background, and show a discreet "update ready — restart to apply" notice with a **Reiniciar ahora** button; the update also installs on the next normal quit. Toggle in Preferencias → *Actualizar automáticamente* (on by default). After installing 1.3.0 once, future versions arrive on their own.

### Fixed

- **Background lines dropping their WhatsApp session ("cae al minuto").** Chromium throttles timers and network in unfocused renderers, which can starve WhatsApp Web's multi-device keep-alive websocket and disconnect a line that isn't the active tab. Service webviews now run with `backgroundThrottling: false` so every line stays fully connected in the background. (Note: the geo factor — an Argentine line accessed from another country — is addressed separately by the per-line proxy below.)

### Backend (no UI yet)

- **Per-line outbound proxy — data model and wiring.** Each service can carry an optional proxy (host, port, optional user/password, country/label); the main process applies it to that line's session before it loads and answers authenticated-proxy challenges with the right credentials. No proxy = direct connection. This lets an Argentine line exit through an Argentine IP without a machine-wide VPN. The UI to assign a proxy per line is intentionally not built yet — it will write `service.proxy` and this code does the rest.

### Changed

- CI now runs on the `master` and `rewrite` branches (previously pointed at a non-existent `main`).

## [1.2.0] - 2026-07-10

### Added

- **New brand identity.** The app icon, favicon, tray icon, and installer icon are now generated from the company's four-leaf-clover logo (orange + black). Regenerate any time with `node scripts/gen-icons.cjs <logo.png>`.
- **"Operations room" redesign.** New look built around a burnt-orange (`#8C3400`) + black brand gradient:
  - Operations header with the brand gradient, the app name over a `CENTRO DE OPERACIONES` label, and a live NOC status strip (`● N en línea · ◐ N en pausa · clock`).
  - Sidebar reworked into a service control panel: real per-service live state (`EN LÍNEA` / `EN PAUSA` with a pulsing dot), a sliding active-indicator, unread badges, and a compact icons-only rail when narrowed.
  - Monospaced type for data/labels; consistent hover, focus, and press states.
- **Light and dark themes.** Preferencias → Tema (seguir al sistema / oscuro / claro), with a one-click toggle in the header. Following the OS updates live when Windows switches.
- **Preload-all option.** Preferencias → Memoria → *Precargar todos los servicios al iniciar* — loads every service at startup so all sessions are live and notifying from minute zero (recommended for call centers). Off by default; when off, each service still loads lazily on first open.
- **Real motion:** sliding active-indicator, hover row-shift, badge pop-in, live status pulse, window-entry and dialog transitions, and a smooth theme cross-fade — all disabled under "reduce motion".
- **No decorative boxes.** Removed the rounded container/pill around non-interactive elements (service icons, header logo, the NOC "en línea"/clock, the service count). Boxes are reserved for interactive controls and real indicators (buttons, unread badges); everything informational is organized with type, color, and spacing instead.

### Fixed

- Switching between already-opened services never reloads them — an opened service stays live in the background (hidden, not destroyed), so returning to it is instant with no re-fetch of chat history.

### Notes

- Clarified the memory model: lazy loading only defers a service's *first* open in a session; once opened it stays live. Hibernation and tray-suspend remain opt-in and off by default. For a call center, leave both off (and turn on preload-all) so no session ever unloads.

## [1.1.0] - 2026-07-10

### Added

- **Custom frameless title bar.** OpsDesk now draws its own dark title bar (logo, app name, minimize / maximize / close controls) instead of the gray OS frame that clashed with the dark theme. The native application menu (Archivo / Ver / Ayuda), which is hidden along with the frame, is now reached from a **☰** button in the title bar; all its keyboard shortcuts still work. The close button keeps the existing close-to-tray behavior.
- **Lazy loading of services.** A service's `<webview>` is only created the first time you open it. Services you never open in a session no longer spend any memory or CPU. On by default, no downside.
- **Per-service hibernation (opt-in).** Right-click a service → **Hibernar en segundo plano** (or enable it in the add/edit dialog). A hibernating service unloads its webview after a period of inactivity (default 15 min, configurable in Preferencias → Memoria) and shows a lightweight placeholder; reopening it reloads the page. Trade-off, stated in the UI: while asleep it receives no messages or badges until reopened. Off by default.
- **Suspend-all-on-tray (opt-in).** Preferencias → Memoria → *Descargar todos los servicios al minimizar a la bandeja*. When the window is hidden to the tray, every webview unloads to free RAM and reloads when you reopen the window. Off by default so notifications keep working unless you choose otherwise.

### Fixed

- **WhatsApp Web (and other services) no longer see an "outdated browser" / "update Chrome" gate**, which previously could block even the QR login screen. The desktop User-Agent is now rebuilt from scratch as a clean, current Chrome UA (real platform + real Chromium version only) instead of stripping tokens with a regex — the regex approach broke whenever the app name contained a space (e.g. under a test profile), leaving a non-standard product token that tripped the gate. Confirmed the QR login screen renders correctly.

### Changed

- **Visual redesign / design system.** Reworked the UI around a token-based design system (color, typography, 4px spacing scale, radii, elevation, motion). Clearer active-service state (accent pill + indicator bar), consistent hover/focus states, restyled dialogs and context menu, empty/loading placeholders, and subtle motion. Text/background pairs verified against WCAG AA (4.5:1) contrast.

### Notes

- These are OpsDesk's own optimizations on Electron; no runtime/technology change. A messaging hub that shows live notifications for every account can't reduce RAM without giving up some of those live notifications, so the aggressive levers (hibernation, tray-suspend) ship **opt-in with safe defaults** — you choose your own RAM/notifications balance.
- **Measured RAM (Windows working-set sum, overcounts shared memory):** v1.0.5 loaded every configured service eagerly at startup — one renderer process per service. A real profile with ~6 services measured **~2555 MB across 12 processes (7 renderers)** with most services never opened. v1.1.0 with lazy loading only renders services you actually open: a 2-service profile with one opened measured **~521 MB across 5 processes (2 renderers = host UI + 1 service)**; the unopened service spent nothing until selected. The startup win scales with how many configured services you leave unopened; hibernation and tray-suspend reclaim memory from services you have opened.

## [1.0.5] - 2026-07-03

### Added

- **Rename / edit services without deleting them.** Each sidebar tab now has a pencil button (appears on hover) and a right-click context menu with **Editar / renombrar…**, **Recargar**, **Silenciar audio**, and **Quitar**. Previously the only way to change a service's name was to remove it and recreate it.
- Per-service reload (from the context menu) that reloads just that tab's page instead of the whole app.

### Notes

- Investigated a report of WhatsApp voice notes being silent "on the installed app but not the one launched during testing". Root cause turned out to be environmental, not a code bug: the machine still had the **original Hamsket 0.6.5** installed alongside OpsDesk (separate app, separate `%APPDATA%` profile and WhatsApp session), and it was being launched by mistake. Audio works in OpsDesk (the autoplay-policy switch from 1.0.4 is what enables it; WhatsApp voice notes play through a plain `<audio>` element, confirmed by live instrumentation). Recommendation: uninstall the old Hamsket so only OpsDesk remains.

## [1.0.4] - 2026-07-03

### Fixed

- Third and root-cause pass at WhatsApp voice notes playing silently ("no sale por ningún dispositivo"). WhatsApp Web plays voice notes through the Web Audio API, and Chromium's autoplay policy leaves the `AudioContext` in a `suspended` state — the player advances visually but no samples ever reach an output device, which is why the OS mixer showed no stream for the app. Two fixes together:
  - Global `--autoplay-policy=no-user-gesture-required` command-line switch (the per-`<webview>` `autoplayPolicy` option added in 1.0.3 is unreliable and wasn't enough on its own).
  - The service preload now patches `AudioContext`/`webkitAudioContext` to auto-resume every context on creation and on the first user interaction, so playback isn't dependent on the web app resuming it itself.

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
