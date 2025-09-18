import { strict as assert } from 'node:assert';
import { fetch } from 'undici';
import { JSONPath } from 'jsonpath-plus';

const BASE_URL = 'https://api.example.com';

export default async function test_1(ctx: any) {
  const url = `https://api.example.com/v1/login`;
  const headers: Record<string, string> = {};

  // Set headers
  headers['content-type'] = 'application/json';

  const response = await fetch(url, {
    method: 'POST',
    headers
  });

  // Auto-assertions
  assert.ok(response.status >= 200 && response.status < 399,
    `Unexpected status ${response.status}`);

  const contentType = response.headers.get('content-type') || '';
  if ('application/json') {
    assert.ok(contentType.includes('application/json'),
      `Expected content-type to contain application/json, got ${contentType}`);
  }

  // Timing assertion
  // Note: Timing assertions would require wrapping fetch with timing logic

  const responseText = await response.text();
  let responseData;

  if (contentType.includes('application/json')) {
    responseData = JSON.parse(responseText);
  }

  // URL-specific assertions

  // Extract variables
  const auth_token = JSONPath({ path: '$.token', json: responseData })[0];
  if (auth_token) ctx.set('auth_token', auth_token);
}
