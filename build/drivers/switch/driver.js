'use strict';

const Homey = require('homey');

class SwitchDriver extends Homey.Driver {

    onInit() {
        this.log('Tuya legacy switch driver has been initialized');
    }

    async onPairListDevices(data, callback) {
        let devices = [];
        if (!Homey.app.isOldConnected()) {
            callback(new Error("Please configure the app first."));
        }
        else {
            let switches = await Homey.app.oldclient.get_devices_by_type('switch');
            for (let tuyaDevice of Object.values(switches)) {

                let capabilities = [];
                capabilities.push("onoff");
                devices.push({
                    data: {
                        id: tuyaDevice.id
                    },
                    capabilities: capabilities,
                    name: tuyaDevice.name
                });
            }
        }
        callback(null, devices.sort(SwitchDriver._compareHomeyDevice));
    }

    static _compareHomeyDevice(a, b) {
        if (a.name < b.name)
            return -1;
        if (a.name > b.name)
            return 1;
        return 0;
    }

}

module.exports = SwitchDriver;