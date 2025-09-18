import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import { TestManifest } from '../tests-gen.js';

export interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  time: number;
  assertions: number;
  error?: string;
  timingBreakdown?: {
    startTime: number;
    endTime: number;
    duration: number;
  };
}

export interface TestContext {
  variables: Map<string, any>;
  set(key: string, value: any): void;
  get(key: string): any;
}

export class TestRunner {
  private context: TestContext;
  private results: TestResult[] = [];
  private envFile: string;
  private extractedVars: Map<string, any> = new Map();

  constructor(envFile?: string) {
    this.envFile = envFile || '.env';

    // Load environment variables
    if (existsSync(this.envFile)) {
      config({ path: this.envFile });
    }

    this.context = {
      variables: new Map(),
      set: (key: string, value: any) => {
        this.context.variables.set(key, value);
        this.extractedVars.set(key, value);
      },
      get: (key: string) => {
        // First check extracted variables, then environment
        return this.context.variables.get(key) || process.env[key];
      }
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

    // Save extracted variables
    this.saveExtractedVars(testDir);

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
        assertions: 3, // status, content-type, timing (can be improved to count dynamically)
        timingBreakdown: {
          startTime,
          endTime,
          duration: endTime - startTime
        }
      };
    } catch (error) {
      const endTime = Date.now();
      return {
        name: testName,
        status: 'fail',
        time: endTime - startTime,
        error: error instanceof Error ? error.message : String(error),
        assertions: 0,
        timingBreakdown: {
          startTime,
          endTime,
          duration: endTime - startTime
        }
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

  private saveExtractedVars(testDir: string): void {
    if (this.extractedVars.size === 0) return;

    const envPath = join(testDir, '.harwise.env.json');
    const envData: Record<string, any> = {};

    // Load existing env file if it exists
    if (existsSync(envPath)) {
      try {
        const existing = JSON.parse(readFileSync(envPath, 'utf-8'));
        Object.assign(envData, existing);
      } catch {
        // Ignore parse errors
      }
    }

    // Add extracted variables
    for (const [key, value] of this.extractedVars) {
      envData[key] = value;
    }

    writeFileSync(envPath, JSON.stringify(envData, null, 2));
    console.log(`Extracted variables saved to ${envPath}`);
  }

  private calculatePercentile(percentile: number): number {
    if (this.results.length === 0) return 0;

    const sortedTimes = this.results.map(r => r.time).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sortedTimes.length) - 1;
    return sortedTimes[Math.max(0, index)];
  }
}