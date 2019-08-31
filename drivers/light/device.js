'use strict';

const Homey = require('homey');
const BaseDevice = require('../base');

const CAPABILITIES_SET_DEBOUNCE = 100;

class MyDevice extends BaseDevice {

    onInit() {
        this.initDevice(Homey.app.get_device_by_id(this.getData().id));
        this.updateCapabilities();
        this.registerMultipleCapabilityListener(this.getCapabilities(), this._onMultipleCapabilityListener.bind(this), CAPABILITIES_SET_DEBOUNCE);
        this.log(`Tuya Light ${this.getName()} has been initialized`);
    }

    updateCapabilities(tuyaDevice) {
        if (typeof tuyaDevice !== "undefined") {
            this.updateData(device);

            if (this.alive) {
                this.setAvailable()
                    .catch(this.error);
            }
            else {
                this.setUnavailable("(temporary) unavailable")
                    .catch(this.error);
            }

            if (this.hasCapability("onoff")) {
                this.setCapabilityValue("onoff", this.getState())
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
    }

    _onMultipleCapabilityListener(valueObj, optsObj) {
        let commands = {};
        Object.entries(valueObj);
        if (valueObj.dim != null) {
            this.set_brightness(valueObj.dim);
        }
        if (valueObj.onoff != null) {
            if (valueObj.onoff === true || valueObj.onoff === 1) {
                this.turn_on();
            } else {
                this.turn_off();
            }
        }
        if (valueObj.light_temperature != null) {
            this.set_color_temp(valueObj.light_temperature);
        }
        if (valueObj.light_hue != null && valueObj.light_saturation) {
            this.set_color(valueObj.light_hue, valueObj.light_saturation);
        } else if (valueObj.light_hue) {
            this.set_color(valueObj.light_hue, null);
        }
        else {
            this.set_color(null, valueObj.light_saturation);
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
        if (this.data.brightness == null && (this.data.color==null || this.data.color.brightness==null))
            return false;
        else
            return true;
    }

    getState() {
        return this.data.state === 'true' ? true : false;
    }

    getBrightness() {
        color_mode = this.data.color_mode;
        if (work_mode === 'colour')
            brightness = parseInt(this.data.color.brightness) / 100;
        else
            brightness = this.data.brightness / 255;
        return brightness;
    }

    get_hue() {
        return this._get_hue() / 360;
    }

    get_saturation() {
        if (this.data.color == null)
            return 0.0;
        else {
            work_mode = this.data.color_mode;
            if (work_mode === 'colour') {
                color = this.data.color;
                return color.saturation / 100;
            }
            else
                return 0.0;
        }
    }

    get_color_temp() {
        // 1000 - 10000
        if (this.data.color_temp == null)
            return 0.0;
        else
            return (this.data.color_temp - 1000) / 9000;
    }

    async turn_on() {
        await Homey.app.operateDevice(this.obj_id, 'turnOnOff', { value: '1' });
    }

    async turn_off() {
        await Homey.app.operateDevice(this.obj_id, 'turnOnOff', { value: '0' });
    }

    async set_brightness(brightness) {
        color_mode = this.data.color_mode;
        // brigthness 0-100 for color else 0-255, 10 and below is off
        value = 10 + (color_mode === 'colour' ? brightness * 90 : brightness * 254);
        await Homey.app.operateDevice(this.obj_id, 'brightnessSet', { value: value });
    }

    async set_color(hue, saturation) {
        //Set the color of light.
        hsv_color = {};
        // hue 0 -360
        hsv_color.hue = hue != null ? hue * 360 : this._get_hue();
        // saturation 0-1( but status 0-100)
        hsv_color.saturation = saturation != null ? saturation : this.get_saturation();

        hsv_color.brightness = this.getBrightness() * 100;
        // color white
        if (hsv_color.saturation === 0)
            hsv_color.hue = 0;
        await Homey.app.operateDevice(this.obj_id, 'colorSet', { color: hsv_color });
    }

    async set_color_temp(color_temp) {
        // min 1000, max 10000, range is 9000 => 1000 + color_temp * 9000
        await Homey.app.operateDevice(this.obj_id, 'colorTemperatureSet', { value: 1000 + color_temp * 9000 });
    }

    _get_hue() {
        if (this.data.color == null)
            return 0.0;
        else {
            work_mode = this.data.color_mode;
            if (work_mode === 'colour') {
                color = this.data.color;
                return color.hue;
            }
            else
                return 0.0;
        }
    }
}

module.exports = MyDevice;