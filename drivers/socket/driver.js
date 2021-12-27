'use strict';

const Homey = require('homey');
const BaseDriver = require('../basedriver');
const DataUtil = require('../../util/datautil');

class SocketDriver extends BaseDriver {

    onInit() {
        this._flowTriggerSocketChanged = new Homey.FlowCardTriggerDevice('socketChanged')
            .registerRunListener((args, state) => { return Promise.resolve(args.socketid === state.socketid && args.state === state.state); })
            .getArgument('socketid')
            .registerAutocompleteListener(this._onSocketIdAutoComplete.bind(this))
            .register();
        this.log('Tuya socket driver has been initialized');
    }

    async _onSocketIdAutoComplete(query, args) {
        let device = args.my_device;
        return Object.values(device.subcodes).map(s => {
            return { instanceId: s, name: s };
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

module.exports = SocketDriver;