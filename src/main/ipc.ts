import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { randomUUID } from 'node:crypto'
import { getConfig, setConfig, listServices, saveServices } from './config'
import { hashPassword, verifyPassword } from './master-password'
import { buildMenu } from './menu'
import type { ServiceInstance } from '../shared/types'

interface RegisterOptions {
	getMainWindow: () => BrowserWindow | null
	onConfigChanged: () => void
}

export function registerIpcHandlers({ getMainWindow, onConfigChanged }: RegisterOptions): void {
	ipcMain.handle('app:version', () => app.getVersion())

	ipcMain.handle('config:get', () => getConfig())

	ipcMain.handle('config:set', (_event, patch) => {
		const next = setConfig(patch)
		onConfigChanged()
		return next
	})

	ipcMain.handle('services:list', () => listServices())

	ipcMain.handle('services:add', (_event, input: Omit<ServiceInstance, 'id' | 'position'>) => {
		const services = listServices()
		const service: ServiceInstance = {
			...input,
			id: randomUUID(),
			position: services.length
		}
		return saveServices([...services, service])
	})

	ipcMain.handle('services:update', (_event, id: string, patch: Partial<ServiceInstance>) => {
		const services = listServices().map((s) => (s.id === id ? { ...s, ...patch } : s))
		return saveServices(services)
	})

	ipcMain.handle('services:remove', (_event, id: string) => {
		const services = listServices()
			.filter((s) => s.id !== id)
			.map((s, index) => ({ ...s, position: index }))
		return saveServices(services)
	})

	ipcMain.handle('services:reorder', (_event, orderedIds: string[]) => {
		const byId = new Map(listServices().map((s) => [s.id, s]))
		const reordered = orderedIds
			.map((id, index) => {
				const service = byId.get(id)
				return service ? { ...service, position: index } : null
			})
			.filter((s): s is ServiceInstance => s !== null)
		return saveServices(reordered)
	})

	ipcMain.handle('masterPassword:has', () => getConfig().masterPasswordHash !== null)

	ipcMain.handle('masterPassword:set', (_event, password: string | null) => {
		setConfig({ masterPasswordHash: password ? hashPassword(password) : null })
	})

	ipcMain.handle('masterPassword:validate', (_event, password: string) => {
		const { masterPasswordHash } = getConfig()
		if (!masterPasswordHash) return true
		return verifyPassword(password, masterPasswordHash)
	})

	ipcMain.handle('app:reload', () => {
		getMainWindow()?.reload()
	})

	ipcMain.handle('app:relaunch', () => {
		app.relaunch()
		app.quit()
	})

	ipcMain.handle('app:openExternal', async (_event, url: string) => {
		if (url.startsWith('http://') || url.startsWith('https://')) {
			await shell.openExternal(url)
		}
	})

	// Custom (frameless) title-bar window controls.
	ipcMain.handle('window:minimize', () => getMainWindow()?.minimize())
	ipcMain.handle('window:toggle-maximize', () => {
		const win = getMainWindow()
		if (!win) return
		if (win.isMaximized()) win.unmaximize()
		else win.maximize()
	})
	ipcMain.handle('window:close', () => getMainWindow()?.close())
	ipcMain.handle('window:is-maximized', () => getMainWindow()?.isMaximized() ?? false)

	// The native application menu is hidden with the frame, so the title bar's
	// ☰ button pops it up on demand instead.
	ipcMain.handle('window:popup-menu', (_event, x: number, y: number) => {
		const win = getMainWindow()
		if (!win) return
		buildMenu(win).popup({ window: win, x: Math.round(x), y: Math.round(y) })
	})
}
