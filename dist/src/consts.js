"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobStatus = exports.LogPart = void 0;
var LogPart;
(function (LogPart) {
    LogPart["Info"] = "INFO";
    LogPart["Error"] = "ERROR";
    LogPart["Warning"] = "WARNING";
    LogPart["Format"] = "FORMAT";
    LogPart["Time"] = "TIME";
    LogPart["Message"] = "MESSAGE";
    LogPart["Complete"] = "COMPLETE";
    LogPart["Running"] = "RUNNING";
    LogPart["Waiting"] = "WAITING";
    LogPart["Debug"] = "DEBUG";
})(LogPart = exports.LogPart || (exports.LogPart = {}));
var JobStatus;
(function (JobStatus) {
    JobStatus["Running"] = "running";
    JobStatus["Waiting"] = "waiting";
})(JobStatus = exports.JobStatus || (exports.JobStatus = {}));
