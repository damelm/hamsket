import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '../../src/main/master-password'

describe('master password hashing', () => {
	it('verifies the correct password', () => {
		const hash = hashPassword('correct horse battery staple')
		expect(verifyPassword('correct horse battery staple', hash)).toBe(true)
	})

	it('rejects an incorrect password', () => {
		const hash = hashPassword('correct horse battery staple')
		expect(verifyPassword('wrong password', hash)).toBe(false)
	})

	it('produces a different hash (and salt) each time', () => {
		const a = hashPassword('same password')
		const b = hashPassword('same password')
		expect(a).not.toBe(b)
		expect(verifyPassword('same password', a)).toBe(true)
		expect(verifyPassword('same password', b)).toBe(true)
	})

	it('rejects a malformed stored value instead of throwing', () => {
		expect(verifyPassword('anything', 'not-a-valid-hash')).toBe(false)
	})
})
