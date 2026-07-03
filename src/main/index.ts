import { app, BrowserWindow, Menu } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import AutoLaunch from 'auto-launch'
import contextMenu from 'electron-context-menu'
import { getConfig, setConfig } from './config'
import { registerIpcHandlers } from './ipc'
import { registerBadgeChannel } from './badges'
import { createTray, destroyTray, setTrayBadge } from './tray'
import { buildMenu } from './menu'
import { registerUpdater } from './updater'
import { hardenWebviews, registerNotificationPermissions, resourcesDir } from './security'

// Some services' OAuth popups (e.g. Slack via Google) still trip over Electron's
// strict Cross-Origin-Opener-Policy enforcement in a way upstream hasn't fully
// resolved for webview-hosted popups. Re-check on future Electron upgrades:
// https://github.com/electron/electron/issues/25469
app.commandLine.appendSwitch('disable-features', 'CrossOriginOpenerPolicy')

// A separately-installed "Hamsket" build (the original app this project is
// based on) may already be running on this machine. The default userData path
// (and with it, the single-instance lock) is derived from productName before
// any of this file runs, so app.setName() alone can't move it — an explicit
// setPath is required to avoid colliding with that install. E2E runs go one
// step further with their own per-run directory (HAMSKET_USER_DATA_DIR) so a
// leftover `npm run dev` instance can't fail the test suite's lock either.
if (process.env['HAMSKET_USER_DATA_DIR']) {
	app.setName('OpsDesk Test')
	app.setPath('userData', process.env['HAMSKET_USER_DATA_DIR'])
} else if (is.dev) {
	app.setName('OpsDesk Dev')
	app.setPath('userData', join(app.getPath('appData'), 'OpsDesk Dev'))
}

const autoLauncher = new AutoLaunch({ name: 'OpsDesk' })

let mainWindow: BrowserWindow | null = null
let isQuitting = false

app.on('before-quit', () => {
	isQuitting = true
})

function getMainWindow(): BrowserWindow | null {
	return mainWindow
}

function applyConfigToWindow(win: BrowserWindow): void {
	const config = getConfig()
	win.setAlwaysOnTop(config.alwaysOnTop)
	win.setMenuBarVisibility(!config.hideMenuBar)
	autoLauncher[config.autoLaunch ? 'enable' : 'disable']().catch(() => {})
	if (config.proxy) {
		win.webContents.session.setProxy({ proxyRules: `${config.proxy.host}:${config.proxy.port}` })
	}
}

function createWindow(): void {
	const { bounds } = getConfig()

	mainWindow = new BrowserWindow({
		x: bounds.x,
		y: bounds.y,
		width: bounds.width,
		height: bounds.height,
		show: false,
		icon: join(resourcesDir, 'Icon.png'),
		webPreferences: {
			preload: join(__dirname, '../preload/index.cjs'),
			contextIsolation: true,
			nodeIntegration: false,
			webviewTag: true
		}
	})

	if (bounds.maximized) mainWindow.maximize()

	Menu.setApplicationMenu(buildMenu(mainWindow))
	createTray(mainWindow)
	registerUpdater(mainWindow)
	hardenWebviews(mainWindow)

	contextMenu({ window: mainWindow, showInspectElement: is.dev })

	mainWindow.on('ready-to-show', () => {
		if (!getConfig().startMinimized) mainWindow?.show()
	})

	mainWindow.on('close', (event) => {
		if (!mainWindow) return
		const b = mainWindow.getBounds()
		setConfig({ bounds: { ...b, maximized: mainWindow.isMaximized() } })
		// The window has a tray icon — clicking the OS close button should
		// minimize to tray like the rest of the app, not quit. "Salir" (tray
		// menu / Archivo menu / Cmd+Q) sets isQuitting first so it still works.
		if (!isQuitting) {
			event.preventDefault()
			mainWindow.hide()
		}
	})

	mainWindow.on('closed', () => {
		mainWindow = null
	})

	applyConfigToWindow(mainWindow)

	if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
		mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
	} else {
		mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
	}
}

process.on('uncaughtException', (err) => {
	console.error('[hamsket] uncaughtException', err)
})

const haveLock = app.requestSingleInstanceLock()
if (!haveLock) {
	app.quit()
} else {
	app.on('second-instance', () => {
		if (!mainWindow) return
		if (mainWindow.isMinimized()) mainWindow.restore()
		mainWindow.show()
		mainWindow.focus()
	})

	app.whenReady().then(() => {
		registerNotificationPermissions()
		registerIpcHandlers({
			getMainWindow,
			onConfigChanged: () => mainWindow && applyConfigToWindow(mainWindow)
		})
		registerBadgeChannel({ getMainWindow, setTrayBadge })

		createWindow()

		app.on('activate', () => {
			if (BrowserWindow.getAllWindows().length === 0) {
				createWindow()
			} else {
				mainWindow?.show()
			}
		})
	})

	app.on('window-all-closed', () => {
		destroyTray()
		if (process.platform !== 'darwin') app.quit()
	})
}
