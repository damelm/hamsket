import { useState } from 'preact/hooks'

interface Props {
	onUnlock: () => void
}

export function MasterPasswordScreen({ onUnlock }: Props) {
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')

	async function submit(e: Event) {
		e.preventDefault()
		const ok = await window.hamsketApi.validateMasterPassword(password)
		if (ok) {
			onUnlock()
		} else {
			setError('Contraseña incorrecta.')
			setPassword('')
		}
	}

	return (
		<div class="lock-screen">
			<form class="lock-screen__form" onSubmit={submit}>
				<h1>OpsDesk bloqueado</h1>
				<input
					type="password"
					autoFocus
					placeholder="Contraseña maestra"
					value={password}
					onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
				/>
				{error && <p class="lock-screen__error">{error}</p>}
				<button type="submit" disabled={!password}>
					Desbloquear
				</button>
			</form>
		</div>
	)
}
