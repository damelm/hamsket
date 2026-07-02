import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

// scrypt replaces the MD5 hash used by the original Hamsket master password
// feature — MD5 has no place guarding access to a user's messaging accounts.
const KEY_LENGTH = 64

export function hashPassword(password: string): string {
	const salt = randomBytes(16)
	const derived = scryptSync(password, salt, KEY_LENGTH)
	return `${salt.toString('hex')}:${derived.toString('hex')}`
}

export function verifyPassword(password: string, stored: string): boolean {
	const [saltHex, hashHex] = stored.split(':')
	if (!saltHex || !hashHex) return false

	const salt = Buffer.from(saltHex, 'hex')
	const expected = Buffer.from(hashHex, 'hex')
	const actual = scryptSync(password, salt, expected.length)

	return actual.length === expected.length && timingSafeEqual(actual, expected)
}
