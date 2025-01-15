'use strict';

const TuyaBaseDevice = require('../tuyabasedevice');
const Utils = require('./utils');

class PowerMeterDevice extends TuyaBaseDevice {

    onInit() {
        this.initDevice(this.getData().id);
        this.setDeviceConfig(this.get_deviceConfig());
        this.log(`Power meter ${this.getName()} has been initialized`);
    }

    setDeviceConfig(deviceConfig) {
        if (deviceConfig != null) {
            this.log("set power meter device config: " + JSON.stringify(deviceConfig));
            let statusArr = deviceConfig.status ? deviceConfig.status : [];
            this.updateCapabilities(statusArr);
        }
    }

    updateCapabilities(statusArr) {
        this.log("Update power meter capabilities from Tuya: " + JSON.stringify(statusArr));
        if (!statusArr) {
            return;
        }
        for (var statusMap of statusArr) {
            if (statusMap.code === 'phase_a') {
                const phaseValue = this.decodeMeterReading(statusMap.value);

                if (this.hasCapability("measure_power.l1")) this.setCapabilityValue("measure_power.l1", phaseValue.power).catch(this.error);
                else this.setCapabilityValue("measure_power", phaseValue.power).catch(this.error);

                if (this.hasCapability("measure_current")) this.setCapabilityValue("measure_current", phaseValue.current).catch(this.error);
                else this.setCapabilityValue("measure_current.l1", phaseValue.current).catch(this.error);

                if (this.hasCapability("measure_voltage")) this.setCapabilityValue("measure_voltage", phaseValue.voltage).catch(this.error);
                else this.setCapabilityValue("measure_voltage.l1", phaseValue.voltage).catch(this.error);
            }
            if (statusMap.code === 'phase_b') {
                const phaseValue = this.decodeMeterReading(statusMap.value);

                this.setCapabilityValue("measure_power.l2", phaseValue.power).catch(this.error);
                this.setCapabilityValue("measure_current.l2", phaseValue.current).catch(this.error);
                this.setCapabilityValue("measure_voltage.l2", phaseValue.voltage).catch(this.error);
            }
            if (statusMap.code === 'phase_c') {
                const phaseValue = this.decodeMeterReading(statusMap.value);

                this.setCapabilityValue("measure_power.l3", phaseValue.power).catch(this.error);
                this.setCapabilityValue("measure_current.l3", phaseValue.current).catch(this.error);
                this.setCapabilityValue("measure_voltage.l3", phaseValue.voltage).catch(this.error);
            }
        }
        
        // Multi-phase power meter, so calculate the total from the individual phases.
        if (this.hasCapability("measure_power.l1"))
        {
            let totalPower = Number(this.getCapabilityValue("measure_power.l1")) ?? 0.0;
            if (this.hasCapability("measure_power.l2")) totalPower += this.getCapabilityValue("measure_power.l2");
            if (this.hasCapability("measure_power.l3")) totalPower += this.getCapabilityValue("measure_power.l3");
            this.setCapabilityValue("measure_power", totalPower).catch(this.error);
        }
    }

    decodeMeterReading(value) {
        // Decoding value from datapoint 6 which is base64-based (manually activated)
        const valueDecoded = Buffer.from(value, 'base64');
      
        // Calculating Voltage from base64-decoded value
        const valueVoltage = Number(((valueDecoded.readUInt16BE(0)) * 0.1).toFixed(1));
      
        // Calculating Current from base64-decoded value
        const valueCurrent = Number(((valueDecoded.readUInt16BE(2 + 1)) * 0.001).toFixed(2));
      
        // Calculating Power from base64-decoded value
        const valuePower = Number(((valueDecoded.readUInt16BE(6)) * 0.001).toFixed(3));

        return {
            voltage: valueVoltage,
            current: valueCurrent,
            power: valuePower * 1000.0
        }
    }
}

module.exports = PowerMeterDevice;