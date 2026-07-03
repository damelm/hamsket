import { useEffect, useState } from 'preact/hooks'

interface Props {
	onClose: () => void
}

export function AboutDialog({ onClose }: Props) {
	const [version, setVersion] = useState('')

	useEffect(() => {
		window.hamsketApi.getVersion().then(setVersion)
	}, [])

	function openLink(url: string) {
		return (e: Event) => {
			e.preventDefault()
			window.hamsketApi.openExternal(url)
		}
	}

	return (
		<div class="modal-backdrop" onClick={onClose}>
			<div class="modal about" onClick={(e) => e.stopPropagation()}>
				<h2>OpsDesk</h2>
				<p class="about__version">Versión {version}</p>

				<p>
					Modificado por{' '}
					<a href="https://github.com/damelm" onClick={openLink('https://github.com/damelm')}>
						Damian Peña
					</a>{' '}
					a partir del 2 de julio de 2026.
				</p>

				<p class="modal__note">
					Basado en otros repositorios de código abierto, entre ellos{' '}
					<a
						href="https://github.com/TheGoddessInari/hamsket"
						onClick={openLink('https://github.com/TheGoddessInari/hamsket')}
					>
						Hamsket
					</a>
					. Software libre bajo licencia GPL-3.0.
				</p>

				<p class="modal__note">
					<a
						href="https://github.com/damelm/hamsket"
						onClick={openLink('https://github.com/damelm/hamsket')}
					>
						Código fuente y detalle de cambios en GitHub
					</a>
				</p>

				<div class="modal__actions">
					<button onClick={onClose}>Cerrar</button>
				</div>
			</div>
		</div>
	)
}
