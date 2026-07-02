import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import preact from '@preact/preset-vite'

export default defineConfig({
	main: {
		plugins: [externalizeDepsPlugin()],
		build: {
			rollupOptions: {
				input: {
					index: resolve(__dirname, 'src/main/index.ts')
				}
			}
		}
	},
	preload: {
		plugins: [externalizeDepsPlugin()],
		build: {
			rollupOptions: {
				input: {
					index: resolve(__dirname, 'src/preload/index.ts'),
					service: resolve(__dirname, 'src/preload/service.ts')
				},
				// Sandboxed preload scripts (the default with contextIsolation) load
				// through a restricted CommonJS-only loader — native ESM `import`
				// syntax throws there even though the rest of this project is ESM
				// ("type": "module"). Force CJS output + a .cjs extension so Node
				// doesn't reinterpret it as ESM because of that package.json field.
				output: {
					format: 'cjs',
					entryFileNames: '[name].cjs'
				}
			}
		}
	},
	renderer: {
		publicDir: resolve(__dirname, 'resources/icons'),
		resolve: {
			alias: {
				'@renderer': resolve(__dirname, 'src/renderer/src'),
				'@shared': resolve(__dirname, 'src/shared')
			}
		},
		plugins: [preact()]
	}
})
