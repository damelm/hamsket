import { test, expect, _electron as electron, type ElectronApplication } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..', '..')

let app: ElectronApplication
let userDataDir: string

test.beforeEach(async () => {
	// A distinct userData dir per run means the app's single-instance lock never
	// collides with a developer's own `npm run dev` session or the real install.
	userDataDir = mkdtempSync(join(tmpdir(), 'hamsket-e2e-'))
	app = await electron.launch({
		args: [join(projectRoot, 'out/main/index.js')],
		cwd: projectRoot,
		env: { ...process.env, HAMSKET_USER_DATA_DIR: userDataDir }
	})
})

test.afterEach(async () => {
	await app.close()
	rmSync(userDataDir, { recursive: true, force: true })
})

test('launches a window titled OpsDesk', async () => {
	const window = await app.firstWindow()
	await expect(window).toHaveTitle('OpsDesk')
})

test('renders the app shell without a console error', async () => {
	const window = await app.firstWindow()
	const errors: string[] = []
	window.on('pageerror', (err) => errors.push(String(err)))
	await window.waitForSelector('.app-shell, .lock-screen', { timeout: 10_000 })
	expect(errors).toEqual([])
})
