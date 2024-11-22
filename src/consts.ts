export enum LogPart {
    Info = 'INFO',
    Error = 'ERROR',
    Warning = 'WARNING',
    Format = 'FORMAT',
    Time = 'TIME',
    Message = 'MESSAGE',
    Complete = 'COMPLETE',
    Running = 'RUNNING',
    Waiting = 'WAITING',
    Debug = 'DEBUG',
}

export type ColorPallet = Record<LogPart, string>;

export interface LogSection {
    part: LogPart;
    message: string;
}

export enum JobStatus {
    Running = 'running',
    Waiting = 'waiting',
}

export interface ActiveJob {
    id: string;
    start: Date;
    status: JobStatus;
    delayTime?: number;
    title: string;
}
