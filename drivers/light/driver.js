'use strict';

const Homey = require('homey');

class LightDriver extends Homey.Driver {

    onInit() {
        this.log('Tradfri Light Driver has been initialized');
    }

    updateCapabilities(tuyaDevice) {
        let homeyDevice = this.getDevice({ id: tuyaDevice.obj_id });
        if (homeyDevice instanceof Error) return;
        homeyDevice.updateCapabilities(tuyaDevice);
    }

    onPairListDevices(data, callback) {
        let devices = [];
        if (!Homey.app.isGatewayConnected()) {
            callback(new Error("Please configure the app first."));
        }
        else {
            let lights = Homey.app.getLights();
            for (const device of Object.values(lights)) {

                let capabilities = [];
                capabilities.push("onoff");
                if(device.support_dim())
                    capabilities.push("dim");
                if (device.support_color()) {
                    capabilities.push("light_hue");
                    capabilities.push("light_saturation");
                }
                if (device.support_color_temp())
                    capabilities.push("light_temperature");
            }

            devices.push({
                data: {
                    id: device.obj_id
                },
                capabilities: capabilities,
                name: obj_name.name
            });
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