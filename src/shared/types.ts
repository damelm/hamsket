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
	/** Unload this service's webview after inactivity to free RAM (default false).
	 *  While hibernated it stops receiving messages/badges until reopened. */
	hibernate: boolean
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
	sidebarWidth: number
	/** Minutes a hibernate-enabled service stays inactive before its webview is unloaded. */
	hibernateMinutes: number
	/** Unload all service webviews while the window is hidden in the tray (default false). */
	suspendOnTray: boolean
	/** UI color theme. 'system' follows the OS setting. */
	theme: 'system' | 'light' | 'dark'
	/** Load every service at startup (all sessions live from minute zero) instead of
	 *  loading each one lazily on first open. Costs more RAM; recommended for call
	 *  centers that need notifications from every account immediately. */
	preloadAll: boolean
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

	minimizeWindow: () => Promise<void>
	toggleMaximizeWindow: () => Promise<void>
	closeWindow: () => Promise<void>
	isWindowMaximized: () => Promise<boolean>
	popupMenu: (x: number, y: number) => Promise<void>
}
