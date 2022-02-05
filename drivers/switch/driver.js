'use strict';

const Homey = require('homey');

class SwitchDriver extends Homey.Driver {

    onInit() {
        this.log('Tuya legacy switch driver has been initialized');
    }

    async onPairListDevices() {
        let devices = [];
        if (!this.homey.app.isOldConnected()) {
            throw new Error("Please configure the app first.");
        }
        else {
            let switches = await this.homey.app.oldclient.get_devices_by_type('switch');
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
        return devices.sort(CoverDriver._compareHomeyDevice);
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