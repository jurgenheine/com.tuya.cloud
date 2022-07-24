'use strict';

const TuyaBaseDevice = require('../tuyabasedevice');

class TuyaPresenceDevice extends TuyaBaseDevice {

    onInit() {
        this.initDevice(this.getData().id);
        this.setDeviceConfig(this.get_deviceConfig());
        this.log(`Tuya presence ${this.getName()} has been initialized`);
    }

    setDeviceConfig(deviceConfig) {
        if (deviceConfig != null) {
            this.log("set presence device config: " + JSON.stringify(deviceConfig));
            let statusArr = deviceConfig.status ? deviceConfig.status : [];
            this.updateCapabilities(statusArr);
        }
        else {
            this.homey.log("No device config found");
        }
    }

    //init Or refresh AccessoryService
    updateCapabilities(statusArr) {
        this.log("Update presence capabilities from Tuya: " + JSON.stringify(statusArr));
        for (const statusMap of statusArr) {
            if (statusMap.code === "presence_state") {
                this.sensorStatus = statusMap;
                var rawStatus = this.sensorStatus.value;
                switch (rawStatus) {
                    case "presence":
                        this.setCapabilityValue("alarm_motion", true).catch(this.error);
                        break;
                    default:
                        this.setCapabilityValue("alarm_motion", false).catch(this.error);
                        break;
                }
            }
        }
    }
}

module.exports = TuyaPresenceDevice;