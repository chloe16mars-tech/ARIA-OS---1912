/**
 * Best-effort SSRF guard for user-supplied URLs.
 *
 * The previous implementation matched substrings on the raw URL, which
 * misses IPv4 obfuscation, IPv6, hostnames that resolve to private ranges,
 * and cloud metadata endpoints. This version parses the URL with the WHATWG
 * URL parser and rejects the obvious cases. It is *not* a substitute for
 * resolving DNS at request time and re-checking the resolved IP — but it
 * raises the bar significantly for free.
 */

const FORBIDDEN_PROTOCOLS = new Set(['file:', 'ftp:', 'gopher:', 'data:']);

const FORBIDDEN_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.goog',
  'instance-data',
]);

/** Returns true if the URL is safe to fetch (best effort). */
export function isSafePublicUrl(input: string): boolean {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return false;
  }

  if (!['http:', 'https:'].includes(url.protocol)) return false;
  if (FORBIDDEN_PROTOCOLS.has(url.protocol)) return false;

  const hostname = url.hostname.toLowerCase();
  if (FORBIDDEN_HOSTNAMES.has(hostname)) return false;
  if (hostname.endsWith('.localhost') || hostname.endsWith('.internal')) return false;

  // IPv4 literal — block private / link-local / loopback / cloud metadata.
  const ipv4 = parseIPv4(hostname);
  if (ipv4 && isPrivateIPv4(ipv4)) return false;

  // IPv6 literal — block loopback and private ranges.
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    const v6 = hostname.slice(1, -1).toLowerCase();
    if (v6 === '::1' || v6.startsWith('fe80:') || v6.startsWith('fc') || v6.startsWith('fd')) {
      return false;
    }
  }

  return true;
}

/** Parse a dotted-quad IPv4. Accepts decimal octets only (the common case). */
function parseIPv4(host: string): [number, number, number, number] | null {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const oct = [m[1], m[2], m[3], m[4]].map((s) => Number.parseInt(s, 10));
  if (oct.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
  return oct as [number, number, number, number];
}

function isPrivateIPv4([a, b]: [number, number, number, number]): boolean {
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 169 && b === 254) return true; // link-local + AWS/GCP metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a >= 224) return true; // multicast & reserved
  return false;
}
