"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PALLET = exports.COLORS = void 0;
exports.COLORS = {
    white: '\x1b[37m',
    grey: '\x1b[90m',
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    orange: '\x1b[38;5;208m',
    reset: '\x1b[0m',
};
exports.PALLET = {
    INFO: 'grey',
    ERROR: 'red',
    WARNING: 'orange',
    FORMAT: 'grey',
    TIME: 'grey',
    MESSAGE: 'white',
    COMPLETE: 'green',
    RUNNING: 'magenta',
    WAITING: 'grey',
    DEBUG: 'grey',
};
