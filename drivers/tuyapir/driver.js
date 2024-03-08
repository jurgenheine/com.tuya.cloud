'use strict';

const TuyaBaseDriver = require('../tuyabasedriver');

class TuyaPirDriver extends TuyaBaseDriver {

    onInit() {
        this.log('Tuya pir driver has been initialized');
    }

    async onPairListDevices() {
        let devices = [];
        if (!this.homey.app.isConnected()) {
            throw new Error("Please configure the app first.");
        }
        else {
            let covers = this.get_devices_by_type("pir");
            for (let tuyaDevice of Object.values(covers)) {
                let capabilities = [];
                capabilities.push("alarm_motion");
                capabilities.push("measure_battery");
                capabilities.push("alarm_battery");
                for (let func of tuyaDevice.status) {
                    if (func.code === "illuminance_value") {
                        capabilities.push("measure_luminance");
                    }
                }
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

module.exports = TuyaPirDriver;