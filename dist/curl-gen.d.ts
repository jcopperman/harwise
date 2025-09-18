import { ApiSample } from './har.js';
export interface CurlOptions {
    strict?: boolean;
    maskHeaders?: string[];
    baseUrl?: string;
}
export declare function generateCurlSuite(samples: ApiSample[], outputFile: string, options?: CurlOptions): void;
