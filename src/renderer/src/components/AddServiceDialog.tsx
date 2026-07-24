import { useState } from 'preact/hooks'
import type { ServiceInstance } from '@shared/types'
import { SERVICES_CATALOG, getServiceByCatalogId } from '@shared/services-catalog'

interface Props {
	editing?: ServiceInstance
	onAdd: (input: Omit<ServiceInstance, 'id' | 'position'>) => void
	onUpdate: (id: string, patch: Partial<ServiceInstance>) => void
	onRemove: (id: string) => void
	onClose: () => void
}

const DEFAULTS = {
	enabled: true,
	zoomLevel: 0,
	hibernate: false
}

export function AddServiceDialog({ editing, onAdd, onUpdate, onRemove, onClose }: Props) {
	const [pickedCatalogId, setPickedCatalogId] = useState<string | null>(editing?.catalogId ?? null)
	const [name, setName] = useState(editing?.name ?? '')
	const [url, setUrl] = useState(editing?.url ?? '')
	const [notifications, setNotifications] = useState(editing?.notifications ?? true)
	const [muted, setMuted] = useState(editing?.muted ?? false)
	const [trustSelfSigned, setTrustSelfSigned] = useState(editing?.trustSelfSigned ?? false)
	const [hibernate, setHibernate] = useState(editing?.hibernate ?? false)
	// Per-line outbound proxy (see src/main/proxy.ts). Empty host = direct connection.
	const [proxyHost, setProxyHost] = useState(editing?.proxy?.host ?? '')
	const [proxyPort, setProxyPort] = useState(editing?.proxy?.port ? String(editing.proxy.port) : '')
	const [proxyUser, setProxyUser] = useState(editing?.proxy?.username ?? '')
	const [proxyPass, setProxyPass] = useState(editing?.proxy?.password ?? '')
	const [proxyLabel, setProxyLabel] = useState(editing?.proxy?.label ?? '')

	const catalog = pickedCatalogId ? getServiceByCatalogId(pickedCatalogId) : undefined

	function buildProxy(): ServiceInstance['proxy'] {
		const host = proxyHost.trim()
		const port = Number.parseInt(proxyPort.trim(), 10)
		if (!host || !Number.isFinite(port)) return null
		return {
			host,
			port,
			username: proxyUser.trim() || undefined,
			password: proxyPass || undefined,
			label: proxyLabel.trim() || undefined
		}
	}

	function pick(catalogId: string) {
		const entry = getServiceByCatalogId(catalogId)
		if (!entry) return
		setPickedCatalogId(catalogId)
		setName(entry.name)
		setUrl(entry.url ?? '')
	}

	function submit() {
		if (!catalog || !url) return
		if (editing) {
			onUpdate(editing.id, { name, url, notifications, muted, trustSelfSigned, hibernate, proxy: buildProxy() })
		} else {
			onAdd({
				catalogId: catalog.id,
				name,
				url,
				notifications,
				muted,
				trustSelfSigned,
				...DEFAULTS,
				hibernate,
				proxy: buildProxy()
			})
		}
		onClose()
	}

	return (
		<div class="modal-backdrop" onClick={onClose}>
			<div class="modal" onClick={(e) => e.stopPropagation()}>
				{!catalog ? (
					<>
						<h2>Agregar servicio</h2>
						<div class="modal__list">
							{SERVICES_CATALOG.map((s) => (
								<button key={s.id} class="modal__list-item" onClick={() => pick(s.id)}>
									{s.name}
								</button>
							))}
						</div>
						<button onClick={onClose}>Cancelar</button>
					</>
				) : (
					<>
						<h2>{editing ? `Editar ${editing.name}` : `Agregar ${catalog.name}`}</h2>
						{catalog.note && <p class="modal__note">{catalog.note}</p>}

						<label class="modal__field">
							Nombre
							<input type="text" value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} />
						</label>

						<label class="modal__field">
							URL
							<input
								type="url"
								placeholder="https://..."
								value={url}
								disabled={!catalog.requiresCustomUrl && !editing}
								onInput={(e) => setUrl((e.target as HTMLInputElement).value)}
							/>
						</label>

						<label class="modal__checkbox">
							<input
								type="checkbox"
								checked={notifications}
								onChange={(e) => setNotifications((e.target as HTMLInputElement).checked)}
							/>
							Notificaciones
						</label>

						<label class="modal__checkbox">
							<input type="checkbox" checked={muted} onChange={(e) => setMuted((e.target as HTMLInputElement).checked)} />
							Silenciar audio
						</label>

						{(catalog.selfHostable || trustSelfSigned) && (
							<label class="modal__checkbox">
								<input
									type="checkbox"
									checked={trustSelfSigned}
									onChange={(e) => setTrustSelfSigned((e.target as HTMLInputElement).checked)}
								/>
								Confiar en certificado autofirmado
							</label>
						)}

						<label class="modal__checkbox">
							<input
								type="checkbox"
								checked={hibernate}
								onChange={(e) => setHibernate((e.target as HTMLInputElement).checked)}
							/>
							Hibernar en segundo plano (ahorra RAM)
						</label>
						{hibernate && (
							<p class="modal__note">
								Mientras esté dormido no recibe mensajes ni notificaciones hasta que lo vuelvas a abrir.
							</p>
						)}

						<div class="modal__section">
							<span class="modal__section-title">Proxy de salida (opcional)</span>
							<p class="modal__note">
								IP por el que sale esta línea. Para líneas argentinas conviene un proxy residencial o móvil de
								Argentina con IP fijo — evita que WhatsApp cierre la sesión. Dejalo vacío para conexión directa.
							</p>
							<div class="modal__row">
								<label class="modal__field modal__field--grow">
									Host / IP
									<input
										type="text"
										placeholder="ej. 190.120.10.5"
										value={proxyHost}
										onInput={(e) => setProxyHost((e.target as HTMLInputElement).value)}
									/>
								</label>
								<label class="modal__field modal__field--port">
									Puerto
									<input
										type="text"
										inputMode="numeric"
										placeholder="8080"
										value={proxyPort}
										onInput={(e) => setProxyPort((e.target as HTMLInputElement).value)}
									/>
								</label>
							</div>
							<div class="modal__row">
								<label class="modal__field modal__field--grow">
									Usuario
									<input
										type="text"
										placeholder="(si el proxy lo pide)"
										value={proxyUser}
										onInput={(e) => setProxyUser((e.target as HTMLInputElement).value)}
									/>
								</label>
								<label class="modal__field modal__field--grow">
									Contraseña
									<input
										type="password"
										placeholder="(si el proxy lo pide)"
										value={proxyPass}
										onInput={(e) => setProxyPass((e.target as HTMLInputElement).value)}
									/>
								</label>
							</div>
							<label class="modal__field">
								Etiqueta
								<input
									type="text"
									placeholder="ej. AR móvil 1"
									value={proxyLabel}
									onInput={(e) => setProxyLabel((e.target as HTMLInputElement).value)}
								/>
							</label>
							{editing && (
								<p class="modal__note">Al guardar, la línea se recarga para reconectar por el nuevo IP.</p>
							)}
						</div>

						<div class="modal__actions">
							<button onClick={submit} disabled={!url || !name}>
								{editing ? 'Guardar' : 'Agregar'}
							</button>
							{editing ? (
								<button
									class="modal__danger"
									onClick={() => {
										onRemove(editing.id)
										onClose()
									}}
								>
									Quitar
								</button>
							) : (
								<button onClick={() => setPickedCatalogId(null)}>Volver</button>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	)
}
