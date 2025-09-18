import { filterSamples, generateKey } from './match.js';
export function parseHar(har, options = {}) {
    const samples = [];
    if (!har.log || !har.log.entries) {
        return samples;
    }
    for (const entry of har.log.entries) {
        const request = entry.request;
        const response = entry.response;
        const timings = entry.timings;
        // Calculate total time
        const time = timings ? Object.values(timings).reduce((sum, t) => sum + (typeof t === 'number' ? t : 0), 0) : 0;
        // Get response size
        const size = response.content ? response.content.size || 0 : 0;
        // Get MIME type
        const mime = response.content ? response.content.mimeType || '' : '';
        // Parse headers
        const reqHeaders = {};
        if (request.headers) {
            for (const h of request.headers) {
                reqHeaders[h.name.toLowerCase()] = h.value;
            }
        }
        const resHeaders = {};
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
        const sample = {
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
function canonicalizeUrl(url) {
    try {
        const u = new URL(url);
        // Sort query params
        const params = new URLSearchParams(u.search);
        const sortedParams = new URLSearchParams([...params.entries()].sort());
        u.search = sortedParams.toString();
        // Remove fragment
        u.hash = '';
        return u.toString();
    }
    catch {
        return url;
    }
}
