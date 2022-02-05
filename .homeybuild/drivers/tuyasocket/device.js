'use strict';

const Homey = require('homey');
const TuyaBaseDevice = require('../tuyabasedevice');
const DataUtil = require('../../util/datautil');

const CAPABILITIES_SET_DEBOUNCE = 1000;

class TuyaSocketDevice extends TuyaBaseDevice {

    onInit() {
        this.initDevice(this.getData().id);
        this.setDeviceConfig(this.get_deviceConfig());
        this.log(`Tuya socket ${this.getName()} has been initialized`);
    }

    setDeviceConfig(deviceConfig) {
        if (deviceConfig != null) {
            console.log("set socket device config: " + JSON.stringify(deviceConfig));
            let statusArr = deviceConfig.status ? deviceConfig.status : [];
            let capabilities = this.getCustomCapabilities(DataUtil.getSubService(statusArr));
            this.updateCapabilities(statusArr);
            this.registerMultipleCapabilityListener(capabilities, async (values, options) => { return this._onMultipleCapabilityListener(values, options); }, CAPABILITIES_SET_DEBOUNCE);
        }
    }

    getCustomCapabilities(subcodes) {
        var capabilties = [];
        for (var code of subcodes) {
            let name;
            if (subcodes.length === 1) {
                name = "onoff";
            }
            else {
                name = "onoff." + code;
            }
            capabilties.push(name);
        }
        return capabilties;
    }

    _onMultipleCapabilityListener(valueObj, optsObj) {
        this.log("Socket Capabilities changed by Homey: " + JSON.stringify(valueObj));
        try {
            for (let key of Object.keys(valueObj)) {
                let value = valueObj[key];
                this.sendCommand(key, value);
            }
        } catch (ex) {
            Homey.app.logToHomey(ex);
        }
    }

    updateCapabilities(statusArr) {
        this.log("Update socket capabilities from Tuya: " + JSON.stringify(statusArr));
        if (!statusArr) {
            return;
        }
        let subcodes = DataUtil.getSubService(statusArr);
        for (var subType of subcodes) {
            var status = statusArr.find(item => item.code === subType);
            if (!status) {
                continue;
            }
            let name;
            var value = status.value;
            if (subcodes.length === 1) {
                name = "onoff";
                this.switchValue = status;
            }
            else {
                name = "onoff." + subType;
            }
            this.log(`Set socket capability ${name} with value ${value}`);
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
        Homey.app.tuyaOpenApi.sendCommand(this.id, param).catch((error) => {
            this.log.error('[SET][%s] capabilities Error: %s', this.id, error);
        });
    }

    //get Command SendData
    getSendParam(name, value) {
        var code;
        const isOn = value ? true : false;
        if (name.indexOf(".") === -1) {
            code = this.switchValue.code;
        } else {
            code = name.split('.')[1];
        }
        value = isOn;
        this.log("update Tuya socket code " + code + ": " + JSON.stringify(value));
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