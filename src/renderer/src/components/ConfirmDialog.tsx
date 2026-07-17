interface Props {
	title: string
	message: string
	confirmLabel?: string
	danger?: boolean
	onConfirm: () => void
	onCancel: () => void
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirmar', danger, onConfirm, onCancel }: Props) {
	return (
		<div class="modal-backdrop" onClick={onCancel}>
			<div class="modal" onClick={(e) => e.stopPropagation()}>
				<h2>{title}</h2>
				<p class="modal__note">{message}</p>
				<div class="modal__actions">
					<button onClick={onCancel}>Cancelar</button>
					<button class={danger ? 'modal__danger' : ''} onClick={onConfirm}>
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	)
}
