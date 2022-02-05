'use strict';

const Homey = require('homey');

class TuyaBaseDevice extends Homey.Device {
    initDevice(id) {
        this.id = id;
    }

    get_deviceConfig() {
        if (this.homey.app != null) {
            return this.homey.app.get_device_by_devid(this.id);
        }
    }

    getOnline() {
        let device = this.get_deviceConfig();
        return device != null ? device.online === true || device.online === 'true' : false;
    }
}

module.exports = TuyaBaseDevice;