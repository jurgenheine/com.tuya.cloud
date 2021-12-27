'use strict';

const Homey = require('homey');
const BaseDevice = require('../basedevice');

const CAPABILITIES_SET_DEBOUNCE = 1000;

class LightDevice extends BaseDevice {

    onInit() {
        this.initDevice(this.getData().id);
        this.registerMultipleCapabilityListener(this.getCapabilities(), async (values, options) => { return this._onMultipleCapabilityListener(values, options); }, CAPABILITIES_SET_DEBOUNCE);
        this.log(`Tuya Light ${this.getName()} has been initialized`);
    }

    setDeviceConfig(deviceConfig) {
        let statusArr = deviceConfig.status ? deviceConfig.status : [];

        //Distinguish Tuya different devices under the same HomeBridge Service
        this.deviceCategorie = deviceConfig.category;

        //get Lightbulb dp range
        this.function_dp_range = this.getDefaultDPRange(statusArr);
        this.updateCapabilities(statusArr);
    }

    _onMultipleCapabilityListener(valueObj, optsObj) {
        console.log("set capabilities: " + JSON.stringify(valueObj));
        try {
            if (valueObj.dim != null) {
                this.set_brightness(valueObj.dim);
            }
            if (valueObj.onoff != null) {
                this.set_on_off(valueObj.onoff === true || valueObj.onoff === 1);
            }
            if (valueObj.light_temperature != null) {
                this.set_color_temp(1 - valueObj.light_temperature);
            }
            if (valueObj.light_hue != null || valueObj.light_saturation != null) {
                this.set_color(valueObj.light_hue, valueObj.light_saturation);
            }
        } catch (ex) {
            Homey.app.logToHomey(ex);
        }
    }

    //init Or refresh AccessoryService
    updateCapabilities(statusArr) {
        for (var statusMap of statusArr) {
            if (statusMap.code === 'work_mode') {
                this.workMode = statusMap;
            }
            if (statusMap.code === 'switch_led' || statusMap.code === 'switch_led_1') {
                this.switchLed = statusMap;
                this.normalAsync("onoff", this.switchLed.value);
            }
            if (statusMap.code === 'bright_value' || statusMap.code === 'bright_value_v2' || statusMap.code === 'bright_value_1') {
                this.brightValue = statusMap;
                var rawValue;
                var percentage;
                rawValue = this.brightValue.value;
                percentage = Math.floor((rawValue - this.function_dp_range.bright_range.min) * 100 / (this.function_dp_range.bright_range.max - this.function_dp_range.bright_range.min)); //    $
                this.normalAsync("dim", (percentage > 100 ? 100 : percentage) / 100);
            }
            if (statusMap.code === 'temp_value' || statusMap.code === 'temp_value_v2') {
                this.tempValue = statusMap;
                var rawValue;
                var percentage;
                rawValue = this.tempValue.value;
                percentage = Math.floor((rawValue - this.function_dp_range.temp_range.min) * 100 / (this.function_dp_range.temp_range.max - this.function_dp_range.temp_range.min)); // ra$
                this.normalAsync("light_temperature", (percentage > 100 ? 100 : percentage) / 100);
            }
            if (statusMap.code === 'colour_data' || statusMap.code === 'colour_data_v2') {
                this.colourData = statusMap;
                this.colourObj = this.colourData.value === "" ? { "h": 100.0, "s": 100.0, "v": 100.0 } : JSON.parse(this.colourData.value);

                if (!this._isHaveDPCodeOfBrightValue()) {
                    var percentage;
                    percentage = Math.floor((this.colourObj.v - this.function_dp_range.bright_range.min) * 100 / (this.function_dp_range.bright_range.max - this.function_dp_range.bright_range.min));
                    this.normalAsync("dim", (percentage > 100 ? 100 : percentage) / 100);
                }

                const hue = Math.floor(this.colourObj.h / 359 * 100); // 0-359 to 0-100
                this.normalAsync("light_hue", (hue > 100 ? 100 : hue) / 100);

                var saturation;
                saturation = Math.floor((this.colourObj.s - this.function_dp_range.saturation_range.min) * 100 / (this.function_dp_range.saturation_range.max - this.function_dp_range.saturation_range.min));  // saturation 0-100
                this.normalAsync("light_saturation", (saturation > 100 ? 100 : saturation) / 100);

            }
        }
    }

    normalAsync(name, hbValue) {
        this.setCachedState(name, hbValue);
        this.setCapabilityValue(name, hbValue)
            .catch(this.error);
    }

    sendCommand(name, value) {
        var param = getSendParam(name, value);
        Homey.app.tuyaOpenApi.sendCommand(this.id, param).then(() => {
            this.setCachedState(name, value);
        }).catch((error) => {
            this.log.error('[SET][%s] capabilities Error: %s', this.id, error);
            this.invalidateCache();
        });
    }

