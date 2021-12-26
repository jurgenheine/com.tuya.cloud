'use strict';

const Homey = require('homey');
const BaseDriver = require('../basedriver');

class LightDriver extends BaseDriver {

    onInit() {
        this.log('Tuya light driver has been initialized');
    }

    async onPairListDevices(data, callback) {
        let devices = [];
        if (!Homey.app.isConnected()) {
            callback(new Error("Please configure the app first."));
        }
        else {
            let lights = this.get_devices_by_type("light");
            for (let tuyaDevice of Object.values(lights)) {
                let capabilities = [];
                capabilities.push("onoff");
                for (let func of tuyaDevice.functions) {
                    switch (func.code) {
                        case "bright_value":
                        case "bright_value_v2":
                        case "bright_value_1":
                            capabilities.push("dim");
                            break;
                        case "temp_value":
                        case "temp_value_v2":
                            capabilities.push("light_temperature");
                            break;
                        case "colour_data":
                        case "colour_data_v2":
                            capabilities.push("light_temperature");
                            break;
                        default:
                            break;
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
        }
        callback(null, devices.sort(BaseDriver._compareHomeyDevice));
    }
}

module.exports = LightDriver;