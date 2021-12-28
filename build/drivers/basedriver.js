 'use strict';

const Homey = require('homey');

class BaseDriver extends Homey.Driver {
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
        BaseDriver.categorietypes.forEach((categorytype) => {
            categorytype.category.forEach((typecategory) => {
                if (typecategory === category) {
                    return categorytype.type;
                }
            });
        });
        return "";
    }

    static get_categories_by_type(type) {
        BaseDriver.categorietypes.forEach((categorytype) => {
            if (categorytype.type === type) {
                return categorytype.category;
            }
        });
        return [];
    }

    get_devices_by_type(type) {
        return this.get_devices_by_categories(BaseDriver.get_categories_by_type(type));
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

module.exports = BaseDriver;