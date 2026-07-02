import { ipcMain, type BrowserWindow } from 'electron'
import electronUpdater from 'electron-updater'

// electron-updater ships as CommonJS; ESM interop only gives us the default export.
const { autoUpdater } = electronUpdater

// Feed is configured via electron-builder.json's "publish" block (GitHub Releases
// of the repo this project is published to) — set that before shipping installers.
// Replaces the original custom Heroku update server, which is not something this
// fork controls.

export function registerUpdater(win: BrowserWindow): void {
	autoUpdater.autoDownload = false

	const forward = (channel: string) => (...args: unknown[]) => win.webContents.send(channel, ...args)

	autoUpdater.on('checking-for-update', forward('updater:checking'))
	autoUpdater.on('update-available', forward('updater:available'))
	autoUpdater.on('update-not-available', forward('updater:not-available'))
	autoUpdater.on('error', forward('updater:error'))
	autoUpdater.on('download-progress', forward('updater:progress'))
	autoUpdater.on('update-downloaded', forward('updater:downloaded'))

	ipcMain.handle('updater:check', () => autoUpdater.checkForUpdates())
	ipcMain.handle('updater:download', () => autoUpdater.downloadUpdate())
	ipcMain.handle('updater:quitAndInstall', () => autoUpdater.quitAndInstall())
}
