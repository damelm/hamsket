import { useEffect, useRef, useState } from 'preact/hooks'
import type { WebviewTag } from 'electron'
import type { ServiceInstance } from '@shared/types'
import { getServiceByCatalogId } from '@shared/services-catalog'
import { toCleanChromeUA } from '@shared/user-agent'

interface Props {
	instance: ServiceInstance
	active: boolean
	reloadNonce: number
	/** Global tray-suspend signal: when true, every service unloads its webview. */
	suspended: boolean
	hibernateMinutes: number
	/** Reports whether this service's webview is currently loaded (live) or unloaded. */
	onLive: (id: string, live: boolean) => void
}

// Electron's default UA carries non-standard tokens ("OpsDesk/x", "Electron/x")
// that make services like WhatsApp Web think the browser is outdated — blocking
// even the QR login screen. Rebuild a clean, current desktop Chrome UA instead.
const DESKTOP_CHROME_UA = toCleanChromeUA(navigator.userAgent)

// <webview> is created imperatively (not as JSX) because TypeScript has no
// built-in typing for the tag's Electron-specific attributes/events, and the
// element's own methods (setAudioMuted, setZoomLevel, executeJavaScript) are
// how Electron expects you to drive it — there isn't a meaningful declarative
// prop mapping for most of it.
export function ServiceView({ instance, active, reloadNonce, suspended, hibernateMinutes, onLive }: Props) {
	const containerRef = useRef<HTMLDivElement>(null)
	// Detection reports two numbers: total unread messages (direct) and how many
	// chats have unread (indirect). The title fallback only yields a single count.
	const lastScriptMsgs = useRef(0)
	const lastScriptChats = useRef(0)
	const lastTitleCount = useRef(0)
	const readyRef = useRef(false)
	const firstNonce = useRef(reloadNonce)
	// Hibernated services drop their webview after inactivity to free RAM.
	const [sleeping, setSleeping] = useState(false)

	// Active services never sleep; opening one wakes it immediately.
	useEffect(() => {
		if (active) setSleeping(false)
	}, [active])

	// Start the inactivity countdown for hibernate-enabled services.
	useEffect(() => {
		if (active || !instance.hibernate) return
		const ms = Math.max(1, hibernateMinutes) * 60_000
		const t = setTimeout(() => setSleeping(true), ms)
		return () => clearTimeout(t)
	}, [active, instance.hibernate, hibernateMinutes])

	// The webview only exists in the DOM while loaded. Unloaded = 0 RAM for it.
	const loaded = !suspended && !sleeping

	// Report live state to the sidebar's status indicators.
	useEffect(() => {
		onLive(instance.id, loaded)
		return () => onLive(instance.id, false)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loaded, instance.id])

	useEffect(() => {
		if (!loaded) return
		const container = containerRef.current
		if (!container) return
		readyRef.current = false

		const catalog = getServiceByCatalogId(instance.catalogId)
		const webview = document.createElement('webview') as unknown as WebviewTag
		webview.setAttribute('src', instance.url)
		webview.setAttribute('partition', `persist:${instance.catalogId}:${instance.id}`)
		webview.setAttribute('allowpopups', 'true')
		webview.setAttribute('useragent', DESKTOP_CHROME_UA)
		webview.style.width = '100%'
		webview.style.height = '100%'

		const reportBadge = () => {
			// messages drives the header/tray total; chats drives the sidebar tile.
			// The title count is a fallback (chats, for most apps) when the DOM
			// script hasn't reported yet or isn't available for this service.
			const messages = Math.max(lastScriptMsgs.current, lastTitleCount.current)
			const chats =
				lastScriptChats.current || lastTitleCount.current || (lastScriptMsgs.current > 0 ? lastScriptMsgs.current : 0)
			window.hamsketApi.setBadge(instance.id, messages, chats)
		}

		webview.addEventListener('dom-ready', () => {
			readyRef.current = true
			webview.setZoomLevel(instance.zoomLevel)
			webview.setAudioMuted(instance.muted)
			if (catalog?.unreadScript) {
				webview.executeJavaScript(catalog.unreadScript).catch(() => {})
			}
		})

		webview.addEventListener('ipc-message', (event) => {
			if (event.channel === 'hamsket:badge') {
				const [direct, indirect] = event.args as [number, number]
				lastScriptMsgs.current = direct
				lastScriptChats.current = indirect
				reportBadge()
			} else if (event.channel === 'hamsket:title-badge') {
				const [count] = event.args as [number]
				lastTitleCount.current = count
				reportBadge()
			} else if (event.channel === 'hamsket:show-and-focus') {
				window.hamsketApi.focusService(instance.id)
			}
		})

		container.appendChild(webview)
		return () => {
			if (container.contains(webview)) container.removeChild(webview)
		}
		// (Re)created when the service identity/URL changes or when it loads/unloads.
		// Mutable fields (muted/zoom) are pushed imperatively below.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loaded, instance.id, instance.catalogId, instance.url])

	useEffect(() => {
		if (!readyRef.current) return
		const webview = containerRef.current?.querySelector('webview') as unknown as WebviewTag | null
		webview?.setAudioMuted(instance.muted)
	}, [instance.muted])

	useEffect(() => {
		if (!readyRef.current) return
		const webview = containerRef.current?.querySelector('webview') as unknown as WebviewTag | null
		webview?.setZoomLevel(instance.zoomLevel)
	}, [instance.zoomLevel])

	useEffect(() => {
		// Skip the initial mount; only reload when the nonce actually changes.
		if (reloadNonce === firstNonce.current) return
		const webview = containerRef.current?.querySelector('webview') as unknown as WebviewTag | null
		try {
			webview?.reload()
		} catch {
			/* webview not ready yet */
		}
	}, [reloadNonce])

	// The webview lives in its own dedicated div (containerRef) that Preact never
	// renders children into, so imperative appendChild and Preact's reconciliation
	// of the placeholder overlay don't fight over the same DOM node.
	//
	// Inactive lines are hidden with `visibility: hidden`, NOT `display: none`.
	// `display: none` removes the layout box, so Chromium tears down the <webview>
	// guest's compositor surface; switching back then shows a blank white pane until
	// it repaints ("a veces se queda en blanco al cambiar de WhatsApp"). Keeping the
	// box laid out (visibility) preserves the surface — the switch is instant and
	// never blanks — while `visibility: hidden` still skips painting, so idle lines
	// cost no GPU. Views are already stacked (position:absolute; inset:0).
	return (
		<div
			class="service-view"
			style={{ visibility: active ? 'visible' : 'hidden' }}
			aria-hidden={active ? undefined : 'true'}
		>
			<div ref={containerRef} class="service-view__host" />
			{active && !loaded && (
				<div class="service-view__placeholder">
					<div class="empty-state__glyph">😴</div>
					<p>Reanudando {instance.name}…</p>
				</div>
			)}
		</div>
	)
}
