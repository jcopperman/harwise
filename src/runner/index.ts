import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { TestManifest } from '../tests-gen.js';

export interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  time: number;
  error?: string;
  assertions: number;
}

export interface TestContext {
  variables: Map<string, any>;
  set(key: string, value: any): void;
  get(key: string): any;
}

export class TestRunner {
  private context: TestContext;
  private results: TestResult[] = [];

  constructor() {
    this.context = {
      variables: new Map(),
      set: (key: string, value: any) => this.context.variables.set(key, value),
      get: (key: string) => this.context.variables.get(key)
    };
  }

  async runTests(testDir: string = 'tests'): Promise<TestResult[]> {
    // Load manifest
    const manifestPath = join(testDir, '.harwise.manifest.json');
    const manifestContent = readFileSync(manifestPath, 'utf-8');
    const manifest: TestManifest = JSON.parse(manifestContent);

    // Run tests in order
    for (const test of manifest.tests) {
      const result = await this.runTest(join(testDir, test.file), test.name);
      this.results.push(result);
    }

    return this.results;
  }

  private async runTest(filePath: string, testName: string): Promise<TestResult> {
    const startTime = Date.now();

    try {
      // Dynamic import of the test file
      const testModule = await import(filePath);

      // Run the default export function
      if (typeof testModule.default === 'function') {
        await testModule.default(this.context);
      }

      const endTime = Date.now();
      return {
        name: testName,
        status: 'pass',
        time: endTime - startTime,
        assertions: 1 // TODO: Count actual assertions
      };
    } catch (error) {
      const endTime = Date.now();
      return {
        name: testName,
        status: 'fail',
        time: endTime - startTime,
        error: error instanceof Error ? error.message : String(error),
        assertions: 0
      };
    }
  }

  getContext(): TestContext {
    return this.context;
  }

  getResults(): TestResult[] {
    return this.results;
  }

  getSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = total - passed;
    const totalTime = this.results.reduce((sum, r) => sum + r.time, 0);
    const avgTime = total > 0 ? totalTime / total : 0;

    return {
      total,
      passed,
      failed,
      totalTime,
      avgTime: Math.round(avgTime),
      p50: this.calculatePercentile(50),
      p95: this.calculatePercentile(95)
    };
  }

  private calculatePercentile(percentile: number): number {
    if (this.results.length === 0) return 0;

    const sortedTimes = this.results.map(r => r.time).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sortedTimes.length) - 1;
    return sortedTimes[Math.max(0, index)];
  }
}