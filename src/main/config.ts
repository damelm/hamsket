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
	sidebarWidth: 76
}

export const store = new Store<StoreShape>({
	defaults: {
		config: defaults,
		services: []
	}
})

export function getConfig(): AppConfig {
	return { ...defaults, ...store.get('config') }
}

export function setConfig(patch: Partial<AppConfig>): AppConfig {
	const next = { ...getConfig(), ...patch }
	store.set('config', next)
	return next
}

export function listServices(): ServiceInstance[] {
	return store.get('services', [])
}

export function saveServices(services: ServiceInstance[]): ServiceInstance[] {
	store.set('services', services)
	return services
}
