class LogUtil {
    constructor(logfunction, errorfunction, isDebug = false) {
        this.isDebug = isDebug;
        this.logfunction = logfunction;
        this.errorfunction = errorfunction;
        this.lastConnectionError = null;
    }

    debug(...args) {
        if (this.isDebug) {
            this.logfunction(...args);
        }
    }

    error(...args) {
        this.errorfunction(...args);
    }

    log(...args) {
        this.logfunction(...args);
    }
}

module.exports = LogUtil;
