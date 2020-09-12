'use strict';

const Homey = require('homey');
const BaseDevice = require('../base');

const CAPABILITIES_SET_DEBOUNCE = 1000;

class CoverDevice extends BaseDevice {

    onInit() {
        this.initDevice(this.getData().id);
        this.updateCapabilities();
        this.registerMultipleCapabilityListener(this.getCapabilities(), async (values, options) => { return this._onMultipleCapabilityListener(values, options); }, CAPABILITIES_SET_DEBOUNCE);
        this.log(`Tuya Cover ${this.getName()} has been initialized`);
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
		
		if (this.hasCapability("windowcoverings_state")) {
            this.setCapabilityValue("windowcoverings_state", this.getState())
                .catch(this.error);
        }

    }

    async _onMultipleCapabilityListener(valueObj, optsObj) {
		this.log('Capabilitylistener');
        this.log(valueObj);
        this.updateInprogess = true;
        try {
			if(valueObj.windowcoverings_state != null) {
				if(valueObj.windowcoverings_state == "up") {
					await this.turn_off();
				}
				if(valueObj.windowcoverings_state == "down") {
					await this.turn_on();
				}
				if(valueObj.windowcoverings_state == "idle") {
					await this.stop();
				}
			}
        } catch (ex) {
            console.log(ex);
            this.updateInprogess = false;
        }
    }

}

module.exports = CoverDevice;
