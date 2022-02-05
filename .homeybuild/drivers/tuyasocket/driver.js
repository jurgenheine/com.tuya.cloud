'use strict';

const Homey = require('homey');
const TuyaBaseDriver = require('../tuyabasedriver');
const DataUtil = require('../../util/datautil');

class TuyaSocketDriver extends TuyaBaseDriver {

    onInit() {
        this._flowTriggerSocketChanged = new Homey.FlowCardTriggerDevice('socketChanged')
            .register()
            .registerRunListener((args, state) => { return Promise.resolve(args.socketid.instanceId === state.socketid && args.state === state.state); });
        this._flowTriggerSocketChanged.getArgument('socketid')
            .registerAutocompleteListener(this._onSocketIdTriggerAutoComplete.bind(this));
            

        this._flowSetSocket = new Homey.FlowCardAction('setSocket')
            .registerRunListener((args, state) => {
                this.log(`Flow set capability ${args.socketid.instanceId} to ${args.state}`);
                return args.my_device.setCapabilityValue(args.socketid.instanceId, args.state === "On" ? true : false).catch(this.error);
            })
            .register();
        this._flowSetSocket.getArgument('socketid')
            .registerAutocompleteListener(this._onSocketIdAutoComplete.bind(this));

        this._flowIsSocketOnOff = new Homey.FlowCardCondition('isSocketOnOff')
            .registerRunListener((args, state) => {
                this.log(`Flow check capability: ${args.socketid.instanceId}`);
                return args.my_device.getCapabilityValue(args.socketid.instanceId);
            })
            .register();
        this._flowIsSocketOnOff.getArgument('socketid')
            .registerAutocompleteListener(this._onSocketIdAutoComplete.bind(this));

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
            .then(this.log)
            .catch(this.error);
    }

    async onPairListDevices(data, callback) {
        let devices = [];
        if (!Homey.app.isConnected()) {
            callback(new Error("Please configure the app first."));
        }
        else {
            let sockets = this.get_devices_by_type("socket");
            for (let tuyaDevice of Object.values(sockets)) {
                let capabilities = [];
                let subcodes = DataUtil.getSubService(tuyaDevice.status);
                
                for (var code of subcodes) {
                    let name;
                    if (subcodes.length === 1) {
                        name = "onoff";
                    } else {
                        name = "onoff." + code;
                    }
                    capabilities.push(name);
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
        callback(null, devices.sort(TuyaBaseDriver._compareHomeyDevice));
    }
}

module.exports = TuyaSocketDriver;