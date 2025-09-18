import { strict as assert } from 'node:assert';
import { fetch } from 'undici';
import { JSONPath } from 'jsonpath-plus';

const BASE_URL = 'https://api.example.com';

export default async function test_0(ctx) {
  const url = `https://api.example.com/v1/users?limit=10&sort=name`;
  const headers = {};

  // Set headers
  headers['content-type'] = 'application/json';

  // Apply variable substitutions
  let finalUrl = url;
  let requestBody = undefined;

  const startTime = Date.now();

  const response = await fetch(finalUrl, {
    method: 'GET',
    headers
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
  const maxAllowedTime = Math.ceil(150 * (1 + 25 / 100));
  assert.ok(responseTime <= maxAllowedTime,
    `Response time ${responseTime}ms exceeded limit of ${maxAllowedTime}ms (sample: 150ms)`);

  const responseText = await response.text();
  let responseData;

  if (contentType.includes('application/json')) {
    responseData = JSON.parse(responseText);
  }

  // URL-specific assertions
}
