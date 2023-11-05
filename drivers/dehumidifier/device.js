'use strict';

const TuyaBaseDevice = require('../tuyabasedevice');
const DataUtil = require("../../util/datautil");

const CAPABILITIES_SET_DEBOUNCE = 1000;

class TuyaDehumidifierDevice extends TuyaBaseDevice {
    onInit() {
        this.scale = this.getStoreValue('scale');
        if (this.scale == undefined){
            this.scale = 5;
        }
        this.initDevice(this.getData().id);
        this.updateCapabilities(this.get_deviceConfig().status);
        this.registerMultipleCapabilityListener(this.getCapabilities(), async (values, options) => {
            return this._onMultipleCapabilityListener(values, options); }, CAPABILITIES_SET_DEBOUNCE);
        this.log(`Tuya dehumidifier ${this.getName()} has been initialized`);
    }
    _onMultipleCapabilityListener(valueObj, optsObj) {
        this.log("Dehumidifier capabilities changed by Homey: " + JSON.stringify(valueObj));
        try {
            if (valueObj.onoff != null) {
                this.set_on_off(valueObj.onoff === true || valueObj.onoff === 1);
            }
            if (valueObj.dehumidifier_target_humidity != null) {
              this.set_dehumidifier_target_humidity(valueObj.dehumidifier_target_humidity);
            }
            if (valueObj.dehumidifier_fan_speed != null) {
              this.set_dehumidifier_fan_speed(valueObj.dehumidifier_fan_speed);
            }
            if (valueObj.dehumidifier_mode != null) {
              this.set_dehumidifier_mode(valueObj.dehumidifier_mode);
            }
        } catch (ex) {
            this.homey.app.logToHomey(ex);
        }
    }
    async onSettings({ oldSettings, newSettings, changedKeys }) {
        let changedSettings = Object.fromEntries(Object.entries(newSettings).filter(([key, value]) => changedKeys.includes(key)));
        this.log("Update dehumidifier device settings: " + JSON.stringify(changedSettings));
        Object.entries(changedSettings).forEach(entry => {
            const [key, value] = entry;
            this.sendCommand(key, value);
        })
    }
    //init Or refresh AccessoryService
    updateCapabilities(statusArr) {
                this.log("Update dehumidifier capabilities from Tuya: " + JSON.stringify(statusArr));
        statusArr.forEach(status => {
            switch (status.code) {
                case 'switch':
                    this.normalAsync('onoff', status.value);
                    break;
                case 'dehumidify_set_enum':
                    this.normalAsync('dehumidifier_target_humidity', status.value);
                    break;
                case 'fan_speed_enum':
                    this.normalAsync('dehumidifier_fan_speed', status.value);
                    break;
                case 'humidity_indoor':
                    this.normalAsync('measure_humidity', status.value);
                    break;
                case 'temp_indoor':
                    this.normalAsync('measure_temperature', status.value);
                    break;
                case 'mode':
                    this.normalAsync('dehumidifier_mode', status.value);
                    break;
                case 'fault':
                    switch (status.value) {
                        case 0:
                            this.normalAsync('dehumidifier_fault', "OK");
                            break;
                        case 8:
                            this.normalAsync('dehumidifier_fault', "P1");
                            break;
                        case 16:
                            this.normalAsync('dehumidifier_fault', "P2");
                            break;
                        default:
                            // Unknown how tuya is mapping these but not according to their documentation, the above are know through testing.
                            this.log("Dehumidifier fault: " + status.value);
                            this.normalAsync('dehumidifier_fault', "Unknown");
                            break;
                    }
            }
        });
    }

    normalAsync(name, hbValue) {
        this.log("Set dehumidifier Capability " + name + " with " + hbValue);
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
            throw new Error(`Error sending command: ${error}`);
        });
    }

    set_on_off(onoff) {
        this.sendCommand("switch", onoff);
    }
    set_dehumidifier_target_humidity(targetHumidity) {
        this.sendCommand("dehumidify_set_enum", targetHumidity);
    }
    set_dehumidifier_fan_speed(fanSpeed) {
        this.sendCommand("fan_speed_enum", fanSpeed);
    }
    set_dehumidifier_mode(mode) {
        this.sendCommand("mode", mode);
    }
}

module.exports = TuyaDehumidifierDevice;
