import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import preact from '@preact/preset-vite'
import obfuscator from 'vite-plugin-javascript-obfuscator'

// Obfuscate the shipped JavaScript so a curious operator can't casually read the
// app internals off disk. Only in production builds — `npm run dev` stays plain.
// Safe settings: no object-key or global renaming (keeps contextBridge and the
// window.hamsket bridge working) and no control-flow flattening (avoids runtime
// breakage/slowdown); it's readability protection, not a hard lock.
function obfuscate() {
	return obfuscator({
		apply: 'build',
		options: {
			compact: true,
			identifierNamesGenerator: 'hexadecimal',
			simplify: true,
			numbersToExpressions: true,
			stringArray: true,
			stringArrayThreshold: 0.75,
			stringArrayEncoding: ['base64'],
			stringArrayRotate: true,
			stringArrayShuffle: true,
			splitStrings: true,
			splitStringsChunkLength: 10,
			transformObjectKeys: false,
			renameGlobals: false,
			controlFlowFlattening: false,
			deadCodeInjection: false,
			selfDefending: false,
			debugProtection: false,
			disableConsoleOutput: false
		}
	})
}

export default defineConfig(({ mode }) => {
	const prod = mode === 'production'
	const obf = prod ? [obfuscate()] : []

	return {
		main: {
			plugins: [externalizeDepsPlugin(), ...obf],
			build: {
				rollupOptions: {
					input: {
						index: resolve(__dirname, 'src/main/index.ts')
					}
				}
			}
		},
		preload: {
			plugins: [externalizeDepsPlugin(), ...obf],
			build: {
				rollupOptions: {
					input: {
						index: resolve(__dirname, 'src/preload/index.ts'),
						service: resolve(__dirname, 'src/preload/service.ts'),
						linkbar: resolve(__dirname, 'src/preload/linkbar.ts')
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
			plugins: [preact(), ...obf]
		}
	}
})
