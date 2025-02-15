'use strict';

const TuyaBaseDriver = require('../tuyabasedriver');

class temphumidDriver extends TuyaBaseDriver {

  onInit() {
      this.log('Tuya Temperatur/Humidity driver has been initialized');
  }

  async onPairListDevices() {
      let devices = [];
      if (!this.homey.app.isConnected()) {
          throw new Error("Please configure the app first.");
      }
      else {
          let covers = this.get_devices_by_type("temphumimeter");
          for (let tuyaDevice of Object.values(covers)) {
              let capabilities = [];
              capabilities.push("measure_temperature");
              capabilities.push("measure_humidity");
              capabilities.push("measure_battery");

              devices.push({
                  data: {
                      id: tuyaDevice.id
                  },
                  capabilities: capabilities,
                  name: tuyaDevice.name
              });

          }
      }
      return devices.sort(TuyaBaseDriver._compareHomeyDevice);
  }
}

module.exports = temphumidDriver;