import { ipcRenderer } from 'electron'

// Injected into each service <webview> (contextIsolation: false there, see
// src/main/security.ts) so it can freely touch the guest page's own global
// scope — unread-count scripts and the Notification patch below only work if
// they run inside that page's own window, not an isolated bridge world.
// Talks to its host <webview> element via sendToHost/ipc-message rather than
// straight to the main process, because a preload script has no reliable way
// to know which ServiceInstance it belongs to — only the host component does.

declare global {
	interface Window {
		hamsket: {
			parseIntOrZero: (value: unknown) => number
			updateBadge: (direct: number, indirect?: number) => void
			clearUnreadCount: () => void
		}
	}
}

window.hamsket = {
	parseIntOrZero(value: unknown): number {
		const n = Number.parseInt(String(value), 10)
		return Number.isNaN(n) ? 0 : n
	},
	updateBadge(direct: number, indirect = 0) {
		ipcRenderer.sendToHost('hamsket:badge', direct, indirect)
	},
	clearUnreadCount() {
		ipcRenderer.sendToHost('hamsket:badge', 0, 0)
	}
}

// Route notification clicks back to "show and focus this tab", same as a
// native desktop notification would for a normal app window.
const NativeNotification = window.Notification
if (NativeNotification) {
	const PatchedNotification = function (title: string, options?: NotificationOptions) {
		const notification = new NativeNotification(title, options)
		notification.addEventListener('click', () => ipcRenderer.sendToHost('hamsket:show-and-focus'))
		return notification
	} as unknown as typeof Notification
	Object.defineProperty(PatchedNotification, 'permission', {
		get: () => NativeNotification.permission
	})
	PatchedNotification.requestPermission = NativeNotification.requestPermission.bind(NativeNotification)
	window.Notification = PatchedNotification
}

// Note: the original app clamped every setTimeout to a 100ms floor ("lowered
// timer granularity") to save CPU. That patch was removed in 1.0.2 — modern
// WhatsApp Web schedules audio playback with short timers and the clamp broke
// voice-message playback, while Chromium now throttles background pages on
// its own anyway.

// Fallback unread detection for services whose catalog script goes stale: most
// chat apps put an unread count in the tab title, e.g. "(3) Slack | Acme".
let lastTitleCount = 0
new MutationObserver(() => {
	const match = /^\(([0-9]+)\)/.exec(document.title)
	const count = match ? Number.parseInt(match[1], 10) : 0
	if (count !== lastTitleCount) {
		lastTitleCount = count
		ipcRenderer.sendToHost('hamsket:title-badge', count)
	}
}).observe(document.querySelector('title') ?? document.documentElement, {
	subtree: true,
	characterData: true,
	childList: true
})
