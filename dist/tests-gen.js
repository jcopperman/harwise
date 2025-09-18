import { writeFileSync, mkdirSync } from 'fs';
export function generateTests(samples, outputDir = 'tests', config) {
    // Create output directory
    mkdirSync(outputDir, { recursive: true });
    // Default config
    const defaultConfig = {
        assertions: {
            global: {
                statusRange: [200, 399],
                maxTimePctOverSample: 25
            },
            byUrl: []
        },
        extract: [],
        substitute: [],
        maskHeaders: ['authorization', 'cookie'],
        baseUrl: ''
    };
    const finalConfig = { ...defaultConfig, ...config };
    // Generate manifest
    const manifest = {
        tests: [],
        config: finalConfig
    };
    // Generate individual test files
    samples.forEach((sample, index) => {
        const testFile = generateTestFile(sample, index, finalConfig);
        const fileName = `test_${index}.spec.ts`;
        const filePath = `${outputDir}/${fileName}`;
        writeFileSync(filePath, testFile);
        manifest.tests.push({
            file: fileName,
            name: `${sample.method} ${sample.url}`
        });
    });
    // Write manifest
    writeFileSync(`${outputDir}/.harwise.manifest.json`, JSON.stringify(manifest, null, 2));
}
function generateTestFile(sample, index, config) {
    const baseUrl = config.baseUrl || extractBaseUrl(sample.url);
    const maxTime = Math.ceil(sample.time * (1 + config.assertions.global.maxTimePctOverSample / 100));
    let testCode = `import { strict as assert } from 'node:assert';
import { fetch } from 'undici';
import { JSONPath } from 'jsonpath-plus';

const BASE_URL = '${baseUrl}';

export default async function test_${index}(ctx: any) {
  const url = \`${baseUrl}${normalizePath(sample.url, baseUrl)}\`;
  const headers: Record<string, string> = {};

  // Set headers
`;
    // Add headers
    for (const [key, value] of Object.entries(sample.reqHeaders)) {
        if (!config.maskHeaders.includes(key.toLowerCase())) {
            testCode += `  headers['${key}'] = '${value.replace(/'/g, "\\'")}';\n`;
        }
    }
    testCode += `
  const response = await fetch(url, {
    method: '${sample.method}',
    headers
  });

  // Auto-assertions
  assert.ok(response.status >= ${config.assertions.global.statusRange[0]} && response.status < ${config.assertions.global.statusRange[1]},
    \`Unexpected status \${response.status}\`);

  const contentType = response.headers.get('content-type') || '';
  if ('${sample.mime}') {
    assert.ok(contentType.includes('${sample.mime}'),
      \`Expected content-type to contain ${sample.mime}, got \${contentType}\`);
  }

  // Timing assertion
  // Note: Timing assertions would require wrapping fetch with timing logic

  const responseText = await response.text();
  let responseData;

  if (contentType.includes('application/json')) {
    responseData = JSON.parse(responseText);
  }

  // URL-specific assertions
`;
    // Add URL-specific assertions
    const urlPattern = getUrlPattern(sample.url, baseUrl);
    const urlAssertions = config.assertions.byUrl.find(a => {
        try {
            return new RegExp(a.match).test(urlPattern);
        }
        catch {
            return false;
        }
    });
    if (urlAssertions) {
        testCode += `  // Custom assertions for ${urlPattern}\n`;
        for (const assertion of urlAssertions.jsonpath) {
            if (assertion.exists) {
                testCode += `  const ${assertion.path.replace(/[^a-zA-Z0-9]/g, '_')} = JSONPath({ path: '${assertion.path}', json: responseData });\n`;
                testCode += `  assert.ok(${assertion.path.replace(/[^a-zA-Z0-9]/g, '_')}.length > 0, '${assertion.path} should exist');\n`;
            }
            if (assertion.minLength) {
                testCode += `  assert.ok(${assertion.path.replace(/[^a-zA-Z0-9]/g, '_')}.length >= ${assertion.minLength}, '${assertion.path} should have at least ${assertion.minLength} items');\n`;
            }
        }
    }
    // Add extraction logic
    const extractRules = config.extract.filter(e => {
        try {
            return new RegExp(e.match).test(urlPattern);
        }
        catch {
            return false;
        }
    });
    if (extractRules.length > 0) {
        testCode += `
  // Extract variables
`;
        for (const rule of extractRules) {
            testCode += `  const ${rule.to} = JSONPath({ path: '${rule.from}', json: responseData })[0];
  if (${rule.to}) ctx.set('${rule.to}', ${rule.to});
`;
        }
    }
    testCode += `}
`;
    return testCode;
}
function extractBaseUrl(url) {
    try {
        const u = new URL(url);
        return `${u.protocol}//${u.host}`;
    }
    catch {
        return '';
    }
}
function normalizePath(url, baseUrl) {
    if (!baseUrl)
        return url;
    try {
        const u = new URL(url);
        const b = new URL(baseUrl);
        if (u.origin === b.origin) {
            return u.pathname + u.search;
        }
    }
    catch {
        // fallback
    }
    return url;
}
function getUrlPattern(url, baseUrl) {
    const path = normalizePath(url, baseUrl);
    return path.split('?')[0]; // Remove query params for pattern matching
}
