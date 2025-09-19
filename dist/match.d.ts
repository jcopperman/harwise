import { ApiSample } from './har.js';
export interface FilterOptions {
    include?: string;
    exclude?: string;
    template?: boolean;
}
export declare function filterSamples(samples: ApiSample[], options: FilterOptions): ApiSample[];
export declare function generateKey(sample: ApiSample): string;
