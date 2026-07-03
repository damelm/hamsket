import { useRef } from 'preact/hooks'
import type { ServiceInstance } from '@shared/types'
import { getServiceByCatalogId } from '@shared/services-catalog'

const MIN_WIDTH = 64
const MAX_WIDTH = 320

interface Props {
	services: ServiceInstance[]
	activeId: string | null
	badges: Record<string, number>
	width: number
	onResize: (width: number) => void
	onResizeEnd: (width: number) => void
	onSelect: (id: string) => void
	onEdit: (service: ServiceInstance) => void
	onContextMenu: (service: ServiceInstance, x: number, y: number) => void
	onAddClick: () => void
	onPreferencesClick: () => void
}

export function TabBar({
	services,
	activeId,
	badges,
	width,
	onResize,
	onResizeEnd,
	onSelect,
	onEdit,
	onContextMenu,
	onAddClick,
	onPreferencesClick
}: Props) {
	const startRef = useRef<{ x: number; width: number } | null>(null)
	const liveWidthRef = useRef(width)

	function startDrag(e: PointerEvent) {
		startRef.current = { x: e.clientX, width }
		const target = e.currentTarget as HTMLElement
		target.setPointerCapture(e.pointerId)
	}

	function onDrag(e: PointerEvent) {
		if (!startRef.current) return
		const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startRef.current.width + (e.clientX - startRef.current.x)))
		liveWidthRef.current = next
		onResize(next)
	}

	function endDrag() {
		if (!startRef.current) return
		startRef.current = null
		onResizeEnd(liveWidthRef.current)
	}

	return (
		<div class="tab-bar" style={{ width: `${width}px` }}>
			<div class="tab-bar__list">
				{services
					.slice()
					.sort((a, b) => a.position - b.position)
					.map((service) => {
						const catalog = getServiceByCatalogId(service.catalogId)
						const count = badges[service.id] ?? 0
						return (
							<div key={service.id} class="tab-bar__item-wrap">
								<button
									class={`tab-bar__item${service.id === activeId ? ' tab-bar__item--active' : ''}`}
									onClick={() => onSelect(service.id)}
									onDblClick={() => onEdit(service)}
									onContextMenu={(e) => {
										e.preventDefault()
										onContextMenu(service, e.clientX, e.clientY)
									}}
									title={service.name}
								>
									{catalog && <img class="tab-bar__icon" src={`./${catalog.icon}`} alt="" />}
									<span class="tab-bar__label">{service.name}</span>
									{count > 0 && <span class="tab-bar__badge">{count > 99 ? '99+' : count}</span>}
								</button>
								<button
									class="tab-bar__edit"
									title="Editar / renombrar"
									onClick={(e) => {
										e.stopPropagation()
										onEdit(service)
									}}
								>
									✎
								</button>
							</div>
						)
					})}
			</div>
			<div class="tab-bar__actions">
				<button class="tab-bar__action" onClick={onAddClick} title="Agregar servicio">
					+
				</button>
				<button class="tab-bar__action" onClick={onPreferencesClick} title="Preferencias">
					⚙
				</button>
			</div>
			<div
				class="tab-bar__resize-handle"
				onPointerDown={startDrag}
				onPointerMove={onDrag}
				onPointerUp={endDrag}
				title="Arrastrar para redimensionar"
			/>
		</div>
	)
}
