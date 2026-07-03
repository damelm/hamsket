import { app, BaseWindow, WebContentsView, clipboard, ipcMain, session, shell } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'

// Floating sandboxed viewer for links clicked inside a service. The page runs
// under Chromium's renderer sandbox with no preload and no Node access, in an
// in-memory session (one per window, discarded on close) that shares nothing —
// no cookies, no storage — with the services or the host UI. The toolbar above
// it shows the real URL so a phishing page can't pass itself off as the site
// it's imitating, plus an escape hatch to the system browser for sites that
// refuse to work in embedded windows.

const TOOLBAR_HEIGHT = 36

// Same rationale as ServiceView: several sites misbehave when they see the
// "OpsDesk/x" or "Electron/x" tokens, or a Chrome version that doesn't match
// the real engine. Strip just those tokens from the runtime UA.
function desktopChromeUa(): string {
	return app.userAgentFallback.replace(/\s(OpsDesk|Electron)\/\S+/g, '')
}

const resourcesDir = is.dev ? join(__dirname, '../../resources') : join(process.resourcesPath, 'resources')

interface LinkWindow {
	window: BaseWindow
	toolbar: WebContentsView
	content: WebContentsView
}

// Keyed by the toolbar's webContents id so linkbar IPC can resolve its window.
const linkWindows = new Map<number, LinkWindow>()
let nextPartitionId = 0
let ipcRegistered = false

function registerLinkbarIpc(): void {
	if (ipcRegistered) return
	ipcRegistered = true

	ipcMain.on('linkbar:action', (event, action: string) => {
		const entry = linkWindows.get(event.sender.id)
		if (!entry) return
		const wc = entry.content.webContents
		switch (action) {
			case 'back':
				wc.navigationHistory.goBack()
				break
			case 'forward':
				wc.navigationHistory.goForward()
				break
			case 'reload':
				wc.reload()
				break
			case 'copy':
				clipboard.writeText(wc.getURL())
				break
			case 'external':
				void shell.openExternal(wc.getURL())
				break
		}
	})
}

export function openLinkWindow(url: string): void {
	registerLinkbarIpc()

	// Unique in-memory partition per window: no "persist:" prefix means nothing
	// is written to disk and it evaporates when the window closes.
	const partition = `link-sandbox-${nextPartitionId++}`
	const sandboxSession = session.fromPartition(partition)
	sandboxSession.setUserAgent(desktopChromeUa())
	sandboxSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false))
	sandboxSession.on('will-download', (event) => event.preventDefault())

	const window = new BaseWindow({
		width: 1000,
		height: 720,
		title: 'OpsDesk — Vista de enlace',
		icon: join(resourcesDir, 'Icon.png')
	})

	const toolbar = new WebContentsView({
		webPreferences: {
			preload: join(__dirname, '../preload/linkbar.cjs'),
			contextIsolation: true,
			nodeIntegration: false
		}
	})

	const content = new WebContentsView({
		webPreferences: {
			partition,
			sandbox: true,
			contextIsolation: true,
			nodeIntegration: false
		}
	})

	window.contentView.addChildView(toolbar)
	window.contentView.addChildView(content)

	function layout(): void {
		const { width, height } = window.getContentBounds()
		toolbar.setBounds({ x: 0, y: 0, width, height: TOOLBAR_HEIGHT })
		content.setBounds({ x: 0, y: TOOLBAR_HEIGHT, width, height: height - TOOLBAR_HEIGHT })
	}
	layout()
	window.on('resize', layout)

	const pushState = (): void => {
		if (toolbar.webContents.isDestroyed() || content.webContents.isDestroyed()) return
		toolbar.webContents.send('linkbar:state', {
			url: content.webContents.getURL(),
			canGoBack: content.webContents.navigationHistory.canGoBack(),
			canGoForward: content.webContents.navigationHistory.canGoForward()
		})
	}
	content.webContents.on('did-navigate', pushState)
	content.webContents.on('did-navigate-in-page', pushState)
	toolbar.webContents.on('did-finish-load', pushState)

	// target=_blank inside the viewer stays in the viewer.
	content.webContents.setWindowOpenHandler(({ url: childUrl }) => {
		if (childUrl.startsWith('http://') || childUrl.startsWith('https://')) {
			void content.webContents.loadURL(childUrl)
		}
		return { action: 'deny' }
	})

	linkWindows.set(toolbar.webContents.id, { window, toolbar, content })
	window.on('closed', () => {
		linkWindows.delete(toolbar.webContents.id)
	})

	void toolbar.webContents.loadFile(join(resourcesDir, 'link-toolbar.html'))
	void content.webContents.loadURL(url)
}
