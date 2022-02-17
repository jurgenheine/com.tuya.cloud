'use strict';

const TuyaBaseDevice = require('../tuyabasedevice');

class TuyaPirDevice extends TuyaBaseDevice {

    onInit() {
        this.initDevice(this.getData().id);
        this.setDeviceConfig(this.get_deviceConfig());
        this.log(`Tuya pir ${this.getName()} has been initialized`);
    }

    setDeviceConfig(deviceConfig) {
        if (deviceConfig != null) {
            this.log("set pir device config: " + JSON.stringify(deviceConfig));
            let statusArr = deviceConfig.status ? deviceConfig.status : [];
            this.updateCapabilities(statusArr);
        }
        else {
            this.homey.app.logToHomey("No device config found");
        }
    }

    //init Or refresh AccessoryService
    updateCapabilities(statusArr) {
        this.log("Update pir capabilities from Tuya: " + JSON.stringify(statusArr));
        for (const statusMap of stateArr) {
            if (statusMap.code === "pir") {
                this.sensorStatus = statusMap;
                var rawStatus = this.sensorStatus.value;
                switch (rawStatus) {
                    case "pir":
                        this.setCapabilityValue("alarm_motion", status).catch(this.error);
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

            if (statusMap.code === "battery_state") {
                this.batteryStatus = statusMap;
                var rawStatus = this.batteryStatus.value;
                switch (rawStatus) {
                    case "low":
                        this.setCapabilityValue("measure_battery", 0.1).catch(this.error);
                        this.setCapabilityValue("alarm_battery", true).catch(this.error);
                        break;
                    case "middle":
                        this.setCapabilityValue("measure_battery", 0.5).catch(this.error);
                        this.setCapabilityValue("alarm_battery", false).catch(this.error);
                        break;
                    case "high":
                        this.setCapabilityValue("measure_battery", 1).catch(this.error);
                        this.setCapabilityValue("alarm_battery", false).catch(this.error);
                        break;
                    default:
                        break;
                }
            }
        }
    }
}

module.exports = TuyaPirDevice;