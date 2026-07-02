# Hamsket

Free, open source, cross-platform desktop app that combines a handful of messaging services into one window with tabs.

[![CI](https://github.com/damelm/hamsket/actions/workflows/ci.yml/badge.svg)](https://github.com/damelm/hamsket/actions/workflows/ci.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](./LICENSE)

Maintained by [damelm](https://github.com/damelm). This is a from-scratch rewrite of [Hamsket](https://github.com/TheGoddessInari/hamsket) (itself a fork of [Rambox](https://github.com/saenzramiro/rambox)) — modernized stack, reduced service catalog, new icon. See [NOTICE.md](./NOTICE.md) for full lineage and [CHANGELOG.md](./CHANGELOG.md) for what changed.

## Services

- WhatsApp
- Telegram
- Slack
- Nextcloud Talk
- Element (Matrix)
- Any custom URL

## Features

- Master password with lock/unlock (Alt+F2 to lock).
- Don't disturb mode.
- Reorderable tabs, per-tab mute and notification toggles.
- Minimize to tray, notification badges, unread counts per tab.
- Self-signed certificate trust per service (for self-hosted Nextcloud Talk instances).
- Keyboard shortcuts (see the "Ver" menu).
- No telemetry, no user tracking.

## Privacy

No personal information is collected or sent anywhere by this app. Each service keeps its own isolated session (`partition:persist`) so logins survive restarts until you remove that service.

## Getting started

Requirements: [Node.js](https://nodejs.org) 20+ and npm. That's it — no Java, no Ruby, no Sencha Cmd.

```shell
git clone https://github.com/damelm/hamsket.git
cd hamsket
npm install
npm run dev
```

### Building an installer

```shell
npm run dist
```

Produces a platform-appropriate installer in `dist/` (NSIS on Windows, DMG on macOS, deb/rpm/AppImage/tar.gz on Linux) via [electron-builder](https://www.electron.build/).

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the app with hot reload. |
| `npm run build` | Production build to `out/`. |
| `npm run typecheck` | TypeScript, no emit. |
| `npm run lint` | ESLint. |
| `npm run test` | Unit tests (Vitest) + e2e smoke test (Playwright). |
| `npm run pack` | Unpacked build in `dist/` (no installer), useful for quick manual testing. |
| `npm run dist` | Full installer build. |

## Adding or editing a service

The catalog lives in [`src/shared/services-catalog.ts`](./src/shared/services-catalog.ts). Each entry needs an `id`, `name`, `icon` (a PNG in `resources/icons/`), and either a fixed `url` or `requiresCustomUrl: true`. The optional `unreadScript` is injected into the service's page on load to detect unread messages and call `hamsket.updateBadge(direct, indirect)` — see the existing entries for the pattern, and [`src/preload/service.ts`](./src/preload/service.ts) for what's available to that script.

Unread-detection selectors are the part most likely to break as these web apps change their UI — see the note in [CHANGELOG.md](./CHANGELOG.md#known-limitations) before assuming one still works.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[GNU GPL v3](./LICENSE) — see [NOTICE.md](./NOTICE.md) for attribution to the upstream projects this is derived from.
