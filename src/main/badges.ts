import { ipcMain, type BrowserWindow } from 'electron'
import type { setTrayBadge } from './tray'

interface Counts {
	direct: number
	indirect: number
}

const counts = new Map<string, Counts>()

function total(): number {
	let sum = 0
	for (const { direct } of counts.values()) sum += direct
	return sum
}

interface RegisterOptions {
	getMainWindow: () => BrowserWindow | null
	setTrayBadge: typeof setTrayBadge
}

export function registerBadgeChannel({ getMainWindow, setTrayBadge }: RegisterOptions): void {
	// Sent directly by each service's webview preload (src/preload/service.ts) — a
	// <webview> preload can talk to the main process regardless of the guest
	// page's contextIsolation, so no relay through the host renderer is needed.
	ipcMain.on('service:badge', (_event, serviceId: string, direct: number, indirect: number) => {
		counts.set(serviceId, { direct, indirect })

		const win = getMainWindow()
		win?.webContents.send('services:badge', serviceId, direct, indirect)

		const sum = total()
		win?.setTitle(sum > 0 ? `OpsDesk (${sum})` : 'OpsDesk')
		setTrayBadge(sum)
	})

	ipcMain.on('service:show-and-focus', (_event, serviceId: string) => {
		const win = getMainWindow()
		if (!win) return
		if (win.isMinimized()) win.restore()
		win.show()
		win.focus()
		win.webContents.send('services:focus', serviceId)
	})
}
