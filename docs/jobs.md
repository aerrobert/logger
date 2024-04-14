# Job Logging

Directly manage jobs

```js
const JobId = flame.startJob('My Job Name')

// Do some work . . .

flame.completeJob(JobId)

```

Or use a wrapper

```js
const a = flame.jobWithRetries('My Job Name', async () => {

    . . . 
    return 1

})

// a = 1

```