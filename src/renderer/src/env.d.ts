/// <reference types="vite/client" />

import type { HamsketApi, HamsketEvents } from '../../preload'

declare global {
	interface Window {
		hamsketApi: HamsketApi
		hamsketEvents: HamsketEvents
	}
}
