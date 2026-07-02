import type { ServiceCatalogEntry } from './types'

// Every unreadScript below was ported from Hamsket's pre-2022 catalog (or, for
// Nextcloud Talk, written from scratch with no precedent to go on) and targets
// each site's DOM as it looked years ago. Chat web apps rename their CSS classes
// often, so treat every selector here as a starting point to re-verify against
// the live site, not a guarantee — hence unreadScriptUnverified on all of them.
// ServiceView also runs a title-based fallback ("(3) Slack" → 3 unread) so a
// stale selector degrades to that instead of going silent.

export const SERVICES_CATALOG: ServiceCatalogEntry[] = [
	{
		id: 'whatsapp',
		name: 'WhatsApp',
		icon: 'whatsapp.png',
		url: 'https://web.whatsapp.com/',
		requiresCustomUrl: false,
		unreadScriptUnverified: true,
		unreadScript: `
			const checkUnread = () => {
				const items = document.querySelectorAll('[aria-label="Lista de chats"] [aria-label*="no leído"], #pane-side [aria-label*="unread"]');
				let count = 0;
				for (const item of items) {
					const badge = item.querySelector('span[aria-label*="unread"], span[aria-label*="no leíd"]');
					count += badge ? (hamsket.parseIntOrZero(badge.textContent) || 1) : 0;
				}
				hamsket.updateBadge(count);
			};
			setInterval(checkUnread, 2000);
		`
	},
	{
		id: 'telegram',
		name: 'Telegram',
		icon: 'telegram.png',
		url: 'https://web.telegram.org/a/',
		requiresCustomUrl: false,
		unreadScriptUnverified: true,
		unreadScript: `
			const checkUnread = () => {
				const badges = document.querySelectorAll('.dialog-list .badge.unread:not(.badge--muted), .chatlist .badge.unread:not(.is-muted)');
				let count = 0;
				for (const badge of badges) count += hamsket.parseIntOrZero(badge.textContent.trim());
				hamsket.updateBadge(count);
			};
			setInterval(checkUnread, 3000);
		`
	},
	{
		id: 'slack',
		name: 'Slack',
		icon: 'slack.png',
		url: null,
		requiresCustomUrl: true,
		note: 'Ingresá la URL de tu workspace, ej. https://tuempresa.slack.com/',
		unreadScriptUnverified: true,
		unreadScript: `
			const checkUnread = () => {
				const indirectSel = '.p-channel_sidebar__channel--unread:not(.p-channel_sidebar__channel--muted)';
				const indirect = document.querySelectorAll(indirectSel).length;
				let direct = 0;
				for (const badge of document.querySelectorAll(indirectSel + ' .p-channel_sidebar__badge')) {
					direct += hamsket.parseIntOrZero(badge.textContent);
				}
				hamsket.updateBadge(direct, indirect);
			};
			setInterval(checkUnread, 3000);
		`
	},
	{
		id: 'nextcloud-talk',
		name: 'Nextcloud Talk',
		icon: 'nextcloud-talk.png',
		url: null,
		requiresCustomUrl: true,
		note: 'Ingresá la URL de tu instancia Nextcloud, ej. https://tudominio.com/apps/spreed/. Sin precedente en Hamsket original — el contador puede no funcionar hasta verificarlo contra una instancia real.',
		unreadScriptUnverified: true,
		unreadScript: `
			const checkUnread = () => {
				const badges = document.querySelectorAll('.conversation-list .counter-bubble__counter, .app-content-list .unread-mentions');
				let count = 0;
				for (const badge of badges) count += hamsket.parseIntOrZero(badge.textContent);
				hamsket.updateBadge(count);
			};
			setInterval(checkUnread, 3000);
		`
	},
	{
		id: 'element',
		name: 'Element',
		icon: 'element.png',
		url: 'https://app.element.io/',
		requiresCustomUrl: false,
		unreadScriptUnverified: true,
		unreadScript: `
			const checkUnread = () => {
				const indirect = document.querySelectorAll('.mx_RoomTile_badgeContainer .mx_NotificationBadge_dot').length;
				let direct = 0;
				for (const badge of document.querySelectorAll('.mx_RoomTile_badgeContainer .mx_NotificationBadge_count')) {
					direct += hamsket.parseIntOrZero(badge.textContent);
				}
				hamsket.updateBadge(direct, indirect);
			};
			setInterval(checkUnread, 2000);
		`
	},
	{
		id: 'custom',
		name: 'URL personalizada',
		icon: 'custom.png',
		url: null,
		requiresCustomUrl: true,
		note: 'Cualquier sitio web. Sin detección de no-leídos automática salvo por el título de la pestaña.'
	}
]

export function getServiceByCatalogId(id: string): ServiceCatalogEntry | undefined {
	return SERVICES_CATALOG.find((s) => s.id === id)
}
