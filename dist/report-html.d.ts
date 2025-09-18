export interface ReportData {
    meta: {
        tag?: string;
        when: string;
        environment?: string;
    };
    summary: {
        total: number;
        passed: number;
        failed: number;
        p50: number;
        p95: number;
    };
    cases: Array<{
        name: string;
        status: 'pass' | 'fail';
        time: number;
        assertions: number;
        error?: string;
    }>;
    perfDiff?: Array<{
        endpoint: string;
        status_old: number;
        status_new: number;
        time_old: number;
        time_new: number;
        size_old: number;
        size_new: number;
        delta_pct: number;
        regression: boolean;
    }>;
}
export declare function generateHtmlReport(data: ReportData): string;
