import { useEffect, useRef } from 'preact/hooks'
import type { WebviewTag } from 'electron'
import type { ServiceInstance } from '@shared/types'
import { getServiceByCatalogId } from '@shared/services-catalog'

interface Props {
	instance: ServiceInstance
	active: boolean
}

// Electron's default UA includes "OpsDesk/x" and "Electron/x" tokens. Several
// services (WhatsApp Web included, confirmed by hand) refuse to load — or
// serve subtly broken code paths, e.g. the voice-message player — when they
// spot them, or when the advertised Chrome version doesn't match the real
// engine. So strip just those tokens from the runtime UA: what's left is a
// genuine, always-current Chrome UA matching the actual Chromium version.
const DESKTOP_CHROME_UA = navigator.userAgent.replace(/\s(OpsDesk|Electron)\/\S+/g, '')

// <webview> is created imperatively (not as JSX) because TypeScript has no
// built-in typing for the tag's Electron-specific attributes/events, and the
// element's own methods (setAudioMuted, setZoomLevel, executeJavaScript) are
// how Electron expects you to drive it — there isn't a meaningful declarative
// prop mapping for most of it.
export function ServiceView({ instance, active }: Props) {
	const containerRef = useRef<HTMLDivElement>(null)
	const lastScriptCount = useRef(0)
	const lastTitleCount = useRef(0)
	const readyRef = useRef(false)

	useEffect(() => {
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
			const direct = Math.max(lastScriptCount.current, lastTitleCount.current)
			window.hamsketApi.setBadge(instance.id, direct, 0)
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
				const [direct] = event.args as [number, number]
				lastScriptCount.current = direct
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
			container.removeChild(webview)
		}
		// Only (re)create the webview when the instance identity or its fixed URL
		// changes — mutable fields like muted/zoom are pushed via imperative calls
		// below instead of remounting the whole guest page.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [instance.id, instance.catalogId, instance.url])

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

	return <div ref={containerRef} class="service-view" style={{ display: active ? 'block' : 'none' }} />
}
