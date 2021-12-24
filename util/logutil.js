class LogUtil {
    constructor(logfunction, isDebug = false) {
        this.isDebug = isDebug;
        this.logfunction = logfunction;
    }

    debug(...args) {
        if (this.isDebug) {
            logfunction(...args);
        }
    }

    log(...args) {
        logfunction(...args);
    }
}

module.exports = LogUtil;
