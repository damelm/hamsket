import type { ServiceInstance } from '@shared/types'
import { getServiceByCatalogId } from '@shared/services-catalog'

interface Props {
	services: ServiceInstance[]
	activeId: string | null
	badges: Record<string, number>
	onSelect: (id: string) => void
	onEdit: (service: ServiceInstance) => void
	onAddClick: () => void
	onPreferencesClick: () => void
}

export function TabBar({ services, activeId, badges, onSelect, onEdit, onAddClick, onPreferencesClick }: Props) {
	return (
		<div class="tab-bar">
			<div class="tab-bar__list">
				{services
					.slice()
					.sort((a, b) => a.position - b.position)
					.map((service) => {
						const catalog = getServiceByCatalogId(service.catalogId)
						const count = badges[service.id] ?? 0
						return (
							<button
								key={service.id}
								class={`tab-bar__item${service.id === activeId ? ' tab-bar__item--active' : ''}`}
								onClick={() => onSelect(service.id)}
								onDblClick={() => onEdit(service)}
								title={`${service.name} (doble clic para editar)`}
							>
								{catalog && <img class="tab-bar__icon" src={`/${catalog.icon}`} alt="" />}
								<span class="tab-bar__label">{service.name}</span>
								{count > 0 && <span class="tab-bar__badge">{count > 99 ? '99+' : count}</span>}
							</button>
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
		</div>
	)
}
