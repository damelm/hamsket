import { useEffect, useState } from 'preact/hooks'
import type { AppConfig } from '@shared/types'

interface Props {
	config: AppConfig
	onChange: (patch: Partial<AppConfig>) => void
	onClose: () => void
}

export function PreferencesDialog({ config, onChange, onClose }: Props) {
	return (
		<div class="modal-backdrop" onClick={onClose}>
			<div class="modal modal--wide" onClick={(e) => e.stopPropagation()}>
				<h2>Preferencias</h2>

				<label class="modal__checkbox">
					<input
						type="checkbox"
						checked={config.alwaysOnTop}
						onChange={(e) => onChange({ alwaysOnTop: (e.target as HTMLInputElement).checked })}
					/>
					Siempre visible (always on top)
				</label>

				<label class="modal__checkbox">
					<input
						type="checkbox"
						checked={config.hideMenuBar}
						onChange={(e) => onChange({ hideMenuBar: (e.target as HTMLInputElement).checked })}
					/>
					Ocultar barra de menú
				</label>

				<label class="modal__checkbox">
					<input
						type="checkbox"
						checked={config.startMinimized}
						onChange={(e) => onChange({ startMinimized: (e.target as HTMLInputElement).checked })}
					/>
					Iniciar minimizado
				</label>

				<label class="modal__checkbox">
					<input
						type="checkbox"
						checked={config.autoLaunch}
						onChange={(e) => onChange({ autoLaunch: (e.target as HTMLInputElement).checked })}
					/>
					Iniciar automáticamente con el sistema
				</label>

				<label class="modal__checkbox">
					<input
						type="checkbox"
						checked={config.dontDisturb}
						onChange={(e) => onChange({ dontDisturb: (e.target as HTMLInputElement).checked })}
					/>
					No molestar
				</label>

				<fieldset class="modal__fieldset">
					<legend>Memoria (RAM)</legend>

					<label class="modal__checkbox">
						<input
							type="checkbox"
							checked={config.suspendOnTray}
							onChange={(e) => onChange({ suspendOnTray: (e.target as HTMLInputElement).checked })}
						/>
						Descargar todos los servicios al minimizar a la bandeja
					</label>

					<label class="modal__field">
						Hibernar servicios inactivos tras (minutos)
						<input
							type="number"
							min={1}
							max={240}
							value={config.hibernateMinutes}
							onInput={(e) => {
								const n = Number((e.target as HTMLInputElement).value)
								if (Number.isFinite(n) && n >= 1) onChange({ hibernateMinutes: Math.round(n) })
							}}
						/>
					</label>
					<p class="modal__note">
						La hibernación se activa por servicio (clic derecho → «Hibernar en segundo plano»). Un servicio
						dormido no recibe mensajes hasta reabrirlo.
					</p>
				</fieldset>

				<MasterPasswordSection />

				<div class="modal__actions">
					<button onClick={onClose}>Cerrar</button>
				</div>
			</div>
		</div>
	)
}

function MasterPasswordSection() {
	const [hasPassword, setHasPassword] = useState<boolean | null>(null)
	const [current, setCurrent] = useState('')
	const [verified, setVerified] = useState(false)
	const [next, setNext] = useState('')
	const [confirm, setConfirm] = useState('')
	const [message, setMessage] = useState('')

	useEffect(() => {
		window.hamsketApi.hasMasterPassword().then(setHasPassword)
	}, [])

	async function verify() {
		const ok = await window.hamsketApi.validateMasterPassword(current)
		setVerified(ok)
		setMessage(ok ? '' : 'Contraseña incorrecta.')
	}

	async function save() {
		if (next !== confirm) {
			setMessage('Las contraseñas no coinciden.')
			return
		}
		await window.hamsketApi.setMasterPassword(next || null)
		setHasPassword(Boolean(next))
		setVerified(false)
		setCurrent('')
		setNext('')
		setConfirm('')
		setMessage('Guardado.')
	}

	async function remove() {
		await window.hamsketApi.setMasterPassword(null)
		setHasPassword(false)
		setVerified(false)
		setCurrent('')
		setMessage('Contraseña maestra eliminada.')
	}

	if (hasPassword === null) return null

	return (
		<fieldset class="modal__fieldset">
			<legend>Contraseña maestra</legend>

			{hasPassword && !verified && (
				<>
					<label class="modal__field">
						Contraseña actual
						<input
							type="password"
							value={current}
							onInput={(e) => setCurrent((e.target as HTMLInputElement).value)}
						/>
					</label>
					<button onClick={verify} disabled={!current}>
						Verificar
					</button>
				</>
			)}

			{(!hasPassword || verified) && (
				<>
					<label class="modal__field">
						Nueva contraseña
						<input type="password" value={next} onInput={(e) => setNext((e.target as HTMLInputElement).value)} />
					</label>
					<label class="modal__field">
						Confirmar
						<input
							type="password"
							value={confirm}
							onInput={(e) => setConfirm((e.target as HTMLInputElement).value)}
						/>
					</label>
					<div class="modal__actions">
						<button onClick={save} disabled={!next}>
							{hasPassword ? 'Cambiar contraseña' : 'Establecer contraseña'}
						</button>
						{hasPassword && (
							<button class="modal__danger" onClick={remove}>
								Quitar
							</button>
						)}
					</div>
				</>
			)}

			{message && <p class="modal__note">{message}</p>}
		</fieldset>
	)
}
