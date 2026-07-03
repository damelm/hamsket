import { useEffect, useState } from 'preact/hooks'
import { useServices } from './hooks/useServices'
import { useConfig } from './hooks/useConfig'
import { TabBar } from './components/TabBar'
import { ServiceView } from './components/ServiceView'
import { AddServiceDialog } from './components/AddServiceDialog'
import { PreferencesDialog } from './components/PreferencesDialog'
import { MasterPasswordScreen } from './components/MasterPasswordScreen'
import { AboutDialog } from './components/AboutDialog'
import { ServiceContextMenu } from './components/ServiceContextMenu'
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
	const [reloadNonces, setReloadNonces] = useState<Record<string, number>>({})

	const reloadService = (id: string) => setReloadNonces((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }))

	useEffect(() => {
		window.hamsketApi.hasMasterPassword().then(setLocked)
	}, [])

	useEffect(() => {
		return window.hamsketEvents.onServiceBadge((serviceId, direct) => {
			setBadges((prev) => ({ ...prev, [serviceId]: direct }))
		})
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
			window.hamsketEvents.onMenuAction('menu:report-issue', () =>
				window.hamsketApi.openExternal('https://github.com/damelm/hamsket/issues/new')
			),
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
		return <MasterPasswordScreen onUnlock={() => setLocked(false)} />
	}

	return (
		<div class="app-shell">
			<TabBar
				services={services}
				activeId={activeId}
				badges={badges}
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
						<p>Todavía no agregaste ningún servicio.</p>
						<button onClick={() => setAddOpen(true)}>Agregar servicio</button>
					</div>
				)}
				{services.map((service) => (
					<ServiceView
						key={service.id}
						instance={service}
						active={service.id === activeId}
						reloadNonce={reloadNonces[service.id] ?? 0}
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
					onRemove={removeService}
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
					onRemove={() => {
						removeService(contextMenu.service.id)
						setContextMenu(null)
					}}
					onClose={() => setContextMenu(null)}
				/>
			)}
		</div>
	)
}
