export interface ApiSample {
    method: string;
    url: string;
    status: number;
    time: number;
    size: number;
    mime: string;
    reqHeaders: Record<string, string>;
    resHeaders: Record<string, string>;
    reqBody?: string;
    resBody?: string;
    key: string;
}
export declare function parseHar(har: any, options?: {
    include?: string;
    exclude?: string;
}): ApiSample[];
