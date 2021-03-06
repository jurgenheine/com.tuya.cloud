'use strict';

const Homey = require('homey');

class LightDriver extends Homey.Driver {

    onInit() {
        this.log('Tuya Light Driver has been initialized');
    }

    async onPairListDevices(data, callback) {
        let devices = [];
        if (!Homey.app.isConnected()) {
            callback(new Error("Please configure the app first."));
        }
        else {
            let lights = await Homey.app.getLights();
            for (let tuyaDevice of Object.values(lights)) {

                let capabilities = [];
                capabilities.push("onoff");
                if (tuyaDevice.data.brightness != null || (tuyaDevice.data.color != null && tuyaDevice.data.color.brightness != null))
                    capabilities.push("dim");
                if (tuyaDevice.data.color != null) {
                    capabilities.push("light_hue");
                    capabilities.push("light_saturation");
                }
                if (tuyaDevice.data.color_temp != null)
                    capabilities.push("light_temperature");

                devices.push({
                    data: {
                        id: tuyaDevice.id
                    },
                    capabilities: capabilities,
                    name: tuyaDevice.name
                });
            }
        }
        callback(null, devices.sort(LightDriver._compareHomeyDevice));
    }

    static _compareHomeyDevice(a, b) {
        if (a.name < b.name)
            return -1;
        if (a.name > b.name)
            return 1;
        return 0;
    }

}

module.exports = LightDriver;