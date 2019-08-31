'use strict';

const Homey = require('homey');

class BaseDevice extends Homey.Device {
    initDevice(device) {
        this.data = device.data;
        this.obj_id = device.id;
        this.obj_name = device.name;
        this.dev_type = devicedev_type;
        this.iconurl = device.icon;
        this.state = device.state === 'true' ? true : false;
        this.alive = device.online;
    }

    async update() {
        const { payload: { device } } = await Homey.app.operateDevice(this.obj_id, 'QueryDevice', null, 'query');
        this.updateData( device);
    }

    updateData(device) {
        this.data = device.data;
    }
}

module.exports = BaseDevice;