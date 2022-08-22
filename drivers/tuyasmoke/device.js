'use strict';

const TuyaBaseDevice = require('../tuyabasedevice');

class TuyaSmokeDevice extends TuyaBaseDevice {

    onInit() {
        this.initDevice(this.getData().id);
        this.fixCapabilities();
        this.setDeviceConfig(this.get_deviceConfig());
        this.log(`Tuya smokesensor ${this.getName()} has been initialized`);
    }

    fixCapabilities() {
        if (this.hasCapability("alarm_battery")) {
            this.homey.log("remove double capabality alarm_battery");
            this.removeCapability("alarm_battery");
        }
    }

    setDeviceConfig(deviceConfig) {
        if (deviceConfig != null) {
            this.log("set smokesensor device config: " + JSON.stringify(deviceConfig));
            let statusArr = deviceConfig.status ? deviceConfig.status : [];
            this.updateCapabilities(statusArr);
        }
        else {
            this.homey.log("No device config found");
        }
    }

    //init Or refresh AccessoryService
    updateCapabilities(statusArr) {
        this.log("Update smokesensor capabilities from Tuya: " + JSON.stringify(statusArr));
        for (const statusMap of statusArr) {
            if (statusMap.code === "smoke_sensor_status") {
                this.sensorStatus = statusMap;
                var rawStatus = this.sensorStatus.value;
                switch (rawStatus) {
                    case "alarm":
                        this.setCapabilityValue("alarm_smoke", true).catch(this.error);
                    case 'normal':  
                        this.setCapabilityValue("alarm_smoke", false).catch(this.error);
                        break;
                    default:
                        break;
                }
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

module.exports = TuyaSmokeDevice;