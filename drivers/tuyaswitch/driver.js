'use strict';

const TuyaBaseDriver = require('../tuyabasedriver');
const DataUtil = require('../../util/datautil');

class TuyaSwitchDriver extends TuyaBaseDriver {

    onInit() {
        this._flowTriggerbuttonPressed = this.homey.flow.getDeviceTriggerCard('buttonPressed')
            .registerRunListener((args, state) => { return Promise.resolve(args.buttonid.instanceId === state.buttonid && args.buttonstate === state.buttonstate); });
        this._flowTriggerbuttonPressed.getArgument('buttonid')
            .registerAutocompleteListener(async (query, args) => this.this._onButtonIdAutoComplete(query, args));

        this.log('Tuya switch driver has been initialized');
    }

    async _onButtonIdAutoComplete(query, args) {
        let subcodes = DataUtil.getSubService(args.my_device.get_deviceConfig().status);
        return subcodes.map(s => {
            return { instanceId: s, name: s };
        });
    }

    triggerButtonPressed(device, tokens, state) {
        this._flowTriggerbuttonPressed
            .trigger(device, tokens, state)
            .catch(this.error);
    }

    async onPairListDevices() {
        let devices = [];
        if (!this.homey.app.isConnected()) {
            throw new Error("Please configure the app first.");
        }
        else {
            let switches = this.get_devices_by_type("switch");
            for (let tuyaDevice of Object.values(switches)) {
                let capabilities = [];
                let capabilitiesOptions = {};
                let subcodes = DataUtil.getSubService(tuyaDevice.status);

                for (var code of subcodes) {
                    let name;
                    if (subcodes.length === 1) {
                        name = "onoff";
                    } else {
                        name = "onoff." + code;
                        capabilitiesOptions[name] = { 'title': { 'en': `Power ${code.replace('switch_', 'Socket ')}` } };
                    }
                    capabilities.push(name);
                }
                for (let func of tuyaDevice.status) {
                    if (func.code === "cur_power") {
                        capabilities.push("measure_power");
                    }
                }
                devices.push({
                    data: {
                        id: tuyaDevice.id
                    },
                    capabilities: capabilities,
                    capabilitiesOptions: capabilitiesOptions,
                    name: tuyaDevice.name
                });
            }
        }
        return devices.sort(TuyaBaseDriver._compareHomeyDevice);
    }
}

module.exports = TuyaSwitchDriver;