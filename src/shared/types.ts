export type ServiceCatalogId = 'whatsapp' | 'telegram' | 'slack' | 'nextcloud-talk' | 'element' | 'custom'

export interface ServiceCatalogEntry {
	id: ServiceCatalogId
	name: string
	icon: string
	/** Fixed URL, or null when the user must supply their own (self-hosted / custom). */
	url: string | null
	requiresCustomUrl: boolean
	/** Injected into the webview on dom-ready to detect unread messages and call hamsket.updateBadge(). */
	unreadScript?: string
	/** True when the unread selector hasn't been confirmed against a live instance yet. */
	unreadScriptUnverified?: boolean
	note?: string
}

export interface ServiceInstance {
	id: string
	catalogId: ServiceCatalogId
	name: string
	url: string
	position: number
	enabled: boolean
	muted: boolean
	notifications: boolean
	trustSelfSigned: boolean
	zoomLevel: number
}

export interface AppConfig {
	alwaysOnTop: boolean
	hideMenuBar: boolean
	windowDisplayBehavior: 'show_taskbar' | 'show_tray' | 'show_both'
	startMinimized: boolean
	autoLaunch: boolean
	dontDisturb: boolean
	disableGpu: boolean
	proxy: { host: string; port: string; login: string; password: string } | null
	masterPasswordHash: string | null
	bounds: { x?: number; y?: number; width: number; height: number; maximized: boolean }
}

export interface WindowIpcApi {
	getVersion: () => Promise<string>

	getConfig: () => Promise<AppConfig>
	setConfig: (patch: Partial<AppConfig>) => Promise<AppConfig>

	listServices: () => Promise<ServiceInstance[]>
	addService: (input: Omit<ServiceInstance, 'id' | 'position'>) => Promise<ServiceInstance[]>
	updateService: (id: string, patch: Partial<ServiceInstance>) => Promise<ServiceInstance[]>
	removeService: (id: string) => Promise<ServiceInstance[]>
	reorderServices: (orderedIds: string[]) => Promise<ServiceInstance[]>

	hasMasterPassword: () => Promise<boolean>
	setMasterPassword: (password: string | null) => Promise<void>
	validateMasterPassword: (password: string) => Promise<boolean>

	setBadge: (serviceId: string, direct: number, indirect: number) => Promise<void>
	focusService: (serviceId: string) => Promise<void>
	reloadApp: () => Promise<void>
	relaunchApp: () => Promise<void>
	openExternal: (url: string) => Promise<void>
	checkForUpdates: () => Promise<void>
}
