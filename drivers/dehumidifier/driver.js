'use strict';

const TuyaBaseDriver = require('../tuyabasedriver');

class TuyaDehumidifierDriver extends TuyaBaseDriver {

    onInit() {
        this.log('Tuya dehumidifier driver has been initialized');
    }

    async onPairListDevices() {
        let devices = [];
        if (!this.homey.app.isConnected()) {
            throw new Error("Please configure the app first.");
        }
        else {
            let dehumidifier = this.get_devices_by_type("dehumidifier");
            for (let tuyaDevice of Object.values(dehumidifier)) {
                let capabilities = [];
                // capabilities = capabilities.concat(this.manifest.capabilities);
                let capabilitiesOptions = {};
                this.log("Add dehumidifier, device details:");
                this.log(tuyaDevice);
                if (tuyaDevice.status){
                    for (let i=0; i<tuyaDevice.status.length; i++){
                        switch (tuyaDevice.status[i].code){
                            case "temp_indoor":
                                capabilities.push("measure_temperature");
                                break;
                            case "humidity_indoor":
                                capabilities.push("measure_humidity");
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
                            case "dehumidify_set_enum":
                                values = JSON.parse(tuyaDevice.functions[i].values);
                                capabilities.push("target_humidity");
                                break;
                            // case "mode":
                            //     values = JSON.parse(tuyaDevice.functions[i].values);
                            //     if (values.range != null){
                            //         if (values.range.indexOf("auto") >= 0){
                            //             capabilities.push("thermostat_heater_mode");
                            //         }
                            //     }
                            //     break;
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
                    name: tuyaDevice.name
                });

            }
        }
        return devices.sort(TuyaBaseDriver._compareHomeyDevice);
    }
}

module.exports = TuyaDehumidifierDriver;
