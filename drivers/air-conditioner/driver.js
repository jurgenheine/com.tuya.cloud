'use strict';

const TuyaBaseDriver = require('../tuyabasedriver');

class TuyaAirConditionerDriver extends TuyaBaseDriver {

    onInit() {
        this.log('Tuya Air conditioner driver has been initialized');
    }

    async onPairListDevices() {
        let devices = [];
        if (!this.homey.app.isConnected()) {
            throw new Error("Please configure the app first.");
        }
        else {
            let airConditioner = this.get_devices_by_type("airConditioner");
            for (let tuyaDevice of Object.values(airConditioner)) {
                let capabilities = ["onoff","target_temperature","measure_temperature","thermostat_mode_std",
                    ];

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

module.exports = TuyaAirConditionerDriver;
