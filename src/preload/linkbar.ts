import { contextBridge, ipcRenderer } from 'electron'

// Preload for the link-window toolbar (resources/link-toolbar.html). The main
// process resolves which link window an action belongs to from event.sender,
// so no window id needs to cross the bridge.

interface LinkbarState {
	url: string
	canGoBack: boolean
	canGoForward: boolean
}

contextBridge.exposeInMainWorld('linkbar', {
	onState: (listener: (state: LinkbarState) => void) => {
		ipcRenderer.on('linkbar:state', (_event, state: LinkbarState) => listener(state))
	},
	goBack: () => ipcRenderer.send('linkbar:action', 'back'),
	goForward: () => ipcRenderer.send('linkbar:action', 'forward'),
	reload: () => ipcRenderer.send('linkbar:action', 'reload'),
	copyUrl: () => ipcRenderer.send('linkbar:action', 'copy'),
	openExternal: () => ipcRenderer.send('linkbar:action', 'external')
})
