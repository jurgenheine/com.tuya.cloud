'use strict';

const TuyaBaseDevice = require('../tuyabasedevice');

class TuyaGarageDoorOpenerDevice extends TuyaBaseDevice {

    onInit() {
        this.initDevice(this.getData().id);
        this.setDeviceConfig(this.get_deviceConfig());
        this.registerCapabilityListener("garagedoor_closed", this.onCapabilityGaragedoorClosed.bind(this));
        this.log(`Tuya Garage Door Opener ${this.getName()} has been initialized`);
    }

    async onCapabilityGaragedoorClosed(value, _) {
        const command = {
            commands: [
                {
                    code: "switch_1",
                    value: value
                }
            ]
        };
        this.log("Garage door switch is triggered");
        this.homey.app.tuyaOpenApi.sendCommand(this.id, command).catch((error) => {
            this.error(`[SET][${this.id}] capabilities Error: ${error}`);
        });
    }

    setDeviceConfig(deviceConfig) {
        if (deviceConfig !== null) {
            this.log("set Garage Door Opener device config: " + JSON.stringify(deviceConfig));
            const statusArr = deviceConfig.status ? deviceConfig.status : [];
            this.updateCapabilities(statusArr);
        } else {
            this.homey.log("No device config found");
        }
    }

    //init Or refresh AccessoryService
    updateCapabilities(statusArr) {
        this.log("Update Garage Door Opener capabilities from Tuya: " + JSON.stringify(statusArr));
        statusArr.forEach(status => {
            if (status.code === "doorcontact_state") {
                this.setCapabilityValue("alarm_contact", status.value).catch(this.error);
            } else if (status.code === "switch_1") {
                this.setCapabilityValue("garagedoor_closed", status.value).catch(this.error);
            }
        })
    }
}

module.exports = TuyaGarageDoorOpenerDevice;
