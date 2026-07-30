/** Host allowlist for the paste bar (R1-3): Oikotie + Etuovi sale listings. Shared client/server. */

const ALLOWED_HOSTS = ["asunnot.oikotie.fi", "www.oikotie.fi", "oikotie.fi", "www.etuovi.com", "etuovi.com"];

export function isSupportedListingUrl(raw: string): boolean {
    try {
        const url = new URL(raw.trim());
        return url.protocol === "https:" && ALLOWED_HOSTS.includes(url.hostname.toLowerCase());
    } catch {
        return false;
    }
}
