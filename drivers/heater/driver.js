'use strict';

const TuyaBaseDriver = require('../tuyabasedriver');

class TuyaHeaterDriver extends TuyaBaseDriver {

    onInit() {
        this.log('Tuya Air conditioner driver has been initialized');
    }

    async onPairListDevices() {
        let devices = [];
        if (!this.homey.app.isConnected()) {
            throw new Error("Please configure the app first.");
        }
        else {
            let heater = this.get_devices_by_type("heater");
            for (let tuyaDevice of Object.values(heater)) {
                let capabilities = ["onoff","target_temperature","measure_temperature","thermostat_heater_mode",
                    ];
                this.log("Add heater, device details:");
                this.log(tuyaDevice);
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

module.exports = TuyaHeaterDriver;
