'use strict';

const Homey = require('homey');

class BaseDevice extends Homey.Device {
    async initDevice(id) {
        this.updateInprogess = false;
        this.data = {};
        this.id = id;
        if (this.homey.app.oldclient !== null && this.homey.app.oldclient !== undefined) {
            var device = await this.homey.app.oldclient.get_device_by_id(id);
            if (device !== null && device !== undefined)
                this.data = device.data;
        }
    }

    async update() {
        let { payload: { data } } = await this.operateDevice(this.id, 'QueryDevice', null, 'query');
        this.updateData(data);
    }

    updateData(data) {
        console.log("try update legacy data" );
        if (data != null && !this.updateInprogess) {
            console.log("update legacy device: " + JSON.stringify(data));
            this.data = data;
        }
    }

    operateDevice(devId, action, param = null, namespace = 'control') {
        try {
            return this.homey.app.oldclient.device_control(devId, action, param, namespace);
        } catch (ex) {
            this.homey.error(ex);
        }
    }

    getState() {
        return this.data != null ? this.data.state ===true || this.data.state === 'true' : false;
    }

    async turn_on() {
        await this.operateDevice(this.id, 'turnOnOff', { value: '1' });
        this.data.state = true;
    }

    async turn_off() {
        await this.operateDevice(this.id, 'turnOnOff', { value: '0' });
        this.data.state = false;
    }
}

module.exports = BaseDevice;