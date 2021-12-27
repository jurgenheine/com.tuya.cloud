'use strict';

const Homey = require('homey');

class BaseDevice extends Homey.Device {
    initDevice(id) {
        this.id = id;
                
        // Setup caching
        this.cachedState = new Map();
        this.validCache = false;
    }

    get_deviceConfig() {
        return Homey.app.get_device_by_devid(id);
    }

    getOnline() {
        let device = this.get_deviceConfig();
        return device != null ? device.online === true || device.online === 'true' : false;
    }

    setCachedState(characteristic, value) {
        this.cachedState.set(characteristic, value);
        this.validCache = true;
    }

    getCachedState(characteristic) {
        return this.cachedState.get(characteristic);
    }

    hasValidCache() {
        return this.validCache && this.cachedState.size > 0;
    }

    invalidateCache() {
        this.validCache = false;
    }
}

module.exports = BaseDevice;