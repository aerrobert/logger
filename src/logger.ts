import { COLORS, PALLET } from './colors';
import { ActiveJob, ColorPallet, JobStatus, LogPart, LogSection } from './consts';
import { timeSince, uuid } from './utils';

export interface LoggerProps {
    disabled?: boolean;
    clear?: boolean;
    uuid?: boolean;
}

export class Logger {
    // Logger tracks start time, and reports everything in relation to that time
    private start: Date = new Date();
    public readonly uuid: string = '';

    // A color pallet is used to color different parts of the log message, settable by the user
    private colors: ColorPallet = PALLET;

    // We track active jobs, and display them in the console, this is the state for that
    private jobDisplayActive = false;
    private jobDisplayLines = 0;
    private jobs: Record<string, ActiveJob> = {};
    private jobIdCounter = 0;
    private jobDisplayUpdateQueued = false;

    // For retry logic
    private retries = 3;
    private baseRetryDelay = 1000;

    // If its disabled, we don't log anything
    private disabled = false;

    public constructor(props: LoggerProps = {}) {
        this.disabled = props.disabled || this.disabled;
        if (props.clear) console.clear();
        if (props.uuid) this.uuid = uuid();
    }

    public debug(message: string) {
        return this._log(
            this.start,
            { part: LogPart.Message, message: 'debug' },
            { part: LogPart.Debug, message }
        );
    }

    // Allow interfacing with logging in scopes, or directly
    public log(message: string) {
        return this._log(
            this.start,
            { part: LogPart.Info, message: 'info' },
            { part: LogPart.Message, message }
        );
    }

    public logComplete(message: string) {
        return this._log(
            this.start,
            { part: LogPart.Complete, message: 'complete' },
            { part: LogPart.Message, message }
        );
    }

    public logError(message: string) {
        return this._log(
            this.start,
            { part: LogPart.Error, message: 'error' },
            { part: LogPart.Message, message }
        );
    }

    public logWarning(message: string) {
        return this._log(
            this.start,
            { part: LogPart.Warning, message: 'warning' },
            { part: LogPart.Message, message }
        );
    }

    // Allow Interfacing with jobs

    public startJob(title: string) {
        const job: ActiveJob = {
            id: `${this.jobIdCounter++}`,
            start: new Date(),
            status: JobStatus.Running,
            title,
        };
        this.jobs[job.id] = job;
        this.showJobDisplay();
        this.log(`Job started: ${job.title}`);
        return job.id;
    }

    public completeJob(jobId: string) {
        const job = this.jobs[jobId];
        this.logComplete(job.title);
        delete this.jobs[jobId];
        this.removeJobDisplay();
        this.showJobDisplay();
    }

    public failJob(jobId: string) {
        const job = this.jobs[jobId];
        this.logError('Job failed: ' + job.title);
        delete this.jobs[jobId];
        this.removeJobDisplay();
        this.showJobDisplay();
    }

    private removeJobDisplay() {
        if (this.disabled) return;
        if (!this.jobDisplayActive) return;

        // For each line in the job display, clear the line and move the cursor down
        for (let i = 0; i < this.jobDisplayLines + 1; i++) {
            process.stdout.write('\x1b[1B');
            process.stdout.write('\x1b[2K');
        }

        // Move the cursor back to the start of the job display
        for (let i = 0; i < this.jobDisplayLines + 1; i++) {
            process.stdout.write('\x1b[1A');
        }

        this.jobDisplayActive = false;
    }

    private showJobDisplay() {
        if (this.disabled) return;
        if (this.jobDisplayActive) return;
        if (Object.keys(this.jobs).length === 0) return;

        // Schedule the next update
        if (!this.jobDisplayUpdateQueued) {
            this.jobDisplayUpdateQueued = true;
            setTimeout(() => {
                this.jobDisplayUpdateQueued = false;
                this.removeJobDisplay();
                this.showJobDisplay();
            }, 300);
        }

        // Get the current cursor row
        console.log(COLORS[this.colors['FORMAT']] + '\n\nActive Jobs:\n');
        const totalJobs = Object.keys(this.jobs).length;

        // Display the active jobs
        let i = 0;
        Object.values(this.jobs).forEach(job => {
            if (i >= 10) return;
            if (job.status === JobStatus.Running) {
                this._log(
                    job.start,
                    { part: LogPart.Running, message: 'running' },
                    { part: LogPart.Message, message: job.title }
                );
            } else {
                this._log(
                    job.start,
                    { part: LogPart.Waiting, message: 'waiting (' + job.delayTime + 'ms)' },
                    { part: LogPart.Message, message: job.title }
                );
            }
            i++;
        });

        // Display a message if there are more jobs
        if (totalJobs > 10) {
            console.log(COLORS[this.colors['FORMAT']] + `\n ... and ${totalJobs - 10} more`);
        }

        // Set the number of lines to clear
        this.jobDisplayLines = totalJobs > 10 ? 16 : totalJobs + 4;
        this.jobDisplayActive = true;

        // Move the cursor back to the start of the job display
        for (let i = 0; i < this.jobDisplayLines; i++) {
            process.stdout.write('\x1b[1A');
        }
    }

    public jobWithRetries<T>(title: string, callback: () => Promise<T>): Promise<T> {
        const jobId = this.startJob(title);
        return new Promise<T>((resolve, reject) => {
            const attempt = async (attemptNumber: number) => {
                try {
                    const result = await callback();
                    this.completeJob(jobId);
                    resolve(result);
                } catch (error) {
                    if (attemptNumber >= this.retries) {
                        this.failJob(jobId);
                        throw error;
                    } else {
                        const job = this.jobs[jobId];
                        const errorString =
                            error instanceof Error
                                ? error.message
                                : ((error as any).toString() as string);
                        this.logWarning(
                            `Job ${job.title} failed attempt ${attemptNumber}: ${errorString}. Retrying after delay ...`
                        );
                        job.status = JobStatus.Waiting;
                        job.delayTime = 2 ** (attemptNumber - 1) * this.baseRetryDelay;
                        await new Promise(resolve =>
                            setTimeout(resolve, this.jobs[jobId].delayTime)
                        );
                        this.jobs[jobId].status = JobStatus.Running;
                        attempt(attemptNumber + 1);
                    }
                }
            };
            attempt(1);
        });
    }

    // For logging by colored message parts

    // Function to remove color codes
    private removeColorCodes(str: string): string {
        return str.replace(/\x1b\[[0-9;]*m/g, '');
    }

    private _log(time: Date, ...parts: LogSection[]) {
        if (this.disabled) return;
        const timeSection = {
            part: LogPart.Time,
            message: timeSince(time),
        };
        const uuidSection = this.uuid.length ? { part: LogPart.Debug, message: this.uuid } : undefined;
        const allSections = [timeSection, uuidSection, ...parts];
        let fullMessage = allSections
            .filter(section => section)
            .map(section => {
                const color = this.colors[section!.part] || 'white';
                return `${COLORS[color]}${section!.message}`;
            })
            .join(' ');

        // Check for lambda environment variable and remove color codes if present
        if (process.env.LAMBDA_TASK_ROOT) {
            fullMessage = this.removeColorCodes(fullMessage);
            console.log(fullMessage);
        } else {
            process.stdout.write(fullMessage + '\n\n\n\n');
            process.stdout.write('\x1b[1A');
            process.stdout.write('\x1b[1A');
            process.stdout.write('\x1b[1A');
        }
    }
}
