export function generateInsomniaCollection(samples, options = {}) {
    const resources = [];
    // Base environment
    const baseEnvId = 'env_base';
    resources.push({
        _id: baseEnvId,
        _type: 'environment',
        name: 'Base',
        data: {
            base_url: options.baseUrl || '',
            auth_token: ''
        }
    });
    // Staging environment if env file provided
    if (options.envFile) {
        // TODO: load from .env file
        resources.push({
            _id: 'env_staging',
            _type: 'environment',
            name: 'Staging',
            data: {
                base_url: options.baseUrl || '',
                auth_token: ''
            }
        });
    }
    // Request group
    const groupId = 'fld_root';
    resources.push({
        _id: groupId,
        _type: 'request_group',
        name: 'harwise import'
    });
    // Extract auth token if present
    let authToken = '';
    for (const sample of samples) {
        const authHeader = sample.reqHeaders.authorization || sample.reqHeaders['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            authToken = authHeader.substring(7);
            break;
        }
    }
    // Update base environment with auth token
    if (authToken) {
        const baseEnv = resources.find(r => r._id === baseEnvId);
        if (baseEnv) {
            baseEnv.data.auth_token = authToken;
        }
    }
    // Generate requests
    samples.forEach((sample, index) => {
        const requestId = `req_${index}`;
        const request = {
            _id: requestId,
            _type: 'request',
            parentId: groupId,
            name: `${sample.method} ${getEndpointName(sample.templatedUrl || sample.url)}`,
            method: sample.method,
            url: normalizeUrl(sample.url, options.baseUrl),
            headers: generateHeaders(sample.reqHeaders, options.maskHeaders || []),
            body: generateBody(sample.reqBody, sample.reqHeaders)
        };
        resources.push(request);
    });
    return JSON.stringify({
        _type: 'export',
        __export_format: 4,
        resources
    }, null, 2);
}
function getEndpointName(url) {
    try {
        const u = new URL(url);
        return `${u.pathname}${u.search}`;
    }
    catch {
        return url;
    }
}
function normalizeUrl(url, baseUrl) {
    if (!baseUrl)
        return url;
    try {
        const u = new URL(url);
        const b = new URL(baseUrl);
        if (u.origin === b.origin) {
            return `{{ base_url }}${u.pathname}${u.search}`;
        }
    }
    catch {
        // fallback
    }
    return url;
}
function generateHeaders(headers, maskHeaders) {
    const result = [];
    const maskSet = new Set(maskHeaders.map(h => h.toLowerCase()));
    for (const [name, value] of Object.entries(headers)) {
        let finalValue = value;
        if (maskSet.has(name.toLowerCase())) {
            if (name.toLowerCase() === 'authorization' && value.startsWith('Bearer ')) {
                finalValue = 'Bearer {{ auth_token }}';
            }
            else {
                finalValue = '[MASKED]';
            }
        }
        result.push({
            name,
            value: finalValue
        });
    }
    return result;
}
function generateBody(body, headers) {
    if (!body)
        return {};
    const contentType = headers?.['content-type'] || headers?.['Content-Type'] || '';
    if (contentType.includes('application/json')) {
        try {
            const parsed = JSON.parse(body);
            return {
                mimeType: 'application/json',
                text: JSON.stringify(parsed, null, 2)
            };
        }
        catch {
            // fallback to raw
        }
    }
    if (contentType.includes('application/x-www-form-urlencoded')) {
        // TODO: parse form data
    }
    return {
        mimeType: contentType || 'text/plain',
        text: body
    };
}
