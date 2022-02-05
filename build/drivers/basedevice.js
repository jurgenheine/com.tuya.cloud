'use strict';

const Homey = require('homey');

class BaseDevice extends Homey.Device {
    initDevice(id) {
        this.updateInprogess = false;
        this.data = {};
        this.id = id;
    }

    async update() {
        let { payload: { data } } = await this.operateDevice(this.id, 'QueryDevice', null, 'query');
        this.updateData(data);
    }

    updateData(data) {
        console.log("try update data" );
        if (data != null && !this.updateInprogess) {
            console.log("update device: " + JSON.stringify(data));
            this.data = data;
        }
    }

    operateDevice(devId, action, param = null, namespace = 'control') {
        try {
            return Homey.app.oldclient.device_control(devId, action, param, namespace);
        } catch (ex) {
            this.logToHomey(ex);
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