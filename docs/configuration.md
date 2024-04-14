# Configure Flame Logs

Basic configuration of the job logger object

```js
const logger = new FlameLogger({

    // clear the console when initializing the logger
    clear: boolean, 

    // Custom colors for each log level, if not provided, default colors will be used
    pallet: {
        INFO: 'grey',
        ERROR: 'red',
        WARNING: 'orange',
        FORMAT: 'grey',
        TIME: 'grey',
        MESSAGE: 'white',
        COMPLETE: 'green',
        RUNNING: 'magenta',
        WAITING: 'grey',
    },

    // For retriable jobs
    defaultRetries: number, // default number of retries for a job before failing
    defaultRetryDelay: number, // delay in ms for first retry, doubles each retry

    // For logging
    disabled: boolean, // disable all logging

})

```