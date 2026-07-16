import { session, type BrowserWindow, type Session } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import { listServices } from './config'
import { openLinkWindow } from './link-window'
import { applyServiceProxyToSession } from './proxy'
import type { ServiceCatalogId } from '../shared/types'

// Popups from a small, fixed set of well-known OAuth/SSO providers are allowed
// for every service (e.g. Slack's "Sign in with Google"). Self-hosted services
// (Nextcloud Talk, Element) can point at an arbitrary identity provider chosen
// by whoever runs that server, so those two catalog ids allow any popup.
const OAUTH_POPUP_HOSTS = [
	'accounts.google.com',
	'login.microsoftonline.com',
	'login.live.com',
	'appleid.apple.com'
]
const ALWAYS_ALLOW_POPUPS: ServiceCatalogId[] = ['nextcloud-talk', 'element']

/** Partitions are named `persist:<catalogId>:<instanceId>` — see ServiceView. */
function partitionFor(catalogId: string, instanceId: string): string {
	return `persist:${catalogId}:${instanceId}`
}

function findServiceForSession(guestSession: Session) {
	return listServices().find((s) => session.fromPartition(partitionFor(s.catalogId, s.id)) === guestSession)
}

/**
 * Hardens every <webview> attached to the main window.
 *
 * Service webviews intentionally keep `contextIsolation: false` and rely on
 * `nodeIntegration` being forced off below: unread-count detection and the
 * Notification/document.title patches (src/preload/service.ts) only work by
 * touching the guest page's own global scope, which requires the preload to
 * run directly in that context. Node access itself is still limited to the
 * preload script — the page's own script never gets it.
 */
export function hardenWebviews(win: BrowserWindow): void {
	win.webContents.on('will-attach-webview', (_event, webPreferences) => {
		webPreferences.nodeIntegration = false
		webPreferences.contextIsolation = false
		webPreferences.preload = join(__dirname, '../preload/service.cjs')
		// Chat apps start playback from code paths Chromium doesn't always credit
		// as a user gesture (e.g. WhatsApp voice notes queueing the next message).
		webPreferences.autoplayPolicy = 'no-user-gesture-required'
		// Keep background service webviews at full speed. Chromium throttles timers
		// and network in unfocused renderers, which can starve WhatsApp Web's
		// multi-device keep-alive websocket and make a backgrounded line drop
		// ("cae al minuto"). These are always-on messaging sessions, not idle tabs.
		webPreferences.backgroundThrottling = false
	})

	win.webContents.on('did-attach-webview', (_event, contents) => {
		// Route this line's traffic through its configured proxy (if any) before
		// it loads. No proxy set = direct. See src/main/proxy.ts.
		const owner = findServiceForSession(contents.session)
		if (owner) applyServiceProxyToSession(contents.session, owner)

		contents.setWindowOpenHandler(({ url }) => {
			let parsed: URL
			try {
				parsed = new URL(url)
			} catch {
				return { action: 'deny' }
			}

			const service = findServiceForSession(contents.session)
			const allowAll = service && ALWAYS_ALLOW_POPUPS.includes(service.catalogId)

			// OAuth popups must stay real popups (window.opener callbacks), so they
			// get an allowed child window instead of the sandboxed viewer.
			if (allowAll || OAUTH_POPUP_HOSTS.includes(parsed.hostname)) {
				return {
					action: 'allow',
					overrideBrowserWindowOptions: {
						webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
					}
				}
			}

			// Every other link a service opens (chat messages, "read more" links…)
			// lands in the isolated in-app viewer.
			if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
				openLinkWindow(url)
			}
			return { action: 'deny' }
		})

		contents.on('certificate-error', (event, _url, _error, _certificate, callback) => {
			const service = findServiceForSession(contents.session)
			if (service?.trustSelfSigned) {
				event.preventDefault()
				callback(true)
			} else {
				callback(false)
			}
		})
	})
}

export function registerNotificationPermissions(): void {
	session.defaultSession.setPermissionRequestHandler((_contents, permission, callback) => {
		callback(permission === 'notifications')
	})
}

export const resourcesDir = is.dev ? join(__dirname, '../../resources') : join(process.resourcesPath, 'resources')
