export function filterSamples(samples, options) {
    return samples.filter(sample => {
        // API-like heuristic
        if (!isApiLike(sample)) {
            return false;
        }
        // Include regex
        if (options.include) {
            const includeRegex = new RegExp(options.include);
            if (!includeRegex.test(sample.url)) {
                return false;
            }
        }
        // Exclude regex
        if (options.exclude) {
            const excludeRegex = new RegExp(options.exclude);
            if (excludeRegex.test(sample.url)) {
                return false;
            }
        }
        return true;
    });
}
function isApiLike(sample) {
    // XHR/Fetch
    if (sample.reqHeaders['x-requested-with'] === 'XMLHttpRequest' || sample.reqHeaders['fetch-mode']) {
        return true;
    }
    // MIME matches
    const apiMimes = /(json|xml|text|javascript)/i;
    if (apiMimes.test(sample.mime)) {
        return true;
    }
    // URL patterns
    const apiPatterns = /\/api\/|\/v\d+\//;
    if (apiPatterns.test(sample.url)) {
        return true;
    }
    return false;
}
export function generateKey(sample) {
    return `${sample.method} ${sample.url}`;
}
