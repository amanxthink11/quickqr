export interface CoarseLocation {
  country: string | null;
  region: string | null;
  city: string | null;
}

/**
 * Resolves approximate coarse geographic data from standard reverse proxy/CDN headers.
 *
 * Privacy Guarantees:
 * - NO raw IP address is stored, logged, or retained.
 * - NO GPS coordinates are collected or accessed.
 * - Only coarse, high-level country, region, and city names are extracted.
 * - GeoIP resolution is approximate, best-effort, and can be inaccurate (e.g. VPNs, proxies, carrier gateways).
 */
export function resolveCoarseGeo(headers: Headers): CoarseLocation {
  // 1. Cloudflare geolocation headers
  const cfCountry = headers.get('cf-ipcountry');
  const cfRegion = headers.get('cf-region');
  const cfCity = headers.get('cf-ipcity');

  // 2. Vercel edge geolocation headers
  const vercelCountry = headers.get('x-vercel-ip-country');
  const vercelRegion = headers.get('x-vercel-ip-country-region');
  const vercelCity = headers.get('x-vercel-ip-city');

  // 3. Generic reverse proxy geolocation headers (e.g. Nginx / Hostinger / Cloud)
  const genericCountry =
    headers.get('x-country-code') ||
    headers.get('x-geo-country') ||
    headers.get('geoip-country-code');
  const genericRegion = headers.get('x-geo-region');
  const genericCity = headers.get('x-geo-city');

  const country = sanitizeGeoString(cfCountry || vercelCountry || genericCountry, 100);
  const region = sanitizeGeoString(cfRegion || vercelRegion || genericRegion, 100);
  const city = sanitizeGeoString(cfCity || vercelCity || genericCity, 100);

  return {
    country: country ? country.toUpperCase() : null,
    region: region || null,
    city: city || null,
  };
}

function sanitizeGeoString(val: string | null | undefined, maxLength: number): string | null {
  if (!val || typeof val !== 'string') return null;
  const cleaned = val.replace(/[^a-zA-Z0-9\s,.-]/g, '').trim();
  if (cleaned === '' || cleaned.toLowerCase() === 'xx' || cleaned.toLowerCase() === 'unknown') {
    return null;
  }
  return cleaned.slice(0, maxLength);
}
