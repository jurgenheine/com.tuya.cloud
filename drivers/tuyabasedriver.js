 'use strict';

const Homey = require('homey');

class TuyaBaseDriver extends Homey.Driver {
    static categorietypes = [
        {
            "type": "light",
            "category": ['dj', 'dd', 'fwd', 'tgq', 'xdd', 'dc', 'tgkg']
        },
        {
            "type": "switch",
            "category": ['kg', 'tdq']
        },
        {
            "type": "socket",
            "category": ['cz', 'pc']
        },
        {
            "type": "cover",
            "category": ['cl']
        },
        {
            "type": "airPurifier",
            "category": ['kj']
        },
        {
            "type": "fan",
            "category": ['fs','fskg']
        },
        {
            "type": "smokeSensor",
            "category": ['ywbj']
        },
        {
            "type": "heater",
            "category": ['qn']
        },
        {
            "type": "garageDoorOpener",
            "category": ['ckmkzq']
        },
        {
            "type": "contactSensor",
            "category": ['mcs']
        },
        {
            "type": "leakSensor",
            "category": ['rqbj','jwbj']
        }
    ];

    static _compareHomeyDevice(a, b) {
        if (a.name < b.name)
            return -1;
        if (a.name > b.name)
            return 1;
        return 0;
    }

    static get_type_by_category(category) {
        for (let categorytype of Object.values(TuyaBaseDriver.categorietypes)) {
            for (let typecategory of categorytype.category) {
                if (typecategory === category) {
                    Homey.app.logger.debug(categorytype.type);
                    return categorytype.type;
                }
            }
        }
        Homey.app.logger.debug("No type found for category: " + category);
        return "";
    }

    static get_categories_by_type(type) {
        for (let categorytype of Object.values(TuyaBaseDriver.categorietypes)) {
            if (categorytype.type === type) {
                Homey.app.logger.debug(categorytype.category);
                return categorytype.category;
            }
        }
        Homey.app.logger.debug("No categories found for type: "+type);
        return [];
    }

    get_devices_by_type(type) {
        return this.get_devices_by_categories(TuyaBaseDriver.get_categories_by_type(type));
    }

    get_devices_by_categories(categories) {
        let devices = Homey.app.devices;
        let device_list = [];
        devices.forEach((device) => {
            categories.forEach((category) => {
                if (device.category === category) {
                    device_list.push(device);
                }
            });
        });
        return device_list;
    }
}

module.exports = TuyaBaseDriver;