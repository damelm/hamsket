import { ipcMain, type BrowserWindow } from 'electron'
import { is } from '@electron-toolkit/utils'
import electronUpdater from 'electron-updater'
import type { AppConfig } from '../shared/types'

// electron-updater ships as CommonJS; ESM interop only gives us the default export.
const { autoUpdater } = electronUpdater

// Feed is configured via electron-builder.json's "publish" block (GitHub Releases
// of damelm/hamsket). Releases are published by the GitHub Actions workflow on a
// version tag; the installed app polls that feed and updates itself.

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000 // every 6 hours while running

interface Options {
	getConfig: () => AppConfig
}

export function registerUpdater(win: BrowserWindow, { getConfig }: Options): void {
	// Download automatically; the renderer shows a discreet "restart to update"
	// notice on 'update-downloaded'. Install happens on next app quit.
	autoUpdater.autoDownload = true
	autoUpdater.autoInstallOnAppQuit = true

	const forward =
		(channel: string) =>
		(...args: unknown[]) =>
			win.webContents.send(channel, ...args)

	autoUpdater.on('checking-for-update', forward('updater:checking'))
	autoUpdater.on('update-available', forward('updater:available'))
	autoUpdater.on('update-not-available', forward('updater:not-available'))
	autoUpdater.on('error', forward('updater:error'))
	autoUpdater.on('download-progress', forward('updater:progress'))
	autoUpdater.on('update-downloaded', forward('updater:downloaded'))

	// Manual controls (menu "Buscar actualizaciones", renderer buttons).
	ipcMain.handle('updater:check', () => autoUpdater.checkForUpdates())
	ipcMain.handle('updater:download', () => autoUpdater.downloadUpdate())
	ipcMain.handle('updater:quitAndInstall', () => autoUpdater.quitAndInstall())

	// electron-updater is a no-op under `npm run dev` (the app isn't packaged),
	// so only run the automatic polling loop in a real build.
	if (is.dev) return

	const check = () => {
		if (!getConfig().autoUpdate) return
		autoUpdater.checkForUpdates().catch(() => {
			/* offline / no releases yet — the error event already fired */
		})
	}

	// First check shortly after launch, then on a slow interval.
	setTimeout(check, 8000)
	setInterval(check, CHECK_INTERVAL_MS)
}
