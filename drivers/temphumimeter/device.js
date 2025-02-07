'use strict';

const TuyaBaseDevice = require('../tuyabasedevice');

class TempHumidDevice extends TuyaBaseDevice {

  onInit() {
    this.initDevice(this.getData().id);
    this.setDeviceConfig(this.get_deviceConfig());
    this.log(`Tuya presence ${this.getName()} has been initialized`);
  }

  setDeviceConfig(deviceConfig) {
    if (deviceConfig != null) {
      this.log("set presence device config: " + JSON.stringify(deviceConfig));
      let statusArr = deviceConfig.status ? deviceConfig.status : [];
      this.updateCapabilities(statusArr);
    }
    else {
      this.homey.log("No device config found");
    }
  }

  //init Or refresh AccessoryService
  updateCapabilities(statusArr) {
    this.log("Update temphumid capabilities from Tuya: " + JSON.stringify(statusArr));
    statusArr.forEach(status => {
      switch (status.code) {
        case 'va_temperature':
          this.setCapabilityValue('measure_temperature', status.value / 10);
          break;
        case 'va_humidity':
          this.setCapabilityValue('measure_humidity', status.value / 10);
            break;
        case 'battery_percentage':
          this.batteryStatus = status;
          this.setCapabilityValue("measure_battery", this.batteryStatus.value).catch(this.error);
          break;
        case 'battery_state':
          this.batteryStatus = status;
          var rawStatus = this.batteryStatus.value;
          switch (rawStatus) {
            case "low":
              this.setCapabilityValue("measure_battery", 10).catch(this.error);
              break;
            case "middle":
              this.setCapabilityValue("measure_battery", 50).catch(this.error);
              break;
            case "high":
              this.setCapabilityValue("measure_battery", 100).catch(this.error);
              break;
            default:
              break;
          }
          break;
      }
    });
  }
}

module.exports = TempHumidDevice;