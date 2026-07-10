import { useLayoutEffect, useRef, useState } from 'preact/hooks'
import type { ServiceInstance } from '@shared/types'
import { getServiceByCatalogId } from '@shared/services-catalog'

const MIN_WIDTH = 64
const MAX_WIDTH = 340
// Below this width the sidebar collapses to an icons-only rail.
const COMPACT_BELOW = 150

interface Props {
	services: ServiceInstance[]
	activeId: string | null
	badges: Record<string, number>
	live: Record<string, boolean>
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
	live,
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
	const listRef = useRef<HTMLDivElement>(null)
	const [ind, setInd] = useState<{ top: number; height: number; visible: boolean }>({
		top: 0,
		height: 0,
		visible: false
	})

	const compact = width < COMPACT_BELOW
	const ordered = [...services].sort((a, b) => a.position - b.position)

	// Slide the active-indicator to the active row by measuring its real position.
	useLayoutEffect(() => {
		const el = listRef.current?.querySelector('.svc-row--active') as HTMLElement | null
		if (el) setInd({ top: el.offsetTop, height: el.offsetHeight, visible: true })
		else setInd((s) => ({ ...s, visible: false }))
	}, [activeId, ordered.length, width, compact])

	function startDrag(e: PointerEvent) {
		startRef.current = { x: e.clientX, width }
		;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
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
		<div class={`sidebar${compact ? ' sidebar--compact' : ''}`} style={{ width: `${width}px` }}>
			{!compact && (
				<div class="sidebar__head">
					<span class="sidebar__lbl">Servicios</span>
					<span class="sidebar__count">{ordered.length}</span>
				</div>
			)}

			<div class="sidebar__list" ref={listRef}>
				<div
					class="sidebar__ind"
					style={{
						transform: `translateY(${ind.top}px)`,
						height: `${ind.height}px`,
						opacity: ind.visible ? 1 : 0
					}}
				/>
				{ordered.map((service) => {
					const catalog = getServiceByCatalogId(service.catalogId)
					const count = badges[service.id] ?? 0
					const isLive = live[service.id]
					return (
						<button
							key={service.id}
							class={`svc-row${service.id === activeId ? ' svc-row--active' : ''}`}
							onClick={() => onSelect(service.id)}
							onDblClick={() => onEdit(service)}
							onContextMenu={(e) => {
								e.preventDefault()
								onContextMenu(service, e.clientX, e.clientY)
							}}
							title={compact ? service.name : undefined}
						>
							<span class="svc-row__av">
								{catalog && <img src={`./${catalog.icon}`} alt="" />}
								{count > 0 && <span class="svc-row__dot" />}
							</span>
							{!compact && (
								<span class="svc-row__meta">
									<span class="svc-row__nm">{service.name}</span>
									<span class={`svc-row__st svc-row__st--${isLive ? 'on' : 'sleep'}`}>
										<span class="svc-row__stdot" />
										{isLive ? 'en línea' : 'en pausa'}
									</span>
								</span>
							)}
							{count > 0 && <span class="svc-row__badge">{count > 99 ? '99+' : count}</span>}
							{!compact && (
								<span
									class="svc-row__edit"
									title="Editar / renombrar"
									role="button"
									onClick={(e) => {
										e.stopPropagation()
										onEdit(service)
									}}
								>
									✎
								</span>
							)}
						</button>
					)
				})}
			</div>

			<div class="sidebar__foot">
				<button class="sidebar__add" onClick={onAddClick} title="Agregar servicio">
					<span class="sidebar__add-plus">+</span>
					{!compact && <span>Agregar</span>}
				</button>
				<button class="sidebar__cog" onClick={onPreferencesClick} title="Preferencias" aria-label="Preferencias">
					⚙
				</button>
			</div>

			<div
				class="sidebar__resize"
				onPointerDown={startDrag}
				onPointerMove={onDrag}
				onPointerUp={endDrag}
				title="Arrastrar para redimensionar"
			/>
		</div>
	)
}
