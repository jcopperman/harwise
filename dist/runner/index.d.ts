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
export declare class TestRunner {
    private context;
    private results;
    private envFile;
    private extractedVars;
    constructor(envFile?: string);
    runTests(testDir?: string): Promise<TestResult[]>;
    private runTest;
    getContext(): TestContext;
    getResults(): TestResult[];
    getSummary(): {
        total: number;
        passed: number;
        failed: number;
        totalTime: number;
        avgTime: number;
        p50: number;
        p95: number;
    };
    private saveExtractedVars;
    private calculatePercentile;
}
