'use strict';

const BaseDevice = require('../basedevice');

const CAPABILITIES_SET_DEBOUNCE = 1000;

class CoverDevice extends BaseDevice {

    async onInit() {
        await this.initDevice(this.getData().id);
        this.updateCapabilities();
        this.registerMultipleCapabilityListener(this.getCapabilities(), async (values, options) => { return this._onMultipleCapabilityListener(values, options); }, CAPABILITIES_SET_DEBOUNCE);
        this.log(`Legacy Tuya Cover ${this.getName()} has been initialized`);
        var options = { excerpt: `The driver for ${this.getName()} is deprecated, please switch to new driver. See community forum for details.` }
        await this.homey.notifications.createNotification(options);
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
        this.log("Cover Capabilities changed by Homey: " + JSON.stringify(valueObj));
        this.updateInprogess = true;
        try {
            if (valueObj.windowcoverings_state != null) {
                let invert = this.getSettings().invertButtons;

				if(valueObj.windowcoverings_state == "up") {
                    if (invert) {
                        await this.turn_on();
                    }
                    else {
                        await this.turn_off();
                    }
				}
				if(valueObj.windowcoverings_state == "down") {
                    if (invert) {
                        await this.turn_off();
                    }
                    else {
                        await this.turn_on();
                    }
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
    
    async stop() {
        await this.operateDevice(this.id, 'startStop', { value: '0' });
    }
}

module.exports = CoverDevice;
