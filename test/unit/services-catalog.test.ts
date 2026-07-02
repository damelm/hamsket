import { describe, expect, it } from 'vitest'
import { SERVICES_CATALOG, getServiceByCatalogId } from '@shared/services-catalog'

describe('SERVICES_CATALOG', () => {
	it('has exactly the six intended entries', () => {
		expect(SERVICES_CATALOG.map((s) => s.id).sort()).toEqual(
			['custom', 'element', 'nextcloud-talk', 'slack', 'telegram', 'whatsapp'].sort()
		)
	})

	it('has a unique id per entry', () => {
		const ids = SERVICES_CATALOG.map((s) => s.id)
		expect(new Set(ids).size).toBe(ids.length)
	})

	it('gives a fixed url only to entries that do not require a custom one', () => {
		for (const entry of SERVICES_CATALOG) {
			if (entry.requiresCustomUrl) {
				expect(entry.url).toBeNull()
			} else {
				expect(typeof entry.url).toBe('string')
			}
		}
	})

	it('resolves entries by id', () => {
		expect(getServiceByCatalogId('whatsapp')?.name).toBe('WhatsApp')
		expect(getServiceByCatalogId('does-not-exist')).toBeUndefined()
	})
})
