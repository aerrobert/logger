export function timeSince (date: Date) {
    const now = new Date()
    const delta = now.getTime() - date.getTime()

    const hours = Math.floor(delta / 3600000)
    const minutes = Math.floor((delta % 3600000) / 60000)
    const seconds = Math.floor((delta % 60000) / 1000)

    const hoursStr =  hours.toString().padStart(2, '0') 
    const minutesStr = minutes.toString().padStart(2, '0')
    const secondsStr = seconds.toString().padStart(2, '0')

    return `${hoursStr}:${minutesStr}:${secondsStr}`
}
