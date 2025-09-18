import { ApiSample } from './har.js';
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
export declare function generateTests(samples: ApiSample[], outputDir?: string, config?: Partial<TestConfig>): void;