    // deviceConfig.functions is null, return defaultdpRange
    getDefaultDPRange(statusArr) {
        let defaultBrightRange;
        let defaultTempRange;
        let defaultSaturationRange;
        for (var statusMap of statusArr) {
            switch (statusMap.code) {
                case 'bright_value':
                    if (this.deviceCategorie === 'dj' || this.deviceCategorie === 'dc') {
                        defaultBrightRange = { 'min': 25, 'max': 255 };
                    } else if (this.deviceCategorie === 'xdd' || this.deviceCategorie === 'fwd' || this.deviceCategorie === 'tgq' || this.deviceCategorie === 'dd' || this.deviceCategorie === 'tgkg') {
                        defaultBrightRange = { 'min': 10, 'max': 1000 };
                    }
                    break;
                case 'bright_value_1':
                case 'bright_value_v2':
                    defaultBrightRange = { 'min': 10, 'max': 1000 };
                    break;
                case 'temp_value':
                    if (this.deviceCategorie === 'dj' || this.deviceCategorie === 'dc') {
                        defaultTempRange = { 'min': 0, 'max': 255 };
                    } else if (this.deviceCategorie === 'xdd' || this.deviceCategorie === 'fwd' || this.deviceCategorie === 'dd') {
                        defaultTempRange = { 'min': 0, 'max': 1000 };
                    }
                    break;
                case 'temp_value_v2':
                    defaultTempRange = { 'min': 0, 'max': 1000 };
                    break;
                case 'colour_data':
                    if (this.deviceCategorie === 'dj' || this.deviceCategorie === 'dc') {
                        defaultSaturationRange = { 'min': 0, 'max': 255 };
                        defaultBrightRange = { 'min': 25, 'max': 255 };
                    } else if (this.deviceCategorie === 'xdd' || this.deviceCategorie === 'fwd' || this.deviceCategorie === 'dd') {
                        defaultSaturationRange = { 'min': 0, 'max': 1000 };
                        defaultBrightRange = { 'min': 10, 'max': 1000 };
                    }
                    break;
                case 'colour_data_v2':
                    defaultSaturationRange = { 'min': 0, 'max': 1000 };
                    defaultBrightRange = { 'min': 10, 'max': 1000 };
                    break;
                default:
                    break;
            }
        }
        return {
            bright_range: defaultBrightRange,
            temp_range: defaultTempRange,
            saturation_range: defaultSaturationRange
        };
    }

    _isHaveDPCodeOfBrightValue() {
        const brightDic = this.statusArr.find((item, index) => { return item.code.indexOf("bright_value") != -1 });
        if (brightDic) {
            return true;
        } else {
            return false;
        }
    }

    set_on_off(onoff) {
        this.sendCommand("onoff", onoff);
    }

    set_color_temp(color_temp) {
        this.sendCommand("light_temperature", color_temp);
    }

    set_brightness(brightness) {
        this.sendCommand("dim", brightness);
    }

    set_color(hue, saturation) {
        if (saturation != null) {
            this.setCachedState("light_saturation", saturation);
        }
        if (hue != null) {
            this.sendCommand("light_hue", hue);
        }
    }

    //get Command SendData
    getSendParam(name, value) {
        var code;
        var value;
        switch (name) {
            case "onoff":
                const isOn = value ? true : false;
                code = this.switchLed.code;
                value = isOn;
                break;
            case "light_temperature":
                var temperature;
                temperature = Math.floor(value * (this.function_dp_range.temp_range.max - this.function_dp_range.temp_range.min) / 360 + this.function_dp_range.temp_range.min); // value 140~500
                code = this.tempValue.code;
                value = temperature;
                break;
            case "dim":
                {
                    var percentage;
                    percentage = Math.floor((this.function_dp_range.bright_range.max - this.function_dp_range.bright_range.min) * value + this.function_dp_range.bright_range.min); //  value 0~100
                    if ((!this.workMode || this.workMode.value === 'white' || this.workMode.value === 'light_white') && this._isHaveDPCodeOfBrightValue()) {
                        code = this.brightValue.code;
                        value = percentage;
                    } else {
                        var saturation;
                        saturation = Math.floor((this.function_dp_range.saturation_range.max - this.function_dp_range.saturation_range.min) * this.getCachedState(Characteristic.Saturation) + this.function_dp_range.saturation_range.min); // value 0~100
                        var hue = this.getCachedState(Characteristic.Hue) * 359; // 0-359
                        code = this.colourData.code;
                        value = {
                            "h": hue,
                            "s": saturation,
                            "v": percentage
                        };
                    }
                }
                break;
            case "light_hue":
                var bright;
                var saturation;
                bright = Math.floor((this.function_dp_range.bright_range.max - this.function_dp_range.bright_range.min) * this.getCachedState(Characteristic.Brightness) / 100 + this.function_dp_range.bright_range.min); //  value 0~100
                saturation = Math.floor((this.function_dp_range.saturation_range.max - this.function_dp_range.saturation_range.min) * this.getCachedState(Characteristic.Saturation) / 100 + this.function_dp_range.saturation_range.min);// value 0~100
                code = this.colourData.code;
                value = {
                    "h": value,
                    "s": saturation,
                    "v": bright
                };
                break;
            default:
                break;
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

module.exports = LightDevice;