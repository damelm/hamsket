import { app, BrowserWindow, Menu, type MenuItemConstructorOptions } from 'electron'

function send(win: BrowserWindow, channel: string, ...args: unknown[]): void {
	win.webContents.send(channel, ...args)
}

export function buildMenu(win: BrowserWindow): Menu {
	const isMac = process.platform === 'darwin'

	const template: MenuItemConstructorOptions[] = [
		...(isMac
			? [
					{
						label: app.name,
						submenu: [
							{ role: 'about' as const },
							{ type: 'separator' as const },
							{ role: 'services' as const },
							{ type: 'separator' as const },
							{ role: 'hide' as const },
							{ role: 'hideOthers' as const },
							{ role: 'unhide' as const },
							{ type: 'separator' as const },
							{ role: 'quit' as const }
						]
					}
				]
			: []),
		{
			label: 'Archivo',
			submenu: [
				{
					label: 'Preferencias',
					accelerator: 'CmdOrCtrl+,',
					click: () => send(win, 'menu:show-preferences')
				},
				{ type: 'separator' },
				isMac ? { role: 'close', label: 'Cerrar ventana' } : { role: 'quit', label: 'Salir' }
			]
		},
		{
			label: 'Ver',
			submenu: [
				{
					label: 'Recargar servicio actual',
					accelerator: 'CmdOrCtrl+Shift+R',
					click: () => send(win, 'menu:reload-service')
				},
				{
					label: 'Recargar OpsDesk',
					accelerator: 'CmdOrCtrl+R',
					// Not role: 'reload' — that role's default accelerator can lose the
					// keypress to a focused <webview>'s own page instead of reloading
					// the host window, which is what this item is actually for.
					click: () => win.reload()
				},
				{ type: 'separator' },
				{ label: 'Acercar', accelerator: 'CmdOrCtrl+Plus', click: () => send(win, 'menu:zoom-in') },
				{ label: 'Alejar', accelerator: 'CmdOrCtrl+-', click: () => send(win, 'menu:zoom-out') },
				{ label: 'Restablecer zoom', accelerator: 'CmdOrCtrl+0', click: () => send(win, 'menu:zoom-reset') },
				{ type: 'separator' },
				{
					label: 'Pestaña siguiente',
					accelerator: 'CmdOrCtrl+Tab',
					click: () => send(win, 'menu:tab-next')
				},
				{
					label: 'Pestaña anterior',
					accelerator: 'CmdOrCtrl+Shift+Tab',
					click: () => send(win, 'menu:tab-previous')
				},
				{ type: 'separator' },
				{
					label: 'No molestar',
					accelerator: 'Alt+F1',
					click: () => send(win, 'menu:toggle-dnd')
				},
				{
					label: 'Bloquear OpsDesk',
					accelerator: 'Alt+F2',
					click: () => send(win, 'menu:lock')
				},
				{ type: 'separator' },
				{ role: 'togglefullscreen' }
			]
		},
		{
			label: 'Ayuda',
			submenu: [
				{ label: 'Buscar actualizaciones', click: () => send(win, 'menu:check-for-updates') },
				...(isMac ? [] : [{ label: 'Acerca de', click: () => send(win, 'menu:show-about') }])
			]
		}
	]

	return Menu.buildFromTemplate(template)
}
