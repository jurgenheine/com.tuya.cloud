'use strict';

const TuyaBaseDriver = require('../tuyabasedriver');
const DataUtil = require('../../util/datautil');

class TuyaSocketDriver extends TuyaBaseDriver {

    onInit() {
        this._flowTriggerSocketChanged = this.homey.flow.getDeviceTriggerCard('socketChanged')
            .registerRunListener((args, state) => { return Promise.resolve(args.socketid.instanceId === state.socketid && args.state === state.state); });
        this._flowTriggerSocketChanged.getArgument('socketid')
            .registerAutocompleteListener(async (query, args) => this._onSocketIdTriggerAutoComplete(query, args));


        this._flowSetSocket = this.homey.flow.getActionCard('setSocket')
            .registerRunListener((args, state) => {
                this.log(`Flow set capability ${args.socketid.instanceId} to ${args.state}`);
                args.my_device.sendCommand(args.socketid.instanceId, args.state === "On" ? true : false);
                return args.my_device.setCapabilityValue(args.socketid.instanceId, args.state === "On" ? true : false).catch(this.error);
            });
        this._flowSetSocket.getArgument('socketid')
            .registerAutocompleteListener(async (query, args) => this._onSocketIdAutoComplete(query, args));

        this._flowIsSocketOnOff = this.homey.flow.getConditionCard('isSocketOnOff')
            .registerRunListener((args, state) => {
                this.log(`Flow check capability: ${args.socketid.instanceId}`);
                return args.my_device.getCapabilityValue(args.socketid.instanceId);
            });
        this._flowIsSocketOnOff.getArgument('socketid')
            .registerAutocompleteListener(async (query, args) => this._onSocketIdAutoComplete(query, args));

        this.log('Tuya socket driver has been initialized');
    }

    async _onSocketIdTriggerAutoComplete(query, args) {
        let subcodes = DataUtil.getSubService(args.my_device.get_deviceConfig().status);
        return subcodes.map(s => {
            return { instanceId: s, name: s };
        });
    }

    async _onSocketIdAutoComplete(query, args) {
        let subcodes = DataUtil.getSubService(args.my_device.get_deviceConfig().status);
        return subcodes.map(s => {
            let id;
            if (subcodes.length === 1) {
                id = "onoff";
            } else {
                id = "onoff." + s;
            }
            return { instanceId: id, name: s };
        });
    }

    triggerSocketChanged(device, tokens, state) {
        this._flowTriggerSocketChanged
            .trigger(device, tokens, state)
            .catch(this.error);
    }

    async onPairListDevices() {
        let devices = [];
        if (!this.homey.app.isConnected()) {
            throw new Error("Please configure the app first.");
        }
        else {
            let sockets = this.get_devices_by_type("socket");
            for (let tuyaDevice of Object.values(sockets)) {
                let capabilities = [];
                let capabilitiesOptions = {};
                let subcodes = DataUtil.getSubService(tuyaDevice.status);

                for (var code of subcodes) {
                    let name;
                    if (subcodes.length === 1) {
                        name = "onoff";
                    } else {
                        name = "onoff." + code;
                        capabilitiesOptions[name] = {'title': {'en': `Power ${code.replace('switch_', 'Socket ')}`}};
                    }
                    capabilities.push(name);
                }
                for (let func of tuyaDevice.status) {
                    if (func.code === "cur_power") {
                        capabilities.push("measure_power");
                    }
                    if (func.code === "cur_voltage") {
                        capabilities.push("measure_voltage");
                    }
                    if (func.code === "cur_current") {
                        capabilities.push("measure_current");
                    }
                    if (func.code === "add_ele") {
                        capabilities.push("meter_power");
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

module.exports = TuyaSocketDriver;