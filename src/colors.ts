import { ColorPallet } from "./consts";

export const COLORS : Record<string, string> = {
    'white': '\x1b[37m',
    'grey': '\x1b[90m',
    'black': '\x1b[30m',
    'red': '\x1b[31m',
    'green': '\x1b[32m',
    'yellow': '\x1b[33m',
    'blue': '\x1b[34m',
    'magenta': '\x1b[35m',
    'cyan': '\x1b[36m',
    'orange': '\x1b[38;5;208m',
    'reset': '\x1b[0m'
    
}

export const COLOR_KEYS : Record<string, ColorPallet>= {
    default: {
        INFO: 'grey',
        ERROR: 'red',
        WARNING: 'orange',
        FORMAT: 'grey',
        TIME: 'grey',
        MESSAGE: 'white',
        COMPLETE: 'green',
        RUNNING: 'magenta',
        WAITING: 'grey',
    }
}