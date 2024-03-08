'use strict';

const TuyaBaseDriver = require('../tuyabasedriver');
const DataUtil = require('../../util/datautil');

class TuyaDinRailDriver extends TuyaBaseDriver {

    onInit() {
        this._flowTriggerbuttonPressed = this.homey.flow.getDeviceTriggerCard('buttonPressed')
            .registerRunListener((args, state) => { return Promise.resolve(args.buttonid.instanceId === state.buttonid && args.buttonstate === state.buttonstate); });
        this._flowTriggerbuttonPressed.getArgument('buttonid')
            .registerAutocompleteListener(async (query, args) => this.this._onButtonIdAutoComplete(query, args));

        this.log('Tuya din-rail driver has been initialized');
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

    orderCapabilities(capabilitiesArr, OrderedCapabilities){
        let result = [];
        for (var i=0; i < capabilitiesArr.length; i++) {
            if(capabilitiesArr[i].includes("onoff")){
                result.push(capabilitiesArr[i]);
            }
        }
        for (var capabilityName of OrderedCapabilities) {
            if(capabilitiesArr.indexOf(capabilityName) > -1){
                result.push(capabilityName);
            }
        }
        return result;
    }

    async onPairListDevices() {
        let devices = [];
        if (!this.homey.app.isConnected()) {
            throw new Error("Please configure the app first.");
        }
        else {
            let dinRails = this.get_devices_by_type("dinRail");
            for (let tuyaDevice of Object.values(dinRails)) {
                let capabilities = [];
                let capabilitiesOptions = {};
                let subcodes = DataUtil.getSubService(tuyaDevice.status);

                for (var code of subcodes) {
                    let name;
                    if (subcodes.length === 1) {
                        name = "onoff";
                    } else {
                        name = "onoff." + code;
                        capabilitiesOptions[name] = { 'title': { 'en': `Power ${code.replace('switch_', 'Switch ')}` } };
                    }
                    capabilities.push(name);
                }
                for (let func of tuyaDevice.status) {
                    if (func.code === "forward_energy_total") {
                        capabilities.push("meter_power");
                        capabilitiesOptions["meter_power"] = { 'title': { 'en': 'Energy Total' } };
                    }
                    if (func.code === "energy_daily") {
                        capabilities.push("meter_power.day");
                        capabilitiesOptions["meter_power.day"] = { 'title': { 'en': 'Energy Daily' } };
                        capabilities.push("meter_power_day_date");
                        capabilitiesOptions["meter_power_day_date"] = { 'title': { 'en': 'Energy Daily Date' } };
                    }
                    if (func.code === "energy_month") {
                        capabilities.push("meter_power.month");
                        capabilitiesOptions["meter_power.month"] = { 'title': { 'en': 'Energy Monthly' } };
                    }
                    if (func.code === "phase_a") {
                        capabilities.push("measure_current.l1");
                        capabilitiesOptions["measure_current.l1"] = { 'title': { 'en': 'Current L1' } };
                        capabilities.push("measure_voltage.l1");
                        capabilitiesOptions["measure_voltage.l1"] = { 'title': { 'en': 'Voltage L1' } }; 
                        capabilities.push("measure_power.l1");
                        capabilitiesOptions["measure_power.l1"] = { 'title': { 'en': 'Power L1' } }; 
                    }
                    if (func.code === "phase_b") {
                        capabilities.push("measure_current.l2");
                        capabilitiesOptions["measure_current.l2"] = { 'title': { 'en': 'Current L2' } };
                        capabilities.push("measure_voltage.l2");
                        capabilitiesOptions["measure_voltage.l2"] = { 'title': { 'en': 'Voltage L2' } };
                        capabilities.push("measure_power.l2");
                        capabilitiesOptions["measure_power.l2"] = { 'title': { 'en': 'Power L2' } };
                    }
                    if (func.code === "phase_c") {
                        capabilities.push("measure_current.l3");
                        capabilitiesOptions["measure_current.l3"] = { 'title': { 'en': 'Current L3' } };
                        capabilities.push("measure_voltage.l3");
                        capabilitiesOptions["measure_voltage.l3"] = { 'title': { 'en': 'Voltage L3' } };
                        capabilities.push("measure_power.l3");
                        capabilitiesOptions["measure_power.l3"] = { 'title': { 'en': 'Power L3' } };
                    }
                    if (func.code === "add_ele") {
                        capabilities.push("meter_power");
                        capabilitiesOptions["meter_power"] = { 'title': { 'en': 'Energy Total' } };
                    }
                    if (func.code === "cur_current") {
                        capabilities.push("measure_current");
                    }
                    if (func.code === "cur_voltage") {
                        capabilities.push("measure_voltage");
                    }
                    if (func.code === "cur_power") {
                        capabilities.push("measure_power");
                    }
                }

                capabilities = this.orderCapabilities(capabilities, ["meter_power", "meter_power.month", "meter_power.day", "meter_power_day_date", "measure_current.l1", "measure_current.l2", "measure_current.l3", 
                    "measure_voltage.l1", "measure_voltage.l2", "measure_voltage.l3", "measure_power.l1", "measure_power.l2", "measure_power.l3", "meter_power", "measure_current", "measure_voltage", "measure_power"
            ])
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

module.exports = TuyaDinRailDriver;
