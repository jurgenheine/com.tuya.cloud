'use strict';

const Homey = require('homey');

class CoverDriver extends Homey.Driver {

    onInit() {
        this.log('Tuya legacy cover driver has been initialized');
    }

    async onPairListDevices() {
        let devices = [];
        if (!this.homey.app.isOldConnected()) {
            throw new Error("Please configure the app first.");
        }
        else {
            let covers = await this.homey.app.oldclient.get_devices_by_type('cover');
            for (let tuyaDevice of Object.values(covers)) {

                let capabilities = [];
				this.log("OnPairList: ");
				this.log(tuyaDevice.data);
              
				capabilities.push("windowcoverings_state");

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

module.exports = CoverDriver;
