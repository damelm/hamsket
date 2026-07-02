# Notice

This project is a derivative work, distributed under the terms of the **GNU General Public License v3.0** (see [LICENSE](./LICENSE)), same as its upstream.

## Lineage

- Based on other open-source repositories, including **[Hamsket](https://github.com/TheGoddessInari/hamsket)** by TheGoddessInari — the repository this project was originally downloaded from.
- Modified starting **2026-07-02** by **[Damian Peña](https://github.com/damelm)**.

## What changed in this fork

Per GPL-3.0 §5(a), this notice records that the work has been modified, and when:

- The entire UI layer (previously Sencha Ext JS 5.1, vendored ~97 MB) was rewritten from scratch in TypeScript + Preact + Vite. The Sencha Cmd/Ruby/Java build toolchain was removed entirely.
- Electron was updated from 20.0.1 (2022) to 43.x.
- The service catalog was reduced from ~95 entries to 5 (WhatsApp, Telegram, Slack, Nextcloud Talk, Element) plus a generic custom-URL type.
- Security posture was hardened: `contextIsolation: true` + `contextBridge` replaces `@electron/remote` and `nodeIntegration: true` in the main application window; the master password hash was changed from MD5 to `scrypt`.
- Testing (Vitest + Playwright), linting (ESLint flat config + Prettier), and CI (GitHub Actions) were added; the previous Spectron-based test setup and Azure DevOps pipeline were removed.
- The application icon was replaced with an original design (a headset/call-center mark); no upstream branding assets remain in `resources/`.
- Multi-language UI support was dropped (see [CHANGELOG.md](./CHANGELOG.md) for the reasoning).

None of the above changes the license: this project remains GPL-3.0, source-available, and any further redistribution must carry the same license and this notice.
