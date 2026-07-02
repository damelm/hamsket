import { useCallback, useEffect, useState } from 'preact/hooks'
import type { AppConfig } from '@shared/types'

export function useConfig() {
	const [config, setConfigState] = useState<AppConfig | null>(null)

	useEffect(() => {
		window.hamsketApi.getConfig().then(setConfigState)
	}, [])

	const setConfig = useCallback(async (patch: Partial<AppConfig>) => {
		setConfigState(await window.hamsketApi.setConfig(patch))
	}, [])

	return { config, setConfig }
}
