import { useCallback, useEffect, useState } from 'preact/hooks'
import type { ServiceInstance } from '@shared/types'

export function useServices() {
	const [services, setServices] = useState<ServiceInstance[]>([])
	const [loaded, setLoaded] = useState(false)

	useEffect(() => {
		window.hamsketApi.listServices().then((list) => {
			setServices(list)
			setLoaded(true)
		})
	}, [])

	const addService = useCallback(async (input: Omit<ServiceInstance, 'id' | 'position'>) => {
		setServices(await window.hamsketApi.addService(input))
	}, [])

	const updateService = useCallback(async (id: string, patch: Partial<ServiceInstance>) => {
		setServices(await window.hamsketApi.updateService(id, patch))
	}, [])

	const removeService = useCallback(async (id: string) => {
		setServices(await window.hamsketApi.removeService(id))
	}, [])

	const reorderServices = useCallback(async (orderedIds: string[]) => {
		setServices(await window.hamsketApi.reorderServices(orderedIds))
	}, [])

	return { services, loaded, addService, updateService, removeService, reorderServices }
}
