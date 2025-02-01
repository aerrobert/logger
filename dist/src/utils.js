"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uuid = exports.timeSince = void 0;
function timeSince(date) {
    const now = new Date();
    const delta = now.getTime() - date.getTime();
    const hours = Math.floor(delta / 3600000);
    const minutes = Math.floor((delta % 3600000) / 60000);
    const seconds = Math.floor((delta % 60000) / 1000);
    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');
    return `${hoursStr}:${minutesStr}:${secondsStr}`;
}
exports.timeSince = timeSince;
function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
exports.uuid = uuid;
