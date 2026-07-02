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
	zoomLevel: 0
}

export function AddServiceDialog({ editing, onAdd, onUpdate, onRemove, onClose }: Props) {
	const [pickedCatalogId, setPickedCatalogId] = useState<string | null>(editing?.catalogId ?? null)
	const [name, setName] = useState(editing?.name ?? '')
	const [url, setUrl] = useState(editing?.url ?? '')
	const [notifications, setNotifications] = useState(editing?.notifications ?? true)
	const [muted, setMuted] = useState(editing?.muted ?? false)
	const [trustSelfSigned, setTrustSelfSigned] = useState(editing?.trustSelfSigned ?? false)

	const catalog = pickedCatalogId ? getServiceByCatalogId(pickedCatalogId) : undefined

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
			onUpdate(editing.id, { name, url, notifications, muted, trustSelfSigned })
		} else {
			onAdd({
				catalogId: catalog.id,
				name,
				url,
				notifications,
				muted,
				trustSelfSigned,
				...DEFAULTS
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

						<label class="modal__checkbox">
							<input
								type="checkbox"
								checked={trustSelfSigned}
								onChange={(e) => setTrustSelfSigned((e.target as HTMLInputElement).checked)}
							/>
							Confiar en certificado autofirmado
						</label>

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
