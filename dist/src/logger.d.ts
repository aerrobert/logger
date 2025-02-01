export interface LoggerProps {
    disabled?: boolean;
    clear?: boolean;
    uuid?: boolean;
}
export declare class Logger {
    private start;
    readonly uuid: string;
    private colors;
    private jobDisplayActive;
    private jobDisplayLines;
    private jobs;
    private jobIdCounter;
    private jobDisplayUpdateQueued;
    private retries;
    private baseRetryDelay;
    private disabled;
    constructor(props?: LoggerProps);
    debug(message: string): void;
    log(message: string): void;
    logComplete(message: string): void;
    logError(message: string): void;
    logWarning(message: string): void;
    startJob(title: string): string;
    completeJob(jobId: string): void;
    failJob(jobId: string): void;
    private removeJobDisplay;
    private showJobDisplay;
    jobWithRetries<T>(title: string, callback: () => Promise<T>): Promise<T>;
    private removeColorCodes;
    private _log;
}
