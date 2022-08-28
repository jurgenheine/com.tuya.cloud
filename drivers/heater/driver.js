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
                let capabilities = [];
                let capabilitiesOptions = {};
                this.log("Add heater, device details:");
                this.log(tuyaDevice);
                if (tuyaDevice.status){
                    for (let i=0; i<tuyaDevice.status.length; i++){
                        switch (tuyaDevice.status[i].code){
                            case "temp_current":
                                capabilities.push("measure_temperature");
                                break;
                            default:
                                break;
                        }
                    }
                }
                if (tuyaDevice.functions){
                    for (let i=0; i<tuyaDevice.functions.length; i++){
                        let values;
                        switch (tuyaDevice.functions[i].code){
                            case "switch":
                                capabilities.push("onoff");
                                break;
                            case "temp_set":
                                values = JSON.parse(tuyaDevice.functions[i].values);
                                capabilities.push("target_temperature");
                                capabilitiesOptions["target_temperature"] = 
                                    {
                                        "min": values.min,
                                        "max": values.max,
                                        "step": values.step
                                    };
                                break;
                            case "mode":
                                values = JSON.parse(tuyaDevice.functions[i].values);
                                if (values.range != null){
                                    if (values.range.indexOf("auto") >= 0){
                                        capabilities.push("thermostat_heater_mode");
                                    }
                                }
                                break;
                            default:
                                break;
                        }
                    }
                }
                devices.push({
                    data: {
                        id: tuyaDevice.id
                    },
                    capabilities: capabilities,
                    capabilitiesOptions: capabilitiesOptions,
                    name: tuyaDevice.name
                });

            }
        }
        return devices.sort(TuyaBaseDriver._compareHomeyDevice);
    }
}

module.exports = TuyaHeaterDriver;
