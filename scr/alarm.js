const alarm = (timing, limit, func) => {
    let start = Date.now();
    let lastEmitNumber = 0;
    let timePassed = 0;
    const newAlarm = {
        emit: async () => {
            timePassed = (Date.now() - start);
            if (lastEmitNumber < Math.floor(timePassed / timing)) {
                await func(timePassed);
                lastEmitNumber++;
            }
            if (timePassed >= limit) {
                start = Date.now();
                lastEmitNumber = 0;
            }
        }
    }

    return newAlarm;
}

export default alarm;