'use strict';

const Homey = require('homey');

class BaseDevice extends Homey.Device {
    initDevice(id) {
        this.data = {};
        this.id = id;
    }

    async update() {
        const { payload: { data } } = await Homey.app.operateDevice(this.id, 'QueryDevice', null, 'query');
        this.updateData(data);
    }

    updateData(data) {
        console.log("try update data" );
        if (data != null) {
            console.log("update device: " + JSON.stringify(data));
            this.data = data;
        }
    }
}

module.exports = BaseDevice;