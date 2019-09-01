'use strict';

const Homey = require('homey');

class BaseDevice extends Homey.Device {
    initDevice(id, name) {
        this.data = {};
        this.id = id;
        this.state =  false;
        this.alive = false;
    }

    async update() {
        const { payload: { device } } = await Homey.app.operateDevice(this.id, 'QueryDevice', null, 'query');
        this.updateData( device);
    }

    updateData(device) {
        if (device != null) {
            this.data = device.data;
            this.state = device.state === "true";
            this.alive = device.online;
        }
    }
}

module.exports = BaseDevice;