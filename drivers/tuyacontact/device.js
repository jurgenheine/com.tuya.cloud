'use strict';

const TuyaBaseDevice = require('../tuyabasedevice');

class TuyaContactDevice extends TuyaBaseDevice {

    onInit() {
        this.initDevice(this.getData().id);
        this.fixCapabilities();
        this.setDeviceConfig(this.get_deviceConfig());
        this.log(`Tuya contactsensor ${this.getName()} has been initialized`);
    }

    fixCapabilities() {
        if (this.hasCapability("alarm_battery")) {
            this.homey.log("remove double capabality alarm_battery");
            this.removeCapability("alarm_battery");
        }
    }

    setDeviceConfig(deviceConfig) {
        if (deviceConfig != null) {
            this.log("set contactsensor device config: " + JSON.stringify(deviceConfig));
            let statusArr = deviceConfig.status ? deviceConfig.status : [];
            this.updateCapabilities(statusArr);
        }
        else {
            this.homey.log("No device config found");
        }
    }

    //init Or refresh AccessoryService
    updateCapabilities(statusArr) {
        this.log("Update contactsensor capabilities from Tuya: " + JSON.stringify(statusArr));
        for (const statusMap of statusArr) {
            if (statusMap.code === "doorcontact_state") {
                this.sensorStatus = statusMap;
                this.setCapabilityValue("alarm_contact", this.sensorStatus.value).catch(this.error);
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

module.exports = TuyaContactDevice;