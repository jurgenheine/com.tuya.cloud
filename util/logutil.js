class LogUtil {
    constructor(logfunction, isDebug = false) {
        this.isDebug = isDebug;
        this.logfunction = logfunction;
        this.lastConnectionError = null;
    }

    debug(...args) {
        if (this.isDebug) {
            this.logfunction(...args);
        }
    }

    log(...args) {
        this.logfunction(...args);
    }

    logConnectionError(...args) {
        if(args.length > 0){
            this.lastConnectionError = args.join(';');
        }
        this.logfunction(...args);
    }
}

module.exports = LogUtil;
