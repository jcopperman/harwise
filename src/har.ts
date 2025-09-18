import { filterSamples, generateKey } from './match.js';

export interface ApiSample {
  method: string;
  url: string;
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

export function parseHar(har: any, options: { include?: string; exclude?: string } = {}): ApiSample[] {
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

    // Canonicalize URL
    const url = canonicalizeUrl(request.url);

    const sample: ApiSample = {
      method: request.method,
      url,
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

function canonicalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Sort query params
    const params = new URLSearchParams(u.search);
    const sortedParams = new URLSearchParams([...params.entries()].sort());
    u.search = sortedParams.toString();
    // Remove fragment
    u.hash = '';
    return u.toString();
  } catch {
    return url;
  }
}