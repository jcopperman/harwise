export interface ComparisonResult {
    endpoint: string;
    status_old: number;
    status_new: number;
    time_old: number;
    time_new: number;
    size_old: number;
    size_new: number;
    delta_pct: number;
    regression: boolean;
}
export declare function compareCommand(baselineHar: string, newHar: string, options: any): void;
