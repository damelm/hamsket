import { useEffect, useState } from 'preact/hooks'

interface Props {
	onClose: () => void
}

export function AboutDialog({ onClose }: Props) {
	const [version, setVersion] = useState('')

	useEffect(() => {
		window.hamsketApi.getVersion().then(setVersion)
	}, [])

	return (
		<div class="modal-backdrop" onClick={onClose}>
			<div class="modal about" onClick={(e) => e.stopPropagation()}>
				<h2>OpsDesk</h2>
				<p class="about__version">Versión {version}</p>
				<p>Hecho por Damián Peña.</p>
				<div class="modal__actions">
					<button onClick={onClose}>Cerrar</button>
				</div>
			</div>
		</div>
	)
}
