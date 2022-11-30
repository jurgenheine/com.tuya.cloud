'use strict';

const TuyaBaseDevice = require('../tuyabasedevice');

class TuyaCoDevice extends TuyaBaseDevice {

    onInit() {
        this.initDevice(this.getData().id);
        this.setDeviceConfig(this.get_deviceConfig());
        this.log(`Tuya CO sensor ${this.getName()} has been initialized`);
    }

    setDeviceConfig(deviceConfig) {
        if (deviceConfig != null) {
            this.log("set CO sensor device config: " + JSON.stringify(deviceConfig));
            let statusArr = deviceConfig.status ? deviceConfig.status : [];
            this.updateCapabilities(statusArr);
        }
        else {
            this.homey.log("No device config found");
        }
    }

    //init Or refresh AccessoryService
    updateCapabilities(statusArr) {
        this.log("Update CO sensor capabilities from Tuya: " + JSON.stringify(statusArr));
        for (let statusMap of statusArr) {

            let covalue = 0;

            if (statusMap.code === "co_value") {
                covalue = statusMap.value;
                this.setCapabilityValue("measure_co", statusMap.value).catch(this.error);
            }
            if (statusMap.code === "co_status") {
                switch (statusMap.value) {
                    case "alarm":
                        this.setCapabilityValue("alarm_co", true).catch(this.error);
                        break;
                    case 'normal':  
                        this.setCapabilityValue("alarm_co", false).catch(this.error);
                        break;
                    default:
                        break;
                }
            }

            if (statusMap.code === "checking_result") {
                switch (statusMap.value) {
                    case "check_success":
                        this.setCapabilityValue("alarm_generic", true).catch(this.error);
                        this.homey.setTimeout( () => {
                            this.setCapabilityValue("alarm_generic", false).catch(this.error)
                            }, 
                            10000);
                    default:
                        break;
                }
            }


            if (statusMap.code === "battery_percentage") {
                this.setCapabilityValue("measure_battery", statusMap.value).catch(this.error);
            }else if (statusMap.code === "battery_state") {
                switch (statusMap.value) {
                    case "low":
                        this.setCapabilityValue("measure_battery", 10).catch(this.error);
                        break;
                    case "middle":
                        this.setCapabilityValue("measure_battery", 50).catch(this.error);
                        break;
                    case "high":
                        this.setCapabilityValue("measure_battery", 100).catch(this.error);
                        break;
                    default:
                        break;
                }
            }
        }
    }
}

module.exports = TuyaCoDevice;