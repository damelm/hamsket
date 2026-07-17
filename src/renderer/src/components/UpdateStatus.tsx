export type UpdatePhase = 'idle' | 'checking' | 'none' | 'downloading' | 'ready' | 'error' | 'installing'

export interface UpdateState {
	phase: UpdatePhase
	percent?: number
}

interface Props {
	state: UpdateState
	onInstall: () => void
	onDismiss: () => void
}

export function UpdateStatus({ state, onInstall, onDismiss }: Props) {
	// Full-screen reassurance while the (silent) installer runs and the app relaunches.
	if (state.phase === 'installing') {
		return (
			<div class="update-overlay">
				<div class="update-overlay__box">
					<div class="spinner" />
					<p class="update-overlay__title">Instalando actualización…</p>
					<p class="update-overlay__sub">La aplicación se reiniciará sola en unos segundos.</p>
				</div>
			</div>
		)
	}

	if (state.phase === 'idle') return null

	return (
		<div class="update-toast">
			{state.phase === 'checking' && (
				<>
					<span class="spinner spinner--sm" />
					<span class="update-toast__text">Buscando actualizaciones…</span>
				</>
			)}

			{state.phase === 'none' && (
				<>
					<span class="update-toast__dot update-toast__dot--ok" />
					<span class="update-toast__text">Ya tenés la última versión.</span>
				</>
			)}

			{state.phase === 'downloading' && (
				<div class="update-toast__dl">
					<span class="update-toast__text">Descargando actualización… {state.percent ?? 0}%</span>
					<div class="update-toast__bar">
						<div class="update-toast__bar-fill" style={{ width: `${state.percent ?? 0}%` }} />
					</div>
				</div>
			)}

			{state.phase === 'ready' && (
				<>
					<span class="update-toast__dot" />
					<span class="update-toast__text">Actualización lista — se instalará al reiniciar.</span>
					<button class="update-toast__btn" onClick={onInstall}>
						Reiniciar ahora
					</button>
					<button class="update-toast__dismiss" title="Ahora no" onClick={onDismiss}>
						✕
					</button>
				</>
			)}

			{state.phase === 'error' && (
				<>
					<span class="update-toast__dot update-toast__dot--err" />
					<span class="update-toast__text">No se pudo buscar la actualización.</span>
				</>
			)}
		</div>
	)
}
