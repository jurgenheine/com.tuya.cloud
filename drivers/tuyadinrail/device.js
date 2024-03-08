'use strict';

const TuyaBaseDevice = require('../tuyabasedevice');
const DataUtil = require('../../util/datautil');

const CAPABILITIES_SET_DEBOUNCE = 1000;

class TuyaDinRailDevice extends TuyaBaseDevice {

    onInit() {
        this.initDevice(this.getData().id);
        this.setDeviceConfig(this.get_deviceConfig());
        this.log(`Tuya din-rail ${this.getName()} has been initialized`);
    }

    setDeviceConfig(deviceConfig) {
        if (deviceConfig != null) {
            this.log("set din-rail device config: " + JSON.stringify(deviceConfig));
            let statusArr = deviceConfig.status ? deviceConfig.status : [];
            let capabilities = this.getCustomCapabilities(DataUtil.getSubService(statusArr));
            this.updateCapabilities(statusArr);
            this.registerMultipleCapabilityListener(capabilities, async (values, options) => { return this._onMultipleCapabilityListener(values, options); }, CAPABILITIES_SET_DEBOUNCE);
        }
    }

    getCustomCapabilities(subcodes) {
        var capabilties = [];
        for (var code of subcodes) {
            let name;
            if (subcodes.length === 1) {
                name = "onoff";
                this.multiswitch = false;
            }
            else {
                name = "onoff." + code;
                this.multiswitch = true;
            }
            capabilties.push(name);
        }
        return capabilties;
    }

    _onMultipleCapabilityListener(valueObj, optsObj) {
        this.log("Din-rail Capabilities changed by Homey: " + JSON.stringify(valueObj));
        try {
            for (let key of Object.keys(valueObj)) {
                let value = valueObj[key];
                this.sendCommand(key, value);
            }
        } catch (ex) {
            this.homey.error(ex);
        }
    }

    updateCapabilities(statusArr) {
        this.log("Update din-rail capabilities from Tuya: " + JSON.stringify(statusArr));
        if (!statusArr) {
            return;
        }
        let subcodes = DataUtil.getSubService(statusArr);
        for (var subType of subcodes) {
            var status = statusArr.find(item => item.code === subType);
            if (!status) {
                continue;
            }
            let name;
            var value = status.value;
            if (!this.multiswitch) {
                name = "onoff";
                this.switchValue = status;
            }
            else {
                name = "onoff." + subType;
            }
            this.log(`Set din-rail capability ${name} with value ${value}`);
            this.setCapabilityValue(name, value).catch(this.error);
            this.triggerButtonPressed(subType, value);
        }
        for (var statusMap of statusArr) {
            if (statusMap.code === 'forward_energy_total') {
                this.setCapabilityValue("meter_power", statusMap.value / 100).catch(this.error);
            }

            if (statusMap.code === 'energy_daily') {
                let energyDaily = JSON.parse(statusMap.value);
                this.setCapabilityValue("meter_power.day", energyDaily.electricTotal).catch(this.error);
                this.setCapabilityValue("meter_power_day_date", energyDaily.startDay + '-' + energyDaily.startMonth).catch(this.error);
            }
            if (statusMap.code === 'energy_month') {
                let energyMonth = JSON.parse(statusMap.value);
                this.setCapabilityValue("meter_power.month", energyMonth.electricTotal).catch(this.error);
            }        
            if (statusMap.code === 'phase_a') {
                let phase1 = JSON.parse(statusMap.value);
                this.setCapabilityValue("measure_current.l1", phase1.electricCurrent).catch(this.error);
                this.setCapabilityValue("measure_voltage.l1", phase1.voltage).catch(this.error);
                this.setCapabilityValue("measure_power.l1", phase1.power * 1000).catch(this.error);
            }
            if (statusMap.code === 'phase_b') {
                let phase2 = JSON.parse(statusMap.value);
                this.setCapabilityValue("measure_current.l2", phase2.electricCurrent).catch(this.error);
                this.setCapabilityValue("measure_voltage.l2", phase2.voltage).catch(this.error);
                this.setCapabilityValue("measure_power.l2", phase2.power * 1000).catch(this.error);
            }
            if (statusMap.code === 'phase_c') {
                let phase3 = JSON.parse(statusMap.value);
                this.setCapabilityValue("measure_current.l3", phase3.electricCurrent).catch(this.error);
                this.setCapabilityValue("measure_voltage.l3", phase3.voltage).catch(this.error);
                this.setCapabilityValue("measure_power.l3", phase3.power * 1000).catch(this.error);
            }
            if (statusMap.code === 'add_ele') {
                this.setCapabilityValue("meter_power", statusMap.value/1000).catch(this.error);
            }
            if (statusMap.code === 'cur_current') {
                this.setCapabilityValue("measure_current", statusMap.value/1000).catch(this.error);
            }
            if (statusMap.code === 'cur_voltage') {
                 this.setCapabilityValue("measure_voltage", statusMap.value/10).catch(this.error);
            }
            if (statusMap.code === 'cur_power') {
                 this.setCapabilityValue("measure_power", statusMap.value).catch(this.error);
            }
        }
    }

    triggerButtonPressed(name, value) {
        let tokens = {};
        let state = {
            buttonid: name,
            buttonstate: value ? "On" : "Off"
        };
        this.driver.triggerButtonPressed(this, tokens, state);
    }

    sendCommand(name, value) {
        var param = this.getSendParam(name, value);
        this.homey.app.tuyaOpenApi.sendCommand(this.id, param).catch((error) => {
            this.log.error('[SET][%s] capabilities Error: %s', this.id, error);
            throw new Error(`Error sending command: ${error}`);
        });
    }

    //get Command SendData
    getSendParam(name, value) {
        var code;
        const isOn = value ? true : false;
        if (name.indexOf(".") === -1) {
            code = this.switchValue.code;
        } else {
            code = name.split('.')[1];
        }
        value = isOn;
        this.log("update Tuya din-rail code " + code + ": " + JSON.stringify(value));
        return {
            "commands": [
                {
                    "code": code,
                    "value": value
                }
            ]
        };
    }
}

module.exports = TuyaDinRailDevice;