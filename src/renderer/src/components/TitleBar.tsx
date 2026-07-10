import { useEffect, useState } from 'preact/hooks'

// Custom title bar for the frameless window. The whole strip is a drag region
// except the interactive controls, which opt out with -webkit-app-region: no-drag.
export function TitleBar() {
	const [maximized, setMaximized] = useState(false)

	useEffect(() => {
		window.hamsketApi.isWindowMaximized().then(setMaximized)
		return window.hamsketEvents.onWindowMaximized(setMaximized)
	}, [])

	const openMenu = (e: MouseEvent) => {
		const target = e.currentTarget as HTMLElement
		const rect = target.getBoundingClientRect()
		window.hamsketApi.popupMenu(rect.left, rect.bottom)
	}

	return (
		<div class="titlebar">
			<button class="titlebar__menu" title="Menú" onClick={openMenu}>
				<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
					<path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
				</svg>
			</button>
			<div class="titlebar__brand">
				<img class="titlebar__logo" src="./opsdesk.png" alt="" />
				<span class="titlebar__title">OpsDesk</span>
			</div>

			<div class="titlebar__drag" />

			<div class="titlebar__controls">
				<button
					class="titlebar__btn"
					title="Minimizar"
					onClick={() => window.hamsketApi.minimizeWindow()}
				>
					<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
						<path d="M1 5h8" stroke="currentColor" stroke-width="1" />
					</svg>
				</button>
				<button
					class="titlebar__btn"
					title={maximized ? 'Restaurar' : 'Maximizar'}
					onClick={() => window.hamsketApi.toggleMaximizeWindow()}
				>
					{maximized ? (
						<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
							<path
								d="M2.5 3.5V1.5h6v6h-2M1.5 3.5h5v5h-5z"
								stroke="currentColor"
								stroke-width="1"
								fill="none"
							/>
						</svg>
					) : (
						<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
							<rect x="1.5" y="1.5" width="7" height="7" stroke="currentColor" stroke-width="1" fill="none" />
						</svg>
					)}
				</button>
				<button
					class="titlebar__btn titlebar__btn--close"
					title="Cerrar"
					onClick={() => window.hamsketApi.closeWindow()}
				>
					<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
						<path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" stroke-width="1" />
					</svg>
				</button>
			</div>
		</div>
	)
}
