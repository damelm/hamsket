import { app, session, webContents } from 'electron'
import { join } from 'node:path'
import { readdir, rm } from 'node:fs/promises'
import type { ServiceInstance } from '../shared/types'

// Every service's login lives in its own persistent partition on disk
// (userData/Partitions/<catalogId>%3A<id>). Removing a service must wipe that
// session completely — no orphaned folders, no stale/crossed data left behind.

function partitionName(catalogId: string, id: string): string {
	return `${catalogId}:${id}`
}

function partitionFolder(catalogId: string, id: string): string {
	// Electron percent-encodes the partition name for the folder (":" -> "%3A").
	return join(app.getPath('userData'), 'Partitions', encodeURIComponent(partitionName(catalogId, id)))
}

/** Fully removes a service's session: closes its webContents, clears all its
 *  storage/cache, and deletes the on-disk partition folder. */
export async function purgeServiceSession(service: ServiceInstance): Promise<void> {
	const partition = `persist:${partitionName(service.catalogId, service.id)}`
	const ses = session.fromPartition(partition)

	// Tear down any live view on this session first so nothing repopulates it.
	for (const wc of webContents.getAllWebContents()) {
		try {
			if (wc.session === ses) wc.close()
		} catch {
			/* already gone */
		}
	}

	try {
		await ses.clearStorageData()
	} catch {
		/* ignore */
	}
	try {
		await ses.clearCache()
	} catch {
		/* ignore */
	}
	try {
		await rm(partitionFolder(service.catalogId, service.id), { recursive: true, force: true })
	} catch {
		/* folder may be briefly locked; the startup sweep will finish the job */
	}
}

/** Deletes any partition folder on disk that no current service points at, so a
 *  removed (or crashed-mid-removal) session never lingers. Runs at startup. */
export async function sweepOrphanPartitions(services: ServiceInstance[]): Promise<void> {
	const dir = join(app.getPath('userData'), 'Partitions')
	let entries: string[]
	try {
		entries = await readdir(dir)
	} catch {
		return // no Partitions dir yet
	}
	const alive = new Set(services.map((s) => partitionName(s.catalogId, s.id)))
	for (const entry of entries) {
		let decoded: string
		try {
			decoded = decodeURIComponent(entry)
		} catch {
			decoded = entry
		}
		if (!alive.has(decoded)) {
			try {
				await rm(join(dir, entry), { recursive: true, force: true })
			} catch {
				/* ignore — will retry next launch */
			}
		}
	}
}
