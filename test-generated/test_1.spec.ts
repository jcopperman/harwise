import { strict as assert } from 'node:assert';
import { fetch } from 'undici';
import { JSONPath } from 'jsonpath-plus';

const BASE_URL = 'https://api.example.com';

export default async function test_1(ctx: any) {
  const url = `https://api.example.com/v1/login`;
  const headers: Record<string, string> = {};

  // Set headers
  headers['content-type'] = 'application/json';

  // Apply variable substitutions
  let finalUrl = url;
  let requestBody = '{"username": "user", "password": "pass"}';

  const startTime = Date.now();

  const response = await fetch(finalUrl, {
    method: 'POST',
    headers,
    body: requestBody
  });

  const endTime = Date.now();
  const responseTime = endTime - startTime;

  // Auto-assertions
  assert.ok(response.status >= 200 && response.status < 399,
    `Unexpected status ${response.status}`);

  const contentType = response.headers.get('content-type') || '';
  if ('application/json') {
    assert.ok(contentType.includes('application/json'),
      `Expected content-type to contain application/json, got ${contentType}`);
  }

  // Timing assertion
  const maxAllowedTime = Math.ceil(200 * (1 + 25 / 100));
  assert.ok(responseTime <= maxAllowedTime,
    `Response time ${responseTime}ms exceeded limit of ${maxAllowedTime}ms (sample: 200ms)`);

  const responseText = await response.text();
  let responseData;

  if (contentType.includes('application/json')) {
    responseData = JSON.parse(responseText);
  }

  // URL-specific assertions

  // Extract variables
  if (responseData) {
    const auth_tokenValue = JSONPath({ path: '$.token', json: responseData })[0];
    if (auth_tokenValue !== undefined) {
      ctx.set('auth_token', auth_tokenValue);
      console.log('Extracted auth_token:', auth_tokenValue);
    }
  }
}
