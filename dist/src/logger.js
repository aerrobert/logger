"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const colors_1 = require("./colors");
const consts_1 = require("./consts");
const utils_1 = require("./utils");
class Logger {
    constructor(props = {}) {
        // Logger tracks start time, and reports everything in relation to that time
        this.start = new Date();
        this.uuid = '';
        // A color pallet is used to color different parts of the log message, settable by the user
        this.colors = colors_1.PALLET;
        // We track active jobs, and display them in the console, this is the state for that
        this.jobDisplayActive = false;
        this.jobDisplayLines = 0;
        this.jobs = {};
        this.jobIdCounter = 0;
        this.jobDisplayUpdateQueued = false;
        // For retry logic
        this.retries = 3;
        this.baseRetryDelay = 1000;
        // If its disabled, we don't log anything
        this.disabled = false;
        this.disabled = props.disabled || this.disabled;
        if (props.clear)
            console.clear();
        if (props.uuid)
            this.uuid = (0, utils_1.uuid)();
    }
    debug(message) {
        return this._log(this.start, { part: consts_1.LogPart.Message, message: 'debug' }, { part: consts_1.LogPart.Debug, message });
    }
    // Allow interfacing with logging in scopes, or directly
    log(message) {
        return this._log(this.start, { part: consts_1.LogPart.Info, message: 'info' }, { part: consts_1.LogPart.Message, message });
    }
    logComplete(message) {
        return this._log(this.start, { part: consts_1.LogPart.Complete, message: 'complete' }, { part: consts_1.LogPart.Message, message });
    }
    logError(message) {
        return this._log(this.start, { part: consts_1.LogPart.Error, message: 'error' }, { part: consts_1.LogPart.Message, message });
    }
    logWarning(message) {
        return this._log(this.start, { part: consts_1.LogPart.Warning, message: 'warning' }, { part: consts_1.LogPart.Message, message });
    }
    // Allow Interfacing with jobs
    startJob(title) {
        const job = {
            id: `${this.jobIdCounter++}`,
            start: new Date(),
            status: consts_1.JobStatus.Running,
            title,
        };
        this.jobs[job.id] = job;
        this.showJobDisplay();
        this.log(`Job started: ${job.title}`);
        return job.id;
    }
    completeJob(jobId) {
        const job = this.jobs[jobId];
        this.logComplete(job.title);
        delete this.jobs[jobId];
        this.removeJobDisplay();
        this.showJobDisplay();
    }
    failJob(jobId) {
        const job = this.jobs[jobId];
        this.logError('Job failed: ' + job.title);
        delete this.jobs[jobId];
        this.removeJobDisplay();
        this.showJobDisplay();
    }
    removeJobDisplay() {
        if (this.disabled)
            return;
        if (!this.jobDisplayActive)
            return;
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
    showJobDisplay() {
        if (this.disabled)
            return;
        if (this.jobDisplayActive)
            return;
        if (Object.keys(this.jobs).length === 0)
            return;
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
        console.log(colors_1.COLORS[this.colors['FORMAT']] + '\n\nActive Jobs:\n');
        const totalJobs = Object.keys(this.jobs).length;
        // Display the active jobs
        let i = 0;
        Object.values(this.jobs).forEach(job => {
            if (i >= 10)
                return;
            if (job.status === consts_1.JobStatus.Running) {
                this._log(job.start, { part: consts_1.LogPart.Running, message: 'running' }, { part: consts_1.LogPart.Message, message: job.title });
            }
            else {
                this._log(job.start, { part: consts_1.LogPart.Waiting, message: 'waiting (' + job.delayTime + 'ms)' }, { part: consts_1.LogPart.Message, message: job.title });
            }
            i++;
        });
        // Display a message if there are more jobs
        if (totalJobs > 10) {
            console.log(colors_1.COLORS[this.colors['FORMAT']] + `\n ... and ${totalJobs - 10} more`);
        }
        // Set the number of lines to clear
        this.jobDisplayLines = totalJobs > 10 ? 16 : totalJobs + 4;
        this.jobDisplayActive = true;
        // Move the cursor back to the start of the job display
        for (let i = 0; i < this.jobDisplayLines; i++) {
            process.stdout.write('\x1b[1A');
        }
    }
    jobWithRetries(title, callback) {
        const jobId = this.startJob(title);
        return new Promise((resolve, reject) => {
            const attempt = (attemptNumber) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const result = yield callback();
                    this.completeJob(jobId);
                    resolve(result);
                }
                catch (error) {
                    if (attemptNumber >= this.retries) {
                        this.failJob(jobId);
                        throw error;
                    }
                    else {
                        const job = this.jobs[jobId];
                        const errorString = error instanceof Error
                            ? error.message
                            : error.toString();
                        this.logWarning(`Job ${job.title} failed attempt ${attemptNumber}: ${errorString}. Retrying after delay ...`);
                        job.status = consts_1.JobStatus.Waiting;
                        job.delayTime = Math.pow(2, (attemptNumber - 1)) * this.baseRetryDelay;
                        yield new Promise(resolve => setTimeout(resolve, this.jobs[jobId].delayTime));
                        this.jobs[jobId].status = consts_1.JobStatus.Running;
                        attempt(attemptNumber + 1);
                    }
                }
            });
            attempt(1);
        });
    }
    // For logging by colored message parts
    // Function to remove color codes
    removeColorCodes(str) {
        return str.replace(/\x1b\[[0-9;]*m/g, '');
    }
    _log(time, ...parts) {
        if (this.disabled)
            return;
        const timeSection = {
            part: consts_1.LogPart.Time,
            message: (0, utils_1.timeSince)(time),
        };
        const uuidSection = this.uuid.length ? { part: consts_1.LogPart.Debug, message: this.uuid } : undefined;
        const allSections = [timeSection, uuidSection, ...parts];
        let fullMessage = allSections
            .filter(section => section)
            .map(section => {
            const color = this.colors[section.part] || 'white';
            return `${colors_1.COLORS[color]}${section.message}`;
        })
            .join(' ');
        // Check for lambda environment variable and remove color codes if present
        if (process.env.LAMBDA_TASK_ROOT) {
            fullMessage = this.removeColorCodes(fullMessage);
            console.log(fullMessage);
        }
        else {
            process.stdout.write(fullMessage + '\n\n\n\n');
            process.stdout.write('\x1b[1A');
            process.stdout.write('\x1b[1A');
            process.stdout.write('\x1b[1A');
        }
    }
}
exports.Logger = Logger;
