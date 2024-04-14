import { COLORS, COLOR_KEYS } from "./colors"
import { ActiveJob, ColorPallet, JobStatus, LogPart, LogSection } from "./consts"
import { timeSince } from "./utils"

export interface FlameLoggerProps {
    disabled?: boolean,
    clear?: boolean,
    pallet?: ColorPallet,
    defaultRetries?: number,
    baseRetryDelay?: number,
}

export class FlameLogger {

    // Logger tracks start time, and reports everything in relation to that time
    private start: Date = new Date()

    // A color pallet is used to color different parts of the log message, settable by the user
    private colors: ColorPallet

    // We track active jobs, and display them in the console, this is the state for that
    private jobDisplayActive: boolean = false
    private jobDisplayLines: number = 0
    private jobs: Record<string, ActiveJob> = {}
    private jobIdCounter: number = 0
    private jobDisplayUpdateQueued: boolean = false

    // For retry logic
    private retries: number = 3
    private baseRetryDelay: number = 1000

    // If its disabled, we don't log anything
    private disabled: boolean = false

    public constructor(props: FlameLoggerProps = {}) {
        this.colors = {
            ...COLOR_KEYS['default'],
            ... (props.pallet || {})
        }
        this.retries = props.defaultRetries || this.retries
        this.baseRetryDelay = props.baseRetryDelay || this.baseRetryDelay
        this.disabled = props.disabled || this.disabled
        if (props.clear) console.clear()
    }

    // Allow interfacing with logging in scopes, or directly
    public log(message: string) {
        return this._log(this.start, { part: LogPart.Info, message: 'info' }, { part: LogPart.Message, message })
    }

    public logComplete(message: string) {
        return this._log(this.start, { part: LogPart.Complete, message: 'complete' }, { part: LogPart.Message, message })
    }

    public logError(message: string) {
        return this._log(this.start, { part: LogPart.Error, message: 'error' }, { part: LogPart.Message, message })
    }

    public logWarning(message: string) {
        return this._log(this.start, { part: LogPart.Warning, message: 'warning' }, { part: LogPart.Message, message })
    }

    // Allow Interfacing with jobs

    public startJob(title: string) {
        const job: ActiveJob = {
            id: `${this.jobIdCounter++}`,
            start: new Date(),
            status: JobStatus.Running,
            title,
        }
        this.jobs[job.id] = job
        this.showJobDisplay();
        this.log(`Job started: ${job.title}`)
        return job.id
    }

    public completeJob(jobId: string) {
        const job = this.jobs[jobId]
        this.logComplete(job.title)
        delete this.jobs[jobId]
        this.removeJobDisplay();
        this.showJobDisplay();
    }

    public failJob(jobId: string) {
        const job = this.jobs[jobId]
        this.logError('Job failed: ' + job.title)
        delete this.jobs[jobId]
        this.removeJobDisplay();
        this.showJobDisplay();
    }
    
    private async removeJobDisplay () {
        if (this.disabled) return
        if (!this.jobDisplayActive) return;

        // For each line in the job display, clear the line and move the cursor down
        for (let i = 0; i < this.jobDisplayLines + 1; i++) {
            process.stdout.write('\x1b[2K')
            process.stdout.write('\x1b[1B')
        }

        // Move the cursor back to the start of the job display
        for (let i = 0; i < this.jobDisplayLines + 1; i++) {
            process.stdout.write('\x1b[1A')
        }

        this.jobDisplayActive = false
    }

    private async showJobDisplay () {
        if (this.disabled) return
        if (this.jobDisplayActive) return;
        if (Object.keys(this.jobs).length === 0) return;

        // Schedule the next update
        if (!this.jobDisplayUpdateQueued) {
            this.jobDisplayUpdateQueued = true;
            setTimeout(() => {
                this.jobDisplayUpdateQueued = false;
                this.removeJobDisplay()
                this.showJobDisplay()
            }, 300)
        }
        
        // Get the current cursor row
        console.log(COLORS[this.colors['FORMAT']] + '\n\nActive Jobs:\n')
        const totalJobs = Object.keys(this.jobs).length

        // Display the active jobs
        let i = 0;
        Object.values(this.jobs).forEach(job => {
            if (i >= 10) return
            if (job.status === JobStatus.Running) {
                this._log(job.start, { part: LogPart.Running, message: 'running' }, { part: LogPart.Message, message: job.title })
            } else { 
                this._log(job.start, { part: LogPart.Waiting, message: 'waiting (' + job.delayTime + 'ms)' }, { part: LogPart.Message, message: job.title })
            }
            i++
        })
        
        // Display a message if there are more jobs
        if (totalJobs > 10) {
            console.log(COLORS[this.colors['FORMAT']] + `\n ... and ${totalJobs - 10} more`)
        }

        // Set the number of lines to clear
        this.jobDisplayLines = totalJobs > 10 ? 16 : totalJobs + 4
        this.jobDisplayActive = true

        // Move the cursor back to the start of the job display
        for (let i = 0; i < this.jobDisplayLines; i++) {
            process.stdout.write('\x1b[1A')
        }

    }

    public jobWithRetries<T>(title: string, callback: () => Promise<T>) : Promise<T> {
        const jobId = this.startJob(title)
        return new Promise<T>((resolve, reject) => {
            const attempt = async (attemptNumber: number) => {
                try {
                    const result = await callback()
                    this.completeJob(jobId)
                    resolve(result)
                } catch (error) {
                    if (attemptNumber > this.retries) {
                        this.failJob(jobId)
                        reject(error)
                    } else {
                        const job = this.jobs[jobId];
                        this.logWarning(`Job ${job.title} failed attempt ${attemptNumber}: ${error}. Retrying after delay ...`)
                        job.status = JobStatus.Waiting
                        job.delayTime = (2 ** (attemptNumber -1)) * this.baseRetryDelay
                        await new Promise(resolve => setTimeout(resolve, this.jobs[jobId].delayTime))
                        this.jobs[jobId].status = JobStatus.Running
                        attempt(attemptNumber + 1)
                    }
                }
            }
            attempt(1)
        })
    }

    // For logging by colored message parts

    private _log(time: Date, ...parts: LogSection[]) {
        if (this.disabled) return
        const timeSection = {
            part: LogPart.Time,
            message: timeSince(time)
        }
        const allSections = [timeSection, ...parts]
        const fullMessage = allSections.map(section => {
            const color = this.colors[section.part] || 'white'
            return `${COLORS[color]}${section.message}`
        }).join(' ')
        console.log(fullMessage)
    }

}