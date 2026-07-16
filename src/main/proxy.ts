import { app, type Session } from 'electron'
import type { ServiceInstance } from '../shared/types'

// Per-service outbound proxy. A line can exit through a specific country's IP
// (e.g. an Argentine residential/mobile proxy for an AR WhatsApp line used from
// abroad, which is what stops WhatsApp from dropping the session). This is the
// backend half: the data model (ServiceInstance.proxy) and the wiring that
// applies it to each service's partition session. The UI to set a proxy per
// line is intentionally not built yet — when it lands, it just writes
// `service.proxy` and this code does the rest.

// partition (persist:<catalogId>:<id>) -> credentials, for authenticated proxies.
const credsByPartition = new Map<string, { username: string; password: string }>()
// Sessions we've attached proxy credentials to, so app.on('login') can match.
const sessionCreds = new WeakMap<Session, { username: string; password: string }>()

/**
 * Applies (or clears) the proxy on a service's session. Call it with the
 * session that backs the service's webview. No proxy set = direct connection.
 */
export function applyServiceProxyToSession(ses: Session, service: ServiceInstance): void {
	const p = service.proxy
	if (p && p.host && p.port) {
		ses.setProxy({ proxyRules: `${p.host}:${p.port}` })
		if (p.username) {
			const creds = { username: p.username, password: p.password ?? '' }
			credsByPartition.set(`${service.catalogId}:${service.id}`, creds)
			sessionCreds.set(ses, creds)
		} else {
			sessionCreds.delete(ses)
		}
	} else {
		ses.setProxy({ mode: 'direct' })
		sessionCreds.delete(ses)
		credsByPartition.delete(`${service.catalogId}:${service.id}`)
	}
}

/**
 * Registers the global handler that answers authenticated-proxy challenges with
 * the credentials of whichever service session is making the request. Call once
 * at startup.
 */
export function registerProxyAuth(): void {
	app.on('login', (event, webContents, _details, authInfo, callback) => {
		if (!authInfo.isProxy) return
		const creds = webContents ? sessionCreds.get(webContents.session) : undefined
		if (!creds) return
		event.preventDefault()
		callback(creds.username, creds.password)
	})
}
