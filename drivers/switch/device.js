'use strict';

const Homey = require('homey');
const BaseDevice = require('../base');

const CAPABILITIES_SET_DEBOUNCE = 1000;

class SwitchDevice extends BaseDevice {

    onInit() {
        this.initDevice(this.getData().id);
        this.updateCapabilities();
        this.registerMultipleCapabilityListener(this.getCapabilities(), async (values, options) => { return this._onMultipleCapabilityListener(values, options); }, CAPABILITIES_SET_DEBOUNCE);
        this.log(`Tuya switch ${this.getName()} has been initialized`);
    }

    updateCapabilities() {
        if (this.data != null && this.data.online) {
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
    }

    async _onMultipleCapabilityListener(valueObj, optsObj) {
        console.log("set capabilities: " + JSON.stringify(valueObj));
        this.updateInprogess = true;
        try {
            if (valueObj.onoff != null) {
                if (valueObj.onoff === true || valueObj.onoff === 1) {
                    await this.turn_on();
                } else {
                    await this.turn_off();
                }
            }
        } catch (ex) {
            Homey.app.logToHomey(ex);
            this.updateInprogess = false;
        }
    }
}

module.exports = SwitchDevice;