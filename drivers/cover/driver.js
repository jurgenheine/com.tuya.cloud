'use strict';

const Homey = require('homey');

class CoverDriver extends Homey.Driver {

    onInit() {
        this.log('Tuya Cover Driver has been initialized');
    }

    async onPairListDevices(data, callback) {
        let devices = [];
        if (!Homey.app.isConnected()) {
            callback(new Error("Please configure the app first."));
        }
        else {
            let covers = await Homey.app.getCovers();
            for (let tuyaDevice of Object.values(covers)) {

                let capabilities = [];
				this.log("OnPairList: ");
				this.log(tuyaDevice.data);
              
				capabilities.push("windowcoverings_state");

                devices.push({
                    data: {
                        id: tuyaDevice.id
                    },
                    capabilities: capabilities,
                    name: tuyaDevice.name
                });
            }
        }
        callback(null, devices.sort(CoverDriver._compareHomeyDevice));
    }

    static _compareHomeyDevice(a, b) {
        if (a.name < b.name)
            return -1;
        if (a.name > b.name)
            return 1;
        return 0;
    }

}

module.exports = CoverDriver;
