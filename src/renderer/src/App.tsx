import { useCallback, useEffect, useMemo, useState } from 'preact/hooks'
import { useServices } from './hooks/useServices'
import { useConfig } from './hooks/useConfig'
import { TabBar } from './components/TabBar'
import { ServiceView } from './components/ServiceView'
import { AddServiceDialog } from './components/AddServiceDialog'
import { PreferencesDialog } from './components/PreferencesDialog'
import { MasterPasswordScreen } from './components/MasterPasswordScreen'
import { AboutDialog } from './components/AboutDialog'
import { ServiceContextMenu } from './components/ServiceContextMenu'
import { ConfirmDialog } from './components/ConfirmDialog'
import { TitleBar } from './components/TitleBar'
import type { ServiceInstance } from '@shared/types'

export function App() {
	const { services, loaded, addService, updateService, removeService } = useServices()
	const { config, setConfig } = useConfig()
	const [activeId, setActiveId] = useState<string | null>(null)
	const [badges, setBadges] = useState<Record<string, number>>({})
	const [addOpen, setAddOpen] = useState(false)
	const [editingService, setEditingService] = useState<ServiceInstance | null>(null)
	const [preferencesOpen, setPreferencesOpen] = useState(false)
	const [aboutOpen, setAboutOpen] = useState(false)
	const [locked, setLocked] = useState<boolean | null>(null)
	const [liveSidebarWidth, setLiveSidebarWidth] = useState<number | null>(null)
	const [contextMenu, setContextMenu] = useState<{ service: ServiceInstance; x: number; y: number } | null>(null)
	// Service pending a "remove = delete session permanently" confirmation.
	const [confirmRemove, setConfirmRemove] = useState<ServiceInstance | null>(null)
	const [reloadNonces, setReloadNonces] = useState<Record<string, number>>({})
	// Lazy-load: a service's webview is only created once it has been activated.
	// Services you never open never spend RAM.
	const [activated, setActivated] = useState<Set<string>>(new Set())
	// Tray-suspend: all webviews unload while the window is hidden in the tray.
	const [suspended, setSuspended] = useState(false)
	// Per-service live state (webview loaded) — drives the sidebar status indicators.
	const [live, setLive] = useState<Record<string, boolean>>({})
	// Resolved color theme ('light' | 'dark') after applying the 'system' setting.
	const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')
	// An update finished downloading and will install on the next restart.
	const [updateReady, setUpdateReady] = useState(false)

	const reportLive = useCallback((id: string, value: boolean) => {
		setLive((prev) => (prev[id] === value ? prev : { ...prev, [id]: value }))
	}, [])

	const reloadService = (id: string) => setReloadNonces((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }))

	// Apply the color theme to the document, following the OS when set to 'system'.
	useEffect(() => {
		if (!config) return
		const mq = window.matchMedia('(prefers-color-scheme: dark)')
		const apply = () => {
			const t = config.theme === 'system' ? (mq.matches ? 'dark' : 'light') : config.theme
			setResolvedTheme(t)
			document.documentElement.setAttribute('data-theme', t)
		}
		apply()
		if (config.theme === 'system') {
			mq.addEventListener('change', apply)
			return () => mq.removeEventListener('change', apply)
		}
		return undefined
		// Only re-run when the theme setting changes, not on every config field.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [config?.theme])

	const toggleTheme = () => setConfig({ theme: resolvedTheme === 'dark' ? 'light' : 'dark' })

	// Preload-all: keep every service activated so all sessions stay live.
	useEffect(() => {
		if (config?.preloadAll && services.length > 0) {
			setActivated((prev) => {
				const next = new Set(prev)
				services.forEach((s) => next.add(s.id))
				return next.size === prev.size ? prev : next
			})
		}
	}, [config?.preloadAll, services])

	const liveCount = useMemo(() => services.filter((s) => live[s.id]).length, [services, live])

	useEffect(() => {
		if (activeId && !activated.has(activeId)) {
			setActivated((prev) => new Set(prev).add(activeId))
		}
	}, [activeId, activated])

	useEffect(() => {
		window.hamsketApi.hasMasterPassword().then(setLocked)
	}, [])

	useEffect(() => {
		return window.hamsketEvents.onServiceBadge((serviceId, direct) => {
			setBadges((prev) => ({ ...prev, [serviceId]: direct }))
		})
	}, [])

	useEffect(() => {
		return window.hamsketEvents.onSuspendState(setSuspended)
	}, [])

	useEffect(() => {
		return window.hamsketEvents.onUpdaterEvent('updater:downloaded', () => setUpdateReady(true))
	}, [])

	useEffect(() => {
		const sorted = () => [...services].sort((a, b) => a.position - b.position)

		const offMenus = [
			window.hamsketEvents.onMenuAction('menu:show-preferences', () => setPreferencesOpen(true)),
			window.hamsketEvents.onMenuAction('menu:lock', () => setLocked(true)),
			window.hamsketEvents.onMenuAction('menu:toggle-dnd', () => {
				if (config) setConfig({ dontDisturb: !config.dontDisturb })
			}),
			window.hamsketEvents.onMenuAction('menu:reload-service', () => window.hamsketApi.reloadApp()),
			window.hamsketEvents.onMenuAction('menu:show-about', () => setAboutOpen(true)),
			window.hamsketEvents.onMenuAction('menu:check-for-updates', () => window.hamsketApi.checkForUpdates()),
			window.hamsketEvents.onMenuAction('menu:tab-next', () => {
				const list = sorted()
				if (list.length === 0) return
				const i = list.findIndex((s) => s.id === activeId)
				setActiveId(list[(i + 1) % list.length].id)
			}),
			window.hamsketEvents.onMenuAction('menu:tab-previous', () => {
				const list = sorted()
				if (list.length === 0) return
				const i = list.findIndex((s) => s.id === activeId)
				setActiveId(list[(i - 1 + list.length) % list.length].id)
			})
		]

		return () => offMenus.forEach((off) => off())
	}, [services, activeId, config, setConfig])

	useEffect(() => {
		if (!activeId && services.length > 0) {
			setActiveId([...services].sort((a, b) => a.position - b.position)[0].id)
		}
	}, [services, activeId])

	if (!loaded || !config || locked === null) return null

	if (locked) {
		return (
			<div class="app-root">
				<TitleBar theme={resolvedTheme} onToggleTheme={toggleTheme} total={0} online={0} />
				<MasterPasswordScreen onUnlock={() => setLocked(false)} />
			</div>
		)
	}

	return (
		<div class="app-root">
			<TitleBar
				theme={resolvedTheme}
				onToggleTheme={toggleTheme}
				total={services.length}
				online={liveCount}
			/>
			<div class="app-shell">
			<TabBar
				services={services}
				activeId={activeId}
				badges={badges}
				live={live}
				width={liveSidebarWidth ?? config.sidebarWidth}
				onResize={setLiveSidebarWidth}
				onResizeEnd={(w) => {
					setConfig({ sidebarWidth: w })
					setLiveSidebarWidth(null)
				}}
				onSelect={setActiveId}
				onEdit={setEditingService}
				onContextMenu={(service, x, y) => setContextMenu({ service, x, y })}
				onAddClick={() => setAddOpen(true)}
				onPreferencesClick={() => setPreferencesOpen(true)}
			/>
			<div class="service-stack">
				{services.length === 0 && (
					<div class="empty-state">
						<div class="empty-state__glyph">💬</div>
						<p>Todavía no agregaste ningún servicio.</p>
						<button onClick={() => setAddOpen(true)}>Agregar servicio</button>
					</div>
				)}
				{services
					.filter((service) => activated.has(service.id))
					.map((service) => (
						<ServiceView
							key={service.id}
							instance={service}
							active={service.id === activeId}
							reloadNonce={reloadNonces[service.id] ?? 0}
							suspended={suspended}
							hibernateMinutes={config.hibernateMinutes}
							onLive={reportLive}
						/>
					))}
			</div>

			{addOpen && (
				<AddServiceDialog
					onAdd={addService}
					onUpdate={updateService}
					onRemove={removeService}
					onClose={() => setAddOpen(false)}
				/>
			)}

			{editingService && (
				<AddServiceDialog
					editing={editingService}
					onAdd={addService}
					onUpdate={updateService}
					onRemove={() => {
						const s = editingService
						setEditingService(null)
						setConfirmRemove(s)
					}}
					onClose={() => setEditingService(null)}
				/>
			)}

			{preferencesOpen && (
				<PreferencesDialog config={config} onChange={setConfig} onClose={() => setPreferencesOpen(false)} />
			)}

			{aboutOpen && <AboutDialog onClose={() => setAboutOpen(false)} />}

			{contextMenu && (
				<ServiceContextMenu
					service={contextMenu.service}
					x={contextMenu.x}
					y={contextMenu.y}
					onEdit={() => {
						setEditingService(contextMenu.service)
						setContextMenu(null)
					}}
					onReload={() => {
						reloadService(contextMenu.service.id)
						setContextMenu(null)
					}}
					onToggleMute={() => {
						updateService(contextMenu.service.id, { muted: !contextMenu.service.muted })
						setContextMenu(null)
					}}
					onToggleHibernate={() => {
						updateService(contextMenu.service.id, { hibernate: !contextMenu.service.hibernate })
						setContextMenu(null)
					}}
					onRemove={() => {
						setConfirmRemove(contextMenu.service)
						setContextMenu(null)
					}}
					onClose={() => setContextMenu(null)}
				/>
			)}

			{confirmRemove && (
				<ConfirmDialog
					title={`Quitar ${confirmRemove.name}`}
					message={`Se eliminará la sesión de «${confirmRemove.name}» por completo del disco: cierre de sesión, historial y datos guardados. Si volvés a agregar el servicio, tendrás que iniciar sesión de nuevo (escanear el QR). Esta acción no se puede deshacer.`}
					confirmLabel="Eliminar sesión"
					danger
					onConfirm={() => {
						removeService(confirmRemove.id)
						setConfirmRemove(null)
					}}
					onCancel={() => setConfirmRemove(null)}
				/>
			)}
			</div>

			{updateReady && (
				<div class="update-toast">
					<span class="update-toast__dot" />
					<span class="update-toast__text">Actualización lista — se instalará al reiniciar.</span>
					<button class="update-toast__btn" onClick={() => window.hamsketApi.quitAndInstallUpdate()}>
						Reiniciar ahora
					</button>
					<button class="update-toast__dismiss" title="Ahora no" onClick={() => setUpdateReady(false)}>
						✕
					</button>
				</div>
			)}
		</div>
	)
}
