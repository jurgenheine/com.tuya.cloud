'use strict';

const TuyaBaseDevice = require('../tuyabasedevice');

class TuyaGarageDoorOpenerDevice extends TuyaBaseDevice {

    onInit() {
        this.initDevice(this.getData().id);
        this.setDeviceConfig(this.get_deviceConfig());
        this.log(`Tuya Garage Door Opener ${this.getName()} has been initialized`);
    }

    setDeviceConfig(deviceConfig) {
        if (deviceConfig !== null) {
            this.log("set Garage Door Opener device config: " + JSON.stringify(deviceConfig));
            const statusArr = deviceConfig.status ? deviceConfig.status : [];
            this.updateCapabilities(statusArr);
        }
        else {
            this.homey.log("No device config found");
        }
    }

    //init Or refresh AccessoryService
    updateCapabilities(statusArr) {
        this.log("Update Garage Door Opener capabilities from Tuya: " + JSON.stringify(statusArr));
        for (const statusMap of statusArr) {
            if (statusMap.code === "doorcontact_state") {
                this.sensorStatus = statusMap;
                this.setCapabilityValue("alarm_contact", this.sensorStatus.value).catch(this.error);
            }
        }
    }
}

module.exports = TuyaGarageDoorOpenerDevice;
