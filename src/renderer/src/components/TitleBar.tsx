import { useEffect, useState } from 'preact/hooks'

interface Props {
	theme: 'light' | 'dark'
	onToggleTheme: () => void
	total: number
	online: number
}

// Operations-style header for the frameless window: brand identity on the left,
// a live NOC status strip (services online / paused + clock), and the window
// controls on the right. The whole strip is draggable except the controls.
export function TitleBar({ theme, onToggleTheme, total, online }: Props) {
	const [maximized, setMaximized] = useState(false)
	const [clock, setClock] = useState('')

	useEffect(() => {
		window.hamsketApi.isWindowMaximized().then(setMaximized)
		return window.hamsketEvents.onWindowMaximized(setMaximized)
	}, [])

	useEffect(() => {
		const tick = () => {
			const d = new Date()
			setClock(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
		}
		tick()
		const t = setInterval(tick, 15_000)
		return () => clearInterval(t)
	}, [])

	const openMenu = (e: MouseEvent) => {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
		window.hamsketApi.popupMenu(rect.left, rect.bottom)
	}

	const paused = Math.max(0, total - online)

	return (
		<div class="titlebar">
			<button class="titlebar__menu" title="Menú" onClick={openMenu} aria-label="Menú">
				<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
					<path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
				</svg>
			</button>

			<div class="titlebar__brand">
				<img class="titlebar__logo" src="./opsdesk.png" alt="" />
				<div class="titlebar__brandtext">
					<span class="titlebar__title">OpsDesk</span>
					<span class="titlebar__sub">Centro de operaciones</span>
				</div>
			</div>

			{total > 0 && (
				<div class="titlebar__noc">
					<span class="noc-chip" title="Servicios activos">
						<span class="noc-dot noc-dot--on" />
						<b>{online}</b> en línea
					</span>
					{paused > 0 && (
						<span class="noc-chip" title="Servicios en pausa">
							<span class="noc-dot noc-dot--sleep" />
							<b>{paused}</b> en pausa
						</span>
					)}
					<span class="noc-chip noc-chip--clock">{clock}</span>
				</div>
			)}

			<div class="titlebar__drag" />

			<div class="titlebar__controls">
				<button
					class="titlebar__btn"
					title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
					aria-label="Cambiar tema"
					onClick={onToggleTheme}
				>
					{theme === 'dark' ? (
						<svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
							<path
								d="M13.5 9.6A5.5 5.5 0 0 1 6.4 2.5 5.5 5.5 0 1 0 13.5 9.6Z"
								fill="none"
								stroke="currentColor"
								stroke-width="1.2"
								stroke-linejoin="round"
							/>
						</svg>
					) : (
						<svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
							<circle cx="8" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.2" />
							<path
								d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3 3l1.1 1.1M11.9 11.9 13 13M13 3l-1.1 1.1M4.1 11.9 3 13"
								stroke="currentColor"
								stroke-width="1.2"
								stroke-linecap="round"
							/>
						</svg>
					)}
				</button>
				<button class="titlebar__btn" title="Minimizar" aria-label="Minimizar" onClick={() => window.hamsketApi.minimizeWindow()}>
					<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
						<path d="M1 5h8" stroke="currentColor" stroke-width="1" />
					</svg>
				</button>
				<button
					class="titlebar__btn"
					title={maximized ? 'Restaurar' : 'Maximizar'}
					aria-label="Maximizar"
					onClick={() => window.hamsketApi.toggleMaximizeWindow()}
				>
					{maximized ? (
						<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
							<path d="M2.5 3.5V1.5h6v6h-2M1.5 3.5h5v5h-5z" stroke="currentColor" stroke-width="1" fill="none" />
						</svg>
					) : (
						<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
							<rect x="1.5" y="1.5" width="7" height="7" stroke="currentColor" stroke-width="1" fill="none" />
						</svg>
					)}
				</button>
				<button class="titlebar__btn titlebar__btn--close" title="Cerrar" aria-label="Cerrar" onClick={() => window.hamsketApi.closeWindow()}>
					<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
						<path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" stroke-width="1" />
					</svg>
				</button>
			</div>
		</div>
	)
}
