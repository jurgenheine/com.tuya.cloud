'use strict';

const Homey = require('homey');

class BaseDevice extends Homey.Device {
    initDevice(id) {
        this.updateInprogess = false;
        this.data = {};
        this.id = id;
    }

    async update() {
        let { payload: { data } } = await Homey.app.operateDevice(this.id, 'QueryDevice', null, 'query');
        this.updateData(data);
    }

    updateData(data) {
        console.log("try update data" );
        if (data != null && !this.updateInprogess) {
            console.log("update device: " + JSON.stringify(data));
            this.data = data;
        }
    }

    getState() {
        return this.data != null ? this.data.state ===true || this.data.state === 'true' : false;
    }

    async turn_on() {
        await Homey.app.operateDevice(this.id, 'turnOnOff', { value: '1' });
        this.data.state = true;
    }

    async turn_off() {
        await Homey.app.operateDevice(this.id, 'turnOnOff', { value: '0' });
        this.data.state = false;
    }

    async stop() {
        await Homey.app.operateDevice(this.id, 'startStop', { value: '0' });
    }
}

module.exports = BaseDevice;