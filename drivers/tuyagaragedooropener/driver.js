'use strict';

const TuyaBaseDriver = require('../tuyabasedriver');

class TuyaGarageDoorOpenerDriver extends TuyaBaseDriver {

    onInit() {
        this.log('Tuya Garage Door Opener driver has been initialized');
    }

    async onPairListDevices() {
        let devices = [];
        if (!this.homey.app.isConnected()) {
            throw new Error("Please configure the app first.");
        }

        let covers = this.get_devices_by_type("garageDoorOpener");
        for (const tuyaDevice of Object.values(covers)) {
            const capabilities = [];
            capabilities.push("alarm_contact");
            capabilities.push("garagedoor_closed");
            devices.push({
                data: {
                    id: tuyaDevice.id
                },
                capabilities: capabilities,
                name: tuyaDevice.name
            });

        }
        return devices.sort(TuyaBaseDriver._compareHomeyDevice);
    }
}

module.exports = TuyaGarageDoorOpenerDriver;
