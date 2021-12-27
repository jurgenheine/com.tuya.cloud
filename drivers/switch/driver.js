'use strict';

const Homey = require('homey');
const BaseDriver = require('../basedriver');
const DataUtil = require('../../util/datautil');

class SwitchDriver extends BaseDriver {

    onInit() {
        this._flowTriggerbuttonPressed = new Homey.FlowCardTriggerDevice('buttonPressed')
            .registerRunListener((args, state) => { return Promise.resolve(args.buttonid === state.buttonid && args.buttonstate === state.buttonstate); })
            .getArgument('buttonid')
            .registerAutocompleteListener(this._onButtonIdAutoComplete.bind(this))
            .register();

        this.log('Tuya switch driver has been initialized');
    }

    async _onButtonIdAutoComplete(query, args) {
        let device = args.my_device;
        return Object.values(device.subcodes).map(s => {
            return { instanceId: s, name: s };
        });
    }

    triggerButtonPressed(device, tokens, state) {
        this._flowTriggerbuttonPressed
            .trigger(device, tokens, state)
            .then(this.log)
            .catch(this.error);
    }

    async onPairListDevices(data, callback) {
        let devices = [];
        if (!Homey.app.isConnected()) {
            callback(new Error("Please configure the app first."));
        }
        else {
            let switches = this.get_devices_by_type("switch");
            for (let tuyaDevice of Object.values(switches)) {
                let capabilities = [];
                capabilities.push("onoff");
                let subcodes = DataUtil.getSubService(tuyaDevice);
                for (var code of subcodes) {
                    capabilities.push("onoff." + code);
                }

                devices.push({
                    data: {
                        id: tuyaDevice.id
                    },
                    capabilities: capabilities,
                    name: tuyaDevice.name
                });
            }
        }
        callback(null, devices.sort(BaseDriver._compareHomeyDevice));
    }
}

module.exports = SwitchDriver;