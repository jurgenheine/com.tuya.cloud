'use strict';

const TuyaBaseDevice = require('../tuyabasedevice');

const CAPABILITIES_SET_DEBOUNCE = 1000;

class TuyaCoverDevice extends TuyaBaseDevice {

    onInit() {
        this.initDevice(this.getData().id);
        this.setDeviceConfig(this.get_deviceConfig());
        this.registerMultipleCapabilityListener(this.getCapabilities(), async (values, options) => { return this._onMultipleCapabilityListener(values, options); }, CAPABILITIES_SET_DEBOUNCE);
        this.log(`Tuya windowscovering ${this.getName()} has been initialized`);
    }

    setDeviceConfig(deviceConfig) {
        if (deviceConfig != null) {
            this.log("set windowscovering device config: " + JSON.stringify(deviceConfig));
            let statusArr = deviceConfig.status ? deviceConfig.status : [];
            this.updateCapabilities(statusArr);
        }
        else {
            this.homey.app.logToHomey("No device config found");
        }
    }

    _onMultipleCapabilityListener(valueObj, optsObj) {
        this.log("Windowscovering capabilities changed by Homey: " + JSON.stringify(valueObj));
        try {
            if (valueObj.windowcoverings_set != null) {
                this.sendCommand(valueObj.windowcoverings_set * 100);
            }
        } catch (ex) {
            this.homey.app.logToHomey(ex);
        }
    }

    //init Or refresh AccessoryService
    updateCapabilities(statusArr) {
        this.log("Update windowscovering capabilities from Tuya: " + JSON.stringify(statusArr));
        for (const statusMap of statusArr) {

            //Check whether 100% is fully on or fully off. If there is no dp point, 100% is fully off by default
            if (statusMap.code === 'situation_set') {
                this.fullySituationMap = statusMap
            }

            // Characteristic.TargetPosition
            if (statusMap.code === 'percent_control') {
                this.percentControlMap = statusMap
                this.normalAsync("windowcoverings_set", this._getCorrectPercent(this.percentControlMap.value));
            }

            if (statusMap.code === 'position') {
                this.percentControlMap = statusMap
                const percent = this._getCorrectPercent(parseInt(this.percentControlMap.value))
                this.normalAsync("windowcoverings_set", percent);
            }

            // We don't handle percent-state, we only have set value and not a seperate current position in homey
            //if (statusMap.code === 'percent_state') {
            //    // Characteristic.CurrentPosition
            //    this.positionMap = statusMap
            //    this.normalAsync(Characteristic.CurrentPosition, this._getCorrectPercent(this.positionMap.value));
            //}
        }
    }

    _getCorrectPercent(value) {
        var percent = value;
        if (this.fullySituationMap && this.fullySituationMap.value === 'fully_open') {
            return percent
        } else {
            percent = 100 - percent;
            return percent
        }
    }

    normalAsync(name, hbValue) {
        let value = hbValue / 100;
        this.log("Set windowscovering Capability " + name + " with " + value);
        this.setCapabilityValue(name, value)
            .catch(this.error);
    }

    sendCommand(name, value) {
        var param = this.getSendParam(name, value);
        this.homey.app.tuyaOpenApi.sendCommand(this.id, param).catch((error) => {
            this.error('[SET][%s] capabilities Error: %s', this.id, error);
        });
    }

    //get Command SendData
    getSendParam(name, hbParam) {
        let code = this.percentControlMap.code;
        let value = this._getCorrectPercent(hbValue);
        if (code === 'position') {
            value = "" + hbParam;
        }

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

module.exports = TuyaCoverDevice;