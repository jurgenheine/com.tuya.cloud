'use strict';

const Homey = require('homey');
const TuyaBaseDevice = require('../tuyabasedevice');

class TuyaSocketDevice extends TuyaBaseDevice {

    onInit() {
        this.initDevice(this.getData().id);
        this.setDeviceConfig(this.get_deviceConfig());
        this.log(`Tuya socket ${this.getName()} has been initialized`);
    }

    setDeviceConfig(deviceConfig) {
        if (deviceConfig != null) {
            console.log("set device config: " + JSON.stringify(deviceConfig));
            let statusArr = deviceConfig.status ? deviceConfig.status : [];
            this.subcodes = DataUtil.getSubService(deviceConfig);
            this.updateCapabilities(statusArr);
            this.registerCapabilitieListener();
        }
    }

    registerCapabilitieListener() {
        for (var code of this.subcodes) {
            let name;
            if (this.subcodes.length === 1) {
                name = "onoff";
            }
            else {
                name = "onoff." + code;
            }

            this.registerCapabilityListener(name, (value, opts) => {
                console.log("set capabilities: " + name + "; " + value);
                this.sendCommand(name + code, value);
                return Promise.resolve();
            });
        }
    }

    updateCapabilities(statusArr) {
        console.log("update capabilities: " + JSON.stringify(statusArr));
        if (!statusArr) {
            return;
        }

        for (var subType of this.subcodes) {
            var status = statusArr.find(item => item.code === subType);
            if (!status) {
                continue;
            }
            let name;
            var value = status.value;
            if (this.subcodes.length === 1) {
                name = "onoff";
                this.switchValue = status;
            }
            else {
                name = "onoff." + subType;
            }
            this.setCachedState(name, value);
            this.setCapabilityValue(name, value).catch(this.error);
            this.triggerSocketChanged(subType, value);
        }
    }

    triggerSocketChanged(name, value) {
        let tokens = {};
        let state = {
            socketid: name,
            state: value ? "On" : "Off"
        };
        this.getDriver().triggerSocketChanged(this, tokens, state);
    }

    sendCommand(name, value) {
        var param = this.getSendParam(name, value);
        Homey.app.tuyaOpenApi.sendCommand(this.id, param).then(() => {
            this.setCachedState(name, value);
        }).catch((error) => {
            this.log.error('[SET][%s] capabilities Error: %s', this.id, error);
            this.invalidateCache();
        });
    }

    //get Command SendData
    getSendParam(name, value) {
        var code;
        const isOn = value ? true : false;
        if (this.subcodes.length === 1) {
            code = this.switchValue.code;
        } else {
            code = name;
        }
        value = isOn;
        return {
            "commands": [
                {
                    "code": code,
                    "value": value
                }
            ]
        };
    }
}

module.exports = TuyaSocketDevice;