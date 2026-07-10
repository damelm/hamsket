import Store from 'electron-store'
import type { AppConfig, ServiceInstance } from '../shared/types'

interface StoreShape {
	config: AppConfig
	services: ServiceInstance[]
}

const defaults: AppConfig = {
	alwaysOnTop: false,
	hideMenuBar: false,
	windowDisplayBehavior: 'show_both',
	startMinimized: false,
	autoLaunch: false,
	dontDisturb: false,
	disableGpu: false,
	proxy: null,
	masterPasswordHash: null,
	bounds: { width: 1200, height: 800, maximized: false },
	sidebarWidth: 232,
	hibernateMinutes: 15,
	suspendOnTray: false,
	theme: 'system',
	preloadAll: false
}

// Constructed lazily on first access, never at import time. electron-store binds
// its file path to app.getPath('userData') the moment it's built, and index.ts
// overrides userData (dev profile, or HAMSKET_USER_DATA_DIR for E2E/isolated
// runs) *after* this module is imported. Building the store eagerly here would
// capture the default path and silently ignore that override.
let storeInstance: Store<StoreShape> | null = null

function store(): Store<StoreShape> {
	if (!storeInstance) {
		storeInstance = new Store<StoreShape>({
			defaults: {
				config: defaults,
				services: []
			}
		})
	}
	return storeInstance
}

export function getConfig(): AppConfig {
	return { ...defaults, ...store().get('config') }
}

export function setConfig(patch: Partial<AppConfig>): AppConfig {
	const next = { ...getConfig(), ...patch }
	store().set('config', next)
	return next
}

export function listServices(): ServiceInstance[] {
	return store().get('services', [])
}

export function saveServices(services: ServiceInstance[]): ServiceInstance[] {
	store().set('services', services)
	return services
}
