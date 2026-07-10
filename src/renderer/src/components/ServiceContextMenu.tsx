import { useEffect } from 'preact/hooks'
import type { ServiceInstance } from '@shared/types'

interface Props {
	service: ServiceInstance
	x: number
	y: number
	onEdit: () => void
	onReload: () => void
	onToggleMute: () => void
	onToggleHibernate: () => void
	onRemove: () => void
	onClose: () => void
}

export function ServiceContextMenu({
	service,
	x,
	y,
	onEdit,
	onReload,
	onToggleMute,
	onToggleHibernate,
	onRemove,
	onClose
}: Props) {
	useEffect(() => {
		const close = () => onClose()
		window.addEventListener('click', close)
		window.addEventListener('resize', close)
		window.addEventListener('keydown', close)
		return () => {
			window.removeEventListener('click', close)
			window.removeEventListener('resize', close)
			window.removeEventListener('keydown', close)
		}
	}, [onClose])

	// Keep the menu on-screen.
	const style = { left: `${Math.min(x, window.innerWidth - 200)}px`, top: `${Math.min(y, window.innerHeight - 160)}px` }

	return (
		<div class="context-menu" style={style} onClick={(e) => e.stopPropagation()}>
			<div class="context-menu__title">{service.name}</div>
			<button class="context-menu__item" onClick={onEdit}>
				Editar / renombrar…
			</button>
			<button class="context-menu__item" onClick={onReload}>
				Recargar
			</button>
			<button class="context-menu__item" onClick={onToggleMute}>
				{service.muted ? 'Reactivar audio' : 'Silenciar audio'}
			</button>
			<button class="context-menu__item" onClick={onToggleHibernate}>
				{service.hibernate ? 'No hibernar en segundo plano' : 'Hibernar en segundo plano'}
			</button>
			<div class="context-menu__sep" />
			<button class="context-menu__item context-menu__item--danger" onClick={onRemove}>
				Quitar
			</button>
		</div>
	)
}
