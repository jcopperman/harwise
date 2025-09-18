import { filterSamples, generateKey } from './match.js';

export interface ApiSample {
  method: string;
  // Canonical URL (origin + path + sorted query, no fragment)
  url: string;
  // Original raw URL from the HAR entry
  originalUrl?: string;
  // Templated URL (path params like numeric IDs/UUIDs replaced)
  templatedUrl?: string;
  status: number;
  time: number;
  size: number;
  mime: string;
  reqHeaders: Record<string, string>;
  resHeaders: Record<string, string>;
  reqBody?: string;
  resBody?: string;
  key: string;
}

export function parseHar(
  har: any,
  options: { include?: string; exclude?: string; template?: boolean } = {}
): ApiSample[] {
  const samples: ApiSample[] = [];
  if (!har.log || !har.log.entries) {
    return samples;
  }

  for (const entry of har.log.entries) {
    const request = entry.request;
    const response = entry.response;
    const timings = entry.timings;

    // Calculate total time
    const time = timings ? Object.values(timings).reduce((sum: number, t: any) => sum + (typeof t === 'number' ? t : 0), 0) : 0;

    // Get response size
    const size = response.content ? response.content.size || 0 : 0;

    // Get MIME type
    const mime = response.content ? response.content.mimeType || '' : '';

    // Parse headers
    const reqHeaders: Record<string, string> = {};
    if (request.headers) {
      for (const h of request.headers) {
        reqHeaders[h.name.toLowerCase()] = h.value;
      }
    }

    const resHeaders: Record<string, string> = {};
    if (response.headers) {
      for (const h of response.headers) {
        resHeaders[h.name.toLowerCase()] = h.value;
      }
    }

    // Get bodies (if present)
    const reqBody = request.postData ? request.postData.text : undefined;
    const resBody = response.content ? response.content.text : undefined;

    // Canonicalize URL and build templated variant
    const { canonUrl, templatedUrl } = canonicalizeUrl(request.url);
    const useTemplating = options.template !== false; // default ON
    const url = canonUrl;

    const sample: ApiSample = {
      method: request.method,
      url,
      originalUrl: request.url,
      templatedUrl: useTemplating ? templatedUrl : undefined,
      status: response.status,
      time,
      size,
      mime,
      reqHeaders,
      resHeaders,
      reqBody,
      resBody,
      key: '' // Will be set after filtering
    };

    samples.push(sample);
  }

  // Filter samples
  const filtered = filterSamples(samples, options);

  // Generate keys
  filtered.forEach(sample => {
    sample.key = generateKey(sample);
  });

  return filtered;
}

function canonicalizeUrl(url: string): { canonUrl: string; templatedUrl: string } {
  try {
    const u = new URL(url);
    // Sort query params (keys and values) for deterministic ordering
  const params = new URLSearchParams(u.search);
  const entries = Array.from(params.entries());
  entries.sort((a, b) => (a[0] === b[0] ? a[1].localeCompare(b[1]) : a[0].localeCompare(b[0])));
  const sortedParams = new URLSearchParams(entries);
    // Remove fragment
    u.hash = '';

  const canonPath = u.pathname || '/';
    const templatedPath = templatePath(canonPath);
  const queryStr = sortedParams.toString();
  const qs = queryStr ? `?${queryStr}` : '';

    const origin = `${u.protocol}//${u.host}`;
  const canonUrl = `${origin}${canonPath}${qs}`;
    const templatedUrl = `${origin}${templatedPath}${qs}`;
    return { canonUrl, templatedUrl };
  } catch {
    // Fallback: best-effort string ops
    try {
      // If not a valid URL, just template the path part if it looks like a path
      const templated = templatePath(url);
      return { canonUrl: url, templatedUrl: templated };
    } catch {
      return { canonUrl: url, templatedUrl: url };
    }
  }
}

// Replace dynamic path segments with templates
export function templatePath(pathname: string): string {
  const segments = pathname.split('/').map(seg => {
    if (!seg) return seg;
    let s = seg;
    try { s = decodeURIComponent(seg); } catch { /* keep raw */ }
    // UUID v1-5 pattern
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRe.test(s)) return '{uuid}';
    // Numeric ID (all digits)
    if (/^\d+$/.test(s)) return '{id}';
    return seg;
  });
  return segments.join('/');
}