'use strict';

const TuyaBaseDriver = require('../tuyabasedriver');

class TuyaEnergyMeterDriver extends TuyaBaseDriver {

    onInit() {
        this.log('Tuya energy meter driver has been initialized');
    }

    async onPairListDevices() {
        let devices = [];
        if (!this.homey.app.isConnected()) {
            throw new Error("Please configure the app first.");
        }
        else {
            let energyMeters = this.get_devices_by_type("energyMeter");
            for (let tuyaDevice of Object.values(energyMeters)) {
                let capabilities = [];
                let capabilitiesOptions = {};

                capabilities.push("measure_power");
                if (!this.isMultiPhaseDevice(tuyaDevice.status)) {
                    capabilities.push("measure_current");
                    capabilities.push("measure_voltage");
                }
                else {
                    for (var statusMap of tuyaDevice.status) {
                        switch (statusMap.code) {
                            case "phase_a":
                                capabilities.push("measure_power.l1");
                                capabilities.push("measure_current.l1");
                                capabilities.push("measure_voltage.l1");
                                break;
                            case "phase_b":
                                capabilities.push("measure_power.l2");
                                capabilities.push("measure_current.l2");
                                capabilities.push("measure_voltage.l2");
                                break;
                            case "phase_c":
                                capabilities.push("measure_power.l3");
                                capabilities.push("measure_current.l3");
                                capabilities.push("measure_voltage.l3");
                                break;
                        }
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

    isMultiPhaseDevice(statusArr) {
        for (var statusMap of statusArr) {
            if (statusMap.code === 'phase_b' || statusMap.code === 'phase_c') {
                return true;
            }
        }

        return false;
    }
}

module.exports = TuyaEnergyMeterDriver;