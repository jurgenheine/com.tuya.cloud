'use strict';

const TuyaBaseDevice = require('../tuyabasedevice');
const DataUtil = require("../../util/datautil");

const CAPABILITIES_SET_DEBOUNCE = 1000;

class TuyaAirConditionerDevice extends TuyaBaseDevice {

    onInit() {
        this.initDevice(this.getData().id);
        this.updateCapabilities(this.get_deviceConfig().status);
        this.registerMultipleCapabilityListener(this.getCapabilities(), async (values, options) => {
            return this._onMultipleCapabilityListener(values, options); }, CAPABILITIES_SET_DEBOUNCE);
        this.log(`Tuya AirConditioner ${this.getName()} has been initialized`);
    }
    _onMultipleCapabilityListener(valueObj, optsObj) {
        this.log("Air conditioner capabilities changed by Homey: " + JSON.stringify(valueObj));
        try {
            if (valueObj.target_temperature != null) {
                this.set_target_temperature(valueObj.target_temperature*10);
            }
            if (valueObj.onoff != null) {
                this.set_on_off(valueObj.onoff === true || valueObj.onoff === 1);
            }
            if (valueObj.thermostat_mode_std != null) {
                this.set_thermostat_mode_std(valueObj.thermostat_mode_std);
            }
        } catch (ex) {
            this.homey.app.logToHomey(ex);
        }
    }

    //init Or refresh AccessoryService
    updateCapabilities(statusArr) {
                this.log("Update air conditioner capabilities from Tuya: " + JSON.stringify(statusArr));
        statusArr.forEach(status => {
            switch (status.code) {
                case 'switch':
                    this.normalAsync('onoff', status.value);
                    break;
                case 'temp_set':
                    this.normalAsync('target_temperature', status.value/10);
                    break;
                case 'temp_current':
                    // todo: enable this after fixing bug:
                    // Error: Invalid Capability: measure_temperature
                    // this.normalAsync('measure_temperature', status.value);
                    break;
                case 'mode':
                    this.normalAsync('thermostat_mode_std', status.value);
            }

        });
        }

    normalAsync(name, hbValue) {
        this.log("Set air conditioner Capability " + name + " with " + hbValue);
        this.setCapabilityValue(name, hbValue)
            .catch(error => console.error(error));
    }

    sendCommand(code, value) {
        var param = {
            "commands": [
                {
                    "code": code,
                    "value": value
                }
            ]
        }
        this.homey.app.tuyaOpenApi.sendCommand(this.id, param).catch((error) => {
            this.error('[SET][%s] capabilities Error: %s', this.id, error);
        });
    }

    set_on_off(onoff) {
        this.sendCommand("switch", onoff);
    }

    set_thermostat_mode_std(mode) {
        this.sendCommand("mode", mode);
    }

    set_target_temperature(targetTemperature) {
        this.sendCommand("temp_set", targetTemperature);
    }
}

module.exports = TuyaAirConditionerDevice;
