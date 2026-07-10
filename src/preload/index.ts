import { contextBridge, ipcRenderer } from 'electron'
import type { AppConfig, ServiceInstance, WindowIpcApi } from '../shared/types'

const api: WindowIpcApi = {
	getVersion: () => ipcRenderer.invoke('app:version'),

	getConfig: () => ipcRenderer.invoke('config:get'),
	setConfig: (patch: Partial<AppConfig>) => ipcRenderer.invoke('config:set', patch),

	listServices: () => ipcRenderer.invoke('services:list'),
	addService: (input) => ipcRenderer.invoke('services:add', input),
	updateService: (id: string, patch: Partial<ServiceInstance>) => ipcRenderer.invoke('services:update', id, patch),
	removeService: (id: string) => ipcRenderer.invoke('services:remove', id),
	reorderServices: (orderedIds: string[]) => ipcRenderer.invoke('services:reorder', orderedIds),

	hasMasterPassword: () => ipcRenderer.invoke('masterPassword:has'),
	setMasterPassword: (password: string | null) => ipcRenderer.invoke('masterPassword:set', password),
	validateMasterPassword: (password: string) => ipcRenderer.invoke('masterPassword:validate', password),

	setBadge: (serviceId: string, direct: number, indirect: number) => {
		ipcRenderer.send('service:badge', serviceId, direct, indirect)
		return Promise.resolve()
	},
	focusService: (serviceId: string) => {
		ipcRenderer.send('service:show-and-focus', serviceId)
		return Promise.resolve()
	},
	reloadApp: () => ipcRenderer.invoke('app:reload'),
	relaunchApp: () => ipcRenderer.invoke('app:relaunch'),
	openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url),
	checkForUpdates: () => ipcRenderer.invoke('updater:check'),

	minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
	toggleMaximizeWindow: () => ipcRenderer.invoke('window:toggle-maximize'),
	closeWindow: () => ipcRenderer.invoke('window:close'),
	isWindowMaximized: () => ipcRenderer.invoke('window:is-maximized'),
	popupMenu: (x: number, y: number) => ipcRenderer.invoke('window:popup-menu', x, y)
}

const MENU_CHANNELS = [
	'menu:show-preferences',
	'menu:reload-service',
	'menu:zoom-in',
	'menu:zoom-out',
	'menu:zoom-reset',
	'menu:tab-next',
	'menu:tab-previous',
	'menu:toggle-dnd',
	'menu:lock',
	'menu:report-issue',
	'menu:check-for-updates',
	'menu:show-about'
] as const

const UPDATER_CHANNELS = [
	'updater:checking',
	'updater:available',
	'updater:not-available',
	'updater:error',
	'updater:progress',
	'updater:downloaded'
] as const

const events = {
	onMenuAction: (channel: (typeof MENU_CHANNELS)[number], listener: (...args: unknown[]) => void) => {
		if (!MENU_CHANNELS.includes(channel)) return () => {}
		const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => listener(...args)
		ipcRenderer.on(channel, handler)
		return () => ipcRenderer.removeListener(channel, handler)
	},
	onUpdaterEvent: (channel: (typeof UPDATER_CHANNELS)[number], listener: (...args: unknown[]) => void) => {
		if (!UPDATER_CHANNELS.includes(channel)) return () => {}
		const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => listener(...args)
		ipcRenderer.on(channel, handler)
		return () => ipcRenderer.removeListener(channel, handler)
	},
	onServiceBadge: (listener: (serviceId: string, direct: number, indirect: number) => void) => {
		const handler = (_event: Electron.IpcRendererEvent, serviceId: string, direct: number, indirect: number) =>
			listener(serviceId, direct, indirect)
		ipcRenderer.on('services:badge', handler)
		return () => ipcRenderer.removeListener('services:badge', handler)
	},
	onServiceFocus: (listener: (serviceId: string) => void) => {
		const handler = (_event: Electron.IpcRendererEvent, serviceId: string) => listener(serviceId)
		ipcRenderer.on('services:focus', handler)
		return () => ipcRenderer.removeListener('services:focus', handler)
	},
	onSuspendState: (listener: (suspended: boolean) => void) => {
		const onSuspend = () => listener(true)
		const onResume = () => listener(false)
		ipcRenderer.on('service:suspend', onSuspend)
		ipcRenderer.on('service:resume', onResume)
		return () => {
			ipcRenderer.removeListener('service:suspend', onSuspend)
			ipcRenderer.removeListener('service:resume', onResume)
		}
	},
	onWindowMaximized: (listener: (maximized: boolean) => void) => {
		const handler = (_event: Electron.IpcRendererEvent, maximized: boolean) => listener(maximized)
		ipcRenderer.on('window:maximized', handler)
		return () => ipcRenderer.removeListener('window:maximized', handler)
	}
}

contextBridge.exposeInMainWorld('hamsketApi', api)
contextBridge.exposeInMainWorld('hamsketEvents', events)

export type HamsketApi = typeof api
export type HamsketEvents = typeof events
