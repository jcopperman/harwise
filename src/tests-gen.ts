import { ApiSample } from './har.js';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export interface TestConfig {
  assertions: {
    global: {
      statusRange: [number, number];
      maxTimePctOverSample: number;
    };
    byUrl: Array<{
      match: string;
      jsonpath: Array<{
        path: string;
        exists?: boolean;
        minLength?: number;
      }>;
    }>;
  };
  extract: Array<{
    match: string;
    from: string;
    to: string;
  }>;
  substitute: Array<{
    match: string;
    pattern: string;
    var: string;
  }>;
  maskHeaders: string[];
  baseUrl: string;
}

export interface TestManifest {
  tests: Array<{
    file: string;
    name: string;
    dependsOn?: string[];
  }>;
  config: TestConfig;
}

export function generateTests(samples: ApiSample[], outputDir: string = 'tests', config?: Partial<TestConfig>): void {
  // Create output directory
  mkdirSync(outputDir, { recursive: true });

  // Default config
  const defaultConfig: TestConfig = {
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
  const manifest: TestManifest = {
    tests: [],
    config: finalConfig
  };

  // Generate individual test files
  samples.forEach((sample, index) => {
    const testFile = generateTestFile(sample, index, finalConfig);
    const fileName = `test_${index}.spec.js`;
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

function generateTestFile(sample: ApiSample, index: number, config: TestConfig): string {
  const baseUrl = config.baseUrl || extractBaseUrl(sample.url);
  const maxTime = Math.ceil(sample.time * (1 + config.assertions.global.maxTimePctOverSample / 100));

  let testCode = `import { strict as assert } from 'node:assert';
import { fetch } from 'undici';
import { JSONPath } from 'jsonpath-plus';

const BASE_URL = '${baseUrl}';

export default async function test_${index}(ctx) {
  const url = \`${baseUrl}${normalizePath(sample.url, baseUrl)}\`;
  const headers = {};

  // Set headers
`;

  // Add headers
  for (const [key, value] of Object.entries(sample.reqHeaders)) {
    if (!config.maskHeaders.includes(key.toLowerCase())) {
      testCode += `  headers['${key}'] = '${value.replace(/'/g, "\\'")}';\n`;
    }
  }

  testCode += `
  // Apply variable substitutions
  let finalUrl = url;
  let requestBody = ${sample.reqBody ? `'${sample.reqBody.replace(/'/g, "\\'")}'` : 'undefined'};
`;

  // Add substitution logic
  const substituteRules = config.substitute.filter(s => {
    try {
      return new RegExp(s.match).test(urlPattern);
    } catch {
      return false;
    }
  });

  if (substituteRules.length > 0) {
    for (const rule of substituteRules) {
      testCode += `  const ${rule.var}Value = ctx.get('${rule.var}');
  if (${rule.var}Value) {
    finalUrl = finalUrl.replace(new RegExp('${rule.pattern}'), ${rule.var}Value);
    if (requestBody) {
      requestBody = requestBody.replace(new RegExp('${rule.pattern}'), ${rule.var}Value);
    }
  }
`;
    }
  }

  testCode += `
  const startTime = Date.now();

  const response = await fetch(finalUrl, {
    method: '${sample.method}',
    headers${sample.reqBody ? `,
    body: requestBody` : ''}
  });

  const endTime = Date.now();
  const responseTime = endTime - startTime;

  // Auto-assertions
  assert.ok(response.status >= ${config.assertions.global.statusRange[0]} && response.status < ${config.assertions.global.statusRange[1]},
    \`Unexpected status \${response.status}\`);

  const contentType = response.headers.get('content-type') || '';
  if ('${sample.mime}') {
    assert.ok(contentType.includes('${sample.mime}'),
      \`Expected content-type to contain ${sample.mime}, got \${contentType}\`);
  }

  // Timing assertion
  const maxAllowedTime = Math.ceil(${sample.time} * (1 + ${config.assertions.global.maxTimePctOverSample} / 100));
  assert.ok(responseTime <= maxAllowedTime,
    \`Response time \${responseTime}ms exceeded limit of \${maxAllowedTime}ms (sample: ${sample.time}ms)\`);

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
    } catch {
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
    } catch {
      return false;
    }
  });

  if (extractRules.length > 0) {
    testCode += `
  // Extract variables
  if (responseData) {
`;
    for (const rule of extractRules) {
      testCode += `    const ${rule.to}Value = JSONPath({ path: '${rule.from}', json: responseData })[0];
    if (${rule.to}Value !== undefined) {
      ctx.set('${rule.to}', ${rule.to}Value);
      console.log('Extracted ${rule.to}:', ${rule.to}Value);
    }
`;
    }
    testCode += `  }
`;
  }

  testCode += `}
`;

  return testCode;
}

function extractBaseUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return '';
  }
}

function normalizePath(url: string, baseUrl: string): string {
  if (!baseUrl) return url;
  try {
    const u = new URL(url);
    const b = new URL(baseUrl);
    if (u.origin === b.origin) {
      return u.pathname + u.search;
    }
  } catch {
    // fallback
  }
  return url;
}

function getUrlPattern(url: string, baseUrl: string): string {
  const path = normalizePath(url, baseUrl);
  return path.split('?')[0]; // Remove query params for pattern matching
}