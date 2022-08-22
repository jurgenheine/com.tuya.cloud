'use strict';

const TuyaBaseDriver = require('../tuyabasedriver');

class TuyaCoverDriver extends TuyaBaseDriver {

    onInit() {
        this.log('Tuya windowscovering driver has been initialized');
    }

    async onPairListDevices() {
        let devices = [];
        if (!this.homey.app.isConnected()) {
            throw new Error("Please configure the app first.");
        }
        else {
            let covers = this.get_devices_by_type("cover");
            for (let tuyaDevice of Object.values(covers)) {
                let capabilities = [];
                capabilities.push("windowcoverings_set");
                
                devices.push({
                    data: {
                        id: tuyaDevice.id
                    },
                    capabilities: capabilities,
                    name: tuyaDevice.name
                });

            }
        }
        return devices.sort(TuyaBaseDriver._compareHomeyDevice);
    }
}

module.exports = TuyaCoverDriver;