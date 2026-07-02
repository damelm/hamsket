import { app, BrowserWindow, Menu, nativeImage, Tray } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'

let tray: Tray | null = null

const resourcesDir = is.dev ? join(__dirname, '../../resources') : join(process.resourcesPath, 'resources')

function iconPath(unread: boolean): string {
	const name = unread ? 'IconTrayUnread' : 'IconTray'
	const ext = process.platform === 'win32' ? 'ico' : 'png'
	return join(resourcesDir, `${name}.${ext}`)
}

export function createTray(win: BrowserWindow): Tray {
	tray = new Tray(nativeImage.createFromPath(iconPath(false)))
	tray.setToolTip('Hamsket')

	tray.setContextMenu(
		Menu.buildFromTemplate([
			{
				label: 'Mostrar/Ocultar',
				click: () => (win.isVisible() ? win.hide() : win.show())
			},
			{ type: 'separator' },
			{ label: 'Salir', click: () => app.quit() }
		])
	)

	tray.on('click', () => (win.isVisible() ? win.hide() : win.show()))

	return tray
}

export function setTrayBadge(unreadCount: number): void {
	if (!tray) return
	tray.setImage(nativeImage.createFromPath(iconPath(unreadCount > 0)))
	tray.setToolTip(unreadCount > 0 ? `Hamsket — ${unreadCount} sin leer` : 'Hamsket')
}

export function destroyTray(): void {
	tray?.destroy()
	tray = null
}
