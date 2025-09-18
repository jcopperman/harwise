import { ApiSample } from './har.js';
export interface InsomniaOptions {
    baseUrl?: string;
    envFile?: string;
    maskHeaders?: string[];
}
export declare function generateInsomniaCollection(samples: ApiSample[], options?: InsomniaOptions): string;
