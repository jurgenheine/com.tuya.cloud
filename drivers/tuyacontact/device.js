'use strict';

const TuyaBaseDevice = require('../tuyabasedevice');

class TuyaContactDevice extends TuyaBaseDevice {

    onInit() {
        this.initDevice(this.getData().id);
        this.setDeviceConfig(this.get_deviceConfig());
        this.log(`Tuya contactsensor ${this.getName()} has been initialized`);
    }

    setDeviceConfig(deviceConfig) {
        if (deviceConfig != null) {
            this.log("set contactsensor device config: " + JSON.stringify(deviceConfig));
            let statusArr = deviceConfig.status ? deviceConfig.status : [];
            this.updateCapabilities(statusArr);
        }
        else {
            this.homey.app.logToHomey("No device config found");
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
                this.setCapabilityValue("alarm_battery", this.batteryStatus.value < 20).catch(this.error);
            }
        }
    }
}

module.exports = TuyaContactDevice;