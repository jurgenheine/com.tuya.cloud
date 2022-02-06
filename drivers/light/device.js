'use strict';

const BaseDevice = require('../basedevice');

const CAPABILITIES_SET_DEBOUNCE = 1000;

class LightDevice extends BaseDevice {

    onInit() {
        this.initDevice(this.getData().id);
        this.updateCapabilities();
        this.registerMultipleCapabilityListener(this.getCapabilities(), async (values, options) => { return this._onMultipleCapabilityListener(values, options); }, CAPABILITIES_SET_DEBOUNCE);
        this.log(`Tuya Light ${this.getName()} has been initialized`);
    }

    updateCapabilities() {
        if (this.data != null && this.data.online) {
            this.setAvailable()
                .catch(this.error);
        }
        else {
            this.setUnavailable("(temporary) unavailable")
                .catch(this.error);
            return;
        }

        if (this.hasCapability("onoff")) {
            this.setCapabilityValue("onoff", this.getState())
                .catch(this.error);
        }

        if (this.hasCapability("dim")) {
            this.setCapabilityValue("dim", this.getBrightness())
                .catch(this.error);
        }

        if (this.data != null && this.data.color_mode === "colour") {
            if (this.hasCapability("light_hue")) {
                this.setCapabilityValue("light_hue", this.get_hue())
                    .catch(this.error);
            }

            if (this.hasCapability("light_saturation")) {
                this.setCapabilityValue("light_saturation", this.get_saturation())
                    .catch(this.error);
            }
        } else {
            if (this.hasCapability("light_temperature")) {
                this.setCapabilityValue("light_temperature", this.get_color_temp())
                    .catch(this.error);
            }
        }
    }

    async _onMultipleCapabilityListener(valueObj, optsObj) {
        console.log("set capabilities: " + JSON.stringify(valueObj));
        this.updateInprogess = true;
        try {
            if (valueObj.dim != null) {
                await this.set_brightness(valueObj.dim);
            }
            if (valueObj.onoff != null) {
                if (valueObj.onoff === true || valueObj.onoff === 1) {
                    await this.turn_on();
                } else {
                    await this.turn_off();
                }
            }
            if (valueObj.light_temperature != null) {
                await this.set_color_temp(1 - valueObj.light_temperature);
            }
            if (valueObj.light_hue != null && valueObj.light_saturation != null) {
                await this.set_color(valueObj.light_hue, valueObj.light_saturation);
            } else if (valueObj.light_hue != null) {
                await this.set_color(valueObj.light_hue, null);
            } else if (valueObj.light_saturation != null) {
                await this.set_color(null, valueObj.light_saturation);
            }
        } catch (ex) {
            this.homey.app.logToHomey(ex);
            this.updateInprogess = false;
        }
    }

    support_color() {
        if (this.data.color == null)
            return false;
        else
            return true;
    }

    support_color_temp() {
        if (this.data.color_temp == null)
            return false;
        else
            return true;
    }

    support_dim() {
        if (this.data.brightness == null && (this.data.color == null || this.data.color.brightness == null))
            return false;
        else
            return true;
    }

    getBrightness() {
        return this.data.color_mode === 'colour' && this.data.color != null && this.data.color.brightness != null?
            parseInt(this.data.color.brightness) / 100 :
            this.data.brightness / 255;
    }

    get_hue() {
        var input = this._get_hue();
        var value = this.homey.app.colormapping.getReverseColorMap(input) / 360;
        if (value < 0.0)
            return 0.0;
        if (value > 1.0)
            return 1.0;
        return value;
    }

    get_saturation() {
        return this.data.color == null ?
            0.0 :
            this.data.color_mode === 'colour' ?
                this.data.color.saturation / 100 :
                0.0;

    }

    get_color_temp() {
        // 1000 - 10000
        return this.data.color_temp == null ?
            0.0 :
            (this.data.color_temp - 1000) / 9000;
    }

    async set_brightness(brightness) {
        // brigthness 0-100 for color else 0-255, 10 and below is off
        let value = Math.round(10 + (this.data.color_mode === 'colour' && this.data.color != null && this.data.color.brightness != null ?
            brightness * 90 :
            brightness * 254));
        if (this.data.color_mode === 'colour' && this.data.color != null && this.data.color.brightness != null) {
            this.data.color.brightness = value;
        } else {
            this.data.brightness = value;
        }
        await this.operateDevice(this.id, 'brightnessSet', { value: value });
    }

    async set_color(hue, saturation) {
        //Set the color of light.
        let hsv_color = {};
        // hue 0 -360
        hsv_color.hue = hue != null ? Math.round(this.homey.app.colormapping.getColorMap(hue * 360)) : this._get_hue();
        // saturation 0-1( but status 0-100)
        hsv_color.saturation = saturation != null ? saturation : this.get_saturation();

        hsv_color.brightness = Math.round(this.getBrightness() * 100);
        // color white
        if (hsv_color.saturation === 0)
            hsv_color.hue = 0;
        this.data.hue = hsv_color.hue;
        this.data.saturation = hsv_color.saturation * 100;
        this.data.brightness = hsv_color.brightness;
        this.data.color_mode = "colour";
        await this.operateDevice(this.id, 'colorSet', { color: hsv_color });
    }

    async set_color_temp(color_temp) {
        // min 1000, max 10000, range is 9000 => 1000 + color_temp * 9000
        let value = Math.round(1000 + color_temp * 9000);
        this.data.color_temp = value;
        this.data.color_mode = "white";
        await this.operateDevice(this.id, 'colorTemperatureSet', { value: value });
    }

    _get_hue() {
        if (this.data.color == null)
            return 0.0;
        else {
            if (this.data.color_mode === 'colour') {
                return this.data.color.hue;
            }
            else
                return 0.0;
        }
    }
}

module.exports = LightDevice;