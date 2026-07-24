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

// WhatsApp Web (and other chat apps) play voice notes through the Web Audio
// API. Chromium can leave a freshly-created AudioContext "suspended" under its
// autoplay policy; if the app never resumes it, playback advances visually (the
// timer moves) but no samples reach any output device — the exact "plays but
// silent, not on any device" symptom. Auto-resume each context on creation and
// on the first user interaction as a safety net that doesn't depend on the app
// resuming it itself.
type AudioCtor = typeof AudioContext
const NativeAudioContext: AudioCtor | undefined =
	window.AudioContext || (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext

if (NativeAudioContext) {
	const liveContexts = new Set<AudioContext>()
	const resumeSuspended = (): void => {
		for (const ctx of liveContexts) {
			if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
		}
	}

	const PatchedAudioContext = function (...args: unknown[]) {
		const ctx = new (NativeAudioContext as new (...a: unknown[]) => AudioContext)(...args)
		liveContexts.add(ctx)
		if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
		return ctx
	} as unknown as AudioCtor
	PatchedAudioContext.prototype = NativeAudioContext.prototype
	window.AudioContext = PatchedAudioContext
	;(window as unknown as { webkitAudioContext: AudioCtor }).webkitAudioContext = PatchedAudioContext

	for (const evt of ['pointerdown', 'keydown', 'touchstart'] as const) {
		window.addEventListener(evt, resumeSuspended, { capture: true })
	}
}

// Unread detection via the tab title: most chat apps put an unread count in it,
// e.g. "(3) WhatsApp". This is language-independent and doesn't depend on the
// site's (frequently-renamed) DOM classes. Poll rather than observe: the title
// is often already set before any mutation fires, and some apps swap the whole
// <title> node — a MutationObserver on it silently misses both cases.
let lastTitleCount = -1
const readTitleBadge = (): void => {
	const match = /\(([0-9]+)\)/.exec(document.title)
	const count = match ? Number.parseInt(match[1], 10) : 0
	if (count !== lastTitleCount) {
		lastTitleCount = count
		ipcRenderer.sendToHost('hamsket:title-badge', count)
	}
}
setInterval(readTitleBadge, 2000)
readTitleBadge()
