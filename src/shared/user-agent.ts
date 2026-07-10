// Services like WhatsApp Web gate features (and sometimes the whole app, e.g.
// the QR login screen) behind a User-Agent check. Electron's default UA carries
// non-standard product tokens ("OpsDesk/x", "OpsDesk Test/x", "Electron/x") that
// can trip those checks and make the site think it's an outdated browser.
//
// Rather than trying to strip those tokens with a regex (fragile: it breaks the
// moment the app name contains a space, as it does under a test profile), we
// rebuild a canonical desktop Chrome UA from scratch, keeping only the real
// platform and the real Chromium version. The result is always a clean,
// current Chrome UA — independent of the app name or Electron version.
export function toCleanChromeUA(rawUA: string): string {
	const chrome = rawUA.match(/Chrome\/[\d.]+/)?.[0] ?? 'Chrome/131.0.0.0'
	// First parenthesized group is the platform token, e.g. "Windows NT 10.0; Win64; x64".
	const platform = rawUA.match(/\(([^)]*)\)/)?.[1] ?? 'Windows NT 10.0; Win64; x64'
	return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) ${chrome} Safari/537.36`
}
