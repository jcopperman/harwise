import { ApiSample } from './har.js';
export interface FilterOptions {
    include?: string;
    exclude?: string;
}
export declare function filterSamples(samples: ApiSample[], options: FilterOptions): ApiSample[];
export declare function generateKey(sample: ApiSample): string;
