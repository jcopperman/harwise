import { strict as assert } from 'node:assert';
import { fetch } from 'undici';
import { JSONPath } from 'jsonpath-plus';

const BASE_URL = 'https://api.example.com';

export default async function test_0(ctx: any) {
  const url = `https://api.example.com/v1/users?limit=10&sort=name`;
  const headers: Record<string, string> = {};

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
  // Custom assertions for /v1/users
  const __data____id = JSONPath({ path: '$.data[*].id', json: responseData });
  assert.ok(__data____id.length > 0, '$.data[*].id should exist');
  assert.ok(__data.length >= 1, '$.data should have at least 1 items');

  // Extract variables
  if (responseData) {
    const first_user_idValue = JSONPath({ path: '$.data[0].id', json: responseData })[0];
    if (first_user_idValue !== undefined) {
      ctx.set('first_user_id', first_user_idValue);
      console.log('Extracted first_user_id:', first_user_idValue);
    }
  }
}
