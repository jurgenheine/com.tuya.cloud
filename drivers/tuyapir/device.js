'use strict';

const TuyaBaseDevice = require('../tuyabasedevice');

class TuyaPirDevice extends TuyaBaseDevice {

    onInit() {
        this.initDevice(this.getData().id);
        this.fixCapabilities();
        this.setDeviceConfig(this.get_deviceConfig());
        this.log(`Tuya pir ${this.getName()} has been initialized`);
    }

    fixCapabilities() {
        if (this.hasCapability("alarm_battery")) {
            this.homey.log("remove double capabality alarm_battery");
            this.removeCapability("alarm_battery");
        }
    }

    setDeviceConfig(deviceConfig) {
        if (deviceConfig != null) {
            this.log("set pir device config: " + JSON.stringify(deviceConfig));
            let statusArr = deviceConfig.status ? deviceConfig.status : [];
            this.updateCapabilities(statusArr);
        }
        else {
            this.homey.log("No device config found");
        }
    }
    
    //init Or refresh AccessoryService
    updateCapabilities(statusArr) {
        this.log("Update pir capabilities from Tuya: " + JSON.stringify(statusArr));
        for (const statusMap of statusArr) {
            if (statusMap.code === "pir" || statusMap.code === "pir_state") {
                this.sensorStatus = statusMap;
                var rawStatus = this.sensorStatus.value;
                switch (rawStatus) {
                    case "none":
                        this.setCapabilityValue("alarm_motion", false).catch(this.error);
                        break;
                    case "pir":
                        this.setCapabilityValue("alarm_motion", true).catch(this.error);
                        // reset timeout when new trigger
                        if (this.timeoutObj !== null && this.timeoutObj !== undefined) {
                            clearTimeout(this.timeoutObj);
                        }
                        // Untrigger the motion sensor after specified seconds
                        this.timeoutObj = setTimeout(() => {
                            this.setCapabilityValue("alarm_motion", false).catch(this.error);
                        }, 1000 * this.getSettings().motionTimeoutInSeconds);
                        break;
                    default:
                        break;
                }
            }
            if (statusMap.code === "illuminance_value") {
                this.setCapabilityValue("measure_luminance", statusMap.value).catch(this.error);
            }    
            if (statusMap.code === "battery_percentage") {
                this.batteryStatus = statusMap;
                this.setCapabilityValue("measure_battery", this.batteryStatus.value).catch(this.error);
            }else if (statusMap.code === "battery_state") {
                this.batteryStatus = statusMap;
                var rawStatus = this.batteryStatus.value;
                switch (rawStatus) {
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

module.exports = TuyaPirDevice;