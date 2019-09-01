'use strict';

const Homey = require('homey');
const BaseDevice = require('../base');

const CAPABILITIES_SET_DEBOUNCE = 100;

class LightDevice extends BaseDevice {

    async onInit() {
        this.initDevice(this.getData().id);
        this.updateCapabilities();
        this.registerMultipleCapabilityListener(this.getCapabilities(), this._onMultipleCapabilityListener.bind(this), CAPABILITIES_SET_DEBOUNCE);
        this.log(`Tuya Light ${this.getName()} has been initialized`);
    }

    updateCapabilities() {
        if (this.alive) {
            this.setAvailable()
                .catch(this.error);
        }
        else {
            this.setUnavailable("(temporary) unavailable")
                .catch(this.error);
        }

        if (this.hasCapability("onoff")) {
            this.setCapabilityValue("onoff", this.getCurrentState())
                .catch(this.error);
        }

        if (this.hasCapability("dim")) {
            this.setCapabilityValue("dim", this.getBrightness())
                .catch(this.error);
        }

        if (this.hasCapability("light_temperature")) {
            this.setCapabilityValue("light_temperature", this.get_color_temp())
                .catch(this.error);
        }

        if (this.hasCapability("light_hue")) {
            this.setCapabilityValue("light_hue", this.get_hue())
                .catch(this.error);
        }

        if (this.hasCapability("light_saturation")) {
            this.setCapabilityValue("light_saturation", this.get_saturation())
                .catch(this.error);
        }
    }

    async _onMultipleCapabilityListener(valueObj, optsObj) {
        Object.entries(valueObj);
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
            await this.set_color_temp(valueObj.light_temperature);
        }
        if (valueObj.light_hue != null && valueObj.light_saturation) {
            await this.set_color(valueObj.light_hue, valueObj.light_saturation);
        } else if (valueObj.light_hue) {
            await this.set_color(valueObj.light_hue, null);
        }
        else {
            await this.set_color(null, valueObj.light_saturation);
        }
        await this.update();
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

    getCurrentState() {
        return this.state;
    }

    getState() {
        return this.alive;
    }

    getBrightness() {
        return this.data.color_mode === 'colour' ?
            parseInt(this.data.color.brightness) / 100 :
            this.data.brightness / 255;
    }

    get_hue() {
        return this._get_hue() / 360;
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

    async turn_on() {
        await Homey.app.operateDevice(this.id, 'turnOnOff', { value: '1' });
        this.state = true;
    }

    async turn_off() {
        await Homey.app.operateDevice(this.id, 'turnOnOff', { value: '0' });
        this.state = false;
    }

    async set_brightness(brightness) {
        // brigthness 0-100 for color else 0-255, 10 and below is off
        const value = 10 + (this.data.color_mode === 'colour' ? brightness * 90 : brightness * 254);
        await Homey.app.operateDevice(this.id, 'brightnessSet', { value: value });
    }

    async set_color(hue, saturation) {
        //Set the color of light.
        const hsv_color = {};
        // hue 0 -360
        hsv_color.hue = hue != null ? hue * 360 : this._get_hue();
        // saturation 0-1( but status 0-100)
        hsv_color.saturation = saturation != null ? saturation : this.get_saturation();

        hsv_color.brightness = this.getBrightness() * 100;
        // color white
        if (hsv_color.saturation === 0)
            hsv_color.hue = 0;
        await Homey.app.operateDevice(this.id, 'colorSet', { color: hsv_color });
    }

    async set_color_temp(color_temp) {
        // min 1000, max 10000, range is 9000 => 1000 + color_temp * 9000
        await Homey.app.operateDevice(this.id, 'colorTemperatureSet', { value: 1000 + color_temp * 9000 });
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