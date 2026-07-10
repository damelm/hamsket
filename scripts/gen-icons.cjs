/**
 * Regenerates every app/tray/installer icon from a single source logo.
 * Usage: node scripts/gen-icons.cjs [path-to-logo.png]
 * Defaults to resources/logo-app.png.
 */
const sharp = require('sharp')
const pngToIcoMod = require('png-to-ico')
const pngToIco = typeof pngToIcoMod === 'function' ? pngToIcoMod : pngToIcoMod.default
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const RES = path.join(ROOT, 'resources')
const SRC = process.argv[2] || path.join(RES, 'logo-app.png')

async function square(size, pad = 0.9) {
	const inner = Math.round(size * pad)
	const scaled = await sharp(SRC)
		.resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
		.png()
		.toBuffer()
	const off = Math.round((size - inner) / 2)
	return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
		.composite([{ input: scaled, left: off, top: off }])
		.png()
		.toBuffer()
}

async function unread(size) {
	const base = await square(size, 0.96)
	const r = Math.round(size * 0.28)
	const badge = Buffer.from(
		`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">` +
			`<circle cx="${size - r}" cy="${size - r}" r="${r}" fill="#ff3b30" stroke="#ffffff" stroke-width="${Math.max(1, size * 0.03)}"/></svg>`
	)
	return sharp(base).composite([{ input: badge }]).png().toBuffer()
}

function writePng(buf, file) {
	fs.mkdirSync(path.dirname(file), { recursive: true })
	fs.writeFileSync(file, buf)
	console.log('  ✓', path.relative(RES, file))
}

async function main() {
	if (!fs.existsSync(SRC)) throw new Error('Source logo not found: ' + SRC)
	const sizes = [16, 24, 32, 48, 64, 96, 128, 256, 512, 1024]

	writePng(await square(256), path.join(RES, 'Icon.png'))
	writePng(await square(64, 0.94), path.join(RES, 'icons/opsdesk.png'))

	for (const s of sizes) {
		const buf = await square(s, s <= 32 ? 0.96 : 0.9)
		writePng(buf, path.join(RES, `logo/${s}x${s}.png`))
		writePng(buf, path.join(RES, `installer/icons/${s}x${s}.png`))
	}

	writePng(await square(16, 0.98), path.join(RES, 'IconTray.png'))
	writePng(await square(32, 0.98), path.join(RES, 'IconTray@2x.png'))
	writePng(await square(64, 0.98), path.join(RES, 'IconTray@4x.png'))
	writePng(await unread(16), path.join(RES, 'IconTrayUnread.png'))
	writePng(await unread(32), path.join(RES, 'IconTrayUnread@2x.png'))
	writePng(await unread(64), path.join(RES, 'IconTrayUnread@4x.png'))

	const icoSizes = [16, 24, 32, 48, 64, 128, 256]
	const icoBufs = await Promise.all(icoSizes.map((s) => square(s, s <= 32 ? 0.96 : 0.9)))
	const appIco = await pngToIco(icoBufs)
	fs.writeFileSync(path.join(RES, 'Icon.ico'), appIco)
	fs.writeFileSync(path.join(RES, 'installer/icon.ico'), appIco)
	fs.writeFileSync(path.join(RES, 'installer/installerIcon.ico'), appIco)
	console.log('  ✓ Icon.ico + installer/icon.ico + installerIcon.ico')

	fs.writeFileSync(path.join(RES, 'IconTray.ico'), await pngToIco([await square(16, 0.98), await square(32, 0.98), await square(48, 0.98)]))
	fs.writeFileSync(path.join(RES, 'IconTrayUnread.ico'), await pngToIco([await unread(16), await unread(32), await unread(48)]))
	console.log('  ✓ IconTray.ico + IconTrayUnread.ico')
	console.log('Done.')
}

main().catch((e) => {
	console.error(e)
	process.exit(1)
})
