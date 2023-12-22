 'use strict';

const Homey = require('homey');

class TuyaBaseDriver extends Homey.Driver {
    static categorietypes = [
        {
            type: "airConditioner",
            category: ["kt"]
        },
        {
            "type": "light",
            "category": ['dj', 'dd', 'fwd', 'tgq', 'xdd', 'dc', 'tgkg','sxd','tyndj','mbd']
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
            "category": ['cl','clkg']
        },
        {
            "type": "airPurifier",
            "category": ['kj', 'cs']
        },
        {
            "type": "dehumidifier",
            "category": ['cs']
        },
        {
            "type": "fan",
            "category": ['fs', 'fskg']
        },
        {
            "type": "smokeSensor",
            "category": ['ywbj']
        },
        {
            "type": "coSensor",
            "category": ['cobj']
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
            "category": ['rqbj', 'jwbj', 'sj']
        },
        {
            "type": "pir",
            "category":['pir']
        },
        {
            "type": "presenceSensor",
            "category":['hps']
        },
        {
            "type": "thermostat",
            "category":['wk']
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
                    return categorytype.type;
                }
            }
        }
        return "";
    }

    static get_categories_by_type(type) {
        for (let categorytype of Object.values(TuyaBaseDriver.categorietypes)) {
            if (categorytype.type === type) {
                return categorytype.category;
            }
        }
        return [];
    }

    get_devices_by_type(type) {
        return this.get_devices_by_categories(TuyaBaseDriver.get_categories_by_type(type));
    }

    get_devices_by_categories(categories) {
        let devices = this.homey.app.devices;
        return devices.filter( device => categories.find(category => category === device.category));
    }

    get_device_capabilities(tuyaDevice){
        let capabilities = [];
        let capabilitiesOptions = {};
        let subcodes = DataUtil.getSubService(tuyaDevice.status);
        let deviceType =TuyaBaseDriver.get_type_by_category(tuyaDevice.category);
        for (var code of subcodes) {
            let name;
            if (subcodes.length === 1) {
                name = "onoff";
            } else {
                name = "onoff." + code;
                if(deviceType ==='socket'){
                    capabilitiesOptions[name] = {'title': {'en': `Power ${code.replace('switch_', 'Socket ')}`}};
                }else{
                    capabilitiesOptions[name] = { 'title': { 'en': `Power ${code.replace('switch_', 'Switch ')}` } };
                }
            }
            capabilities.push(name);
        }

        for (let func of tuyaDevice.status) {
            switch (func.code) {
                case "bright_value":
                case "bright_value_v2":
                case "bright_value_1":
                    capabilities.push("dim");
                    break;
                case "bright_value_2":
                    capabilities.push("dim.bright_value_2");
                    capabilitiesOptions["dim.bright_value_2"] = {'title': {'en': 'Dim 2'}};
                    break;
                case "temp_value":
                case "temp_value_v2":
                    capabilities.push("light_temperature");
                    break;
                case "colour_data":
                case "colour_data_v2":
                    capabilities.push("light_hue");
                    capabilities.push("light_saturation");
                    capabilities.push("light_mode");
                    break;
                case "pir":    
                case "pir_state":
                case "presence":
                case "presence_state":
                    capabilities.push("alarm_motion");
                    break;
                case "smoke_sensor_status":    
                    capabilities.push("alarm_smoke");
                    break;
                case "doorcontact_state":    
                    capabilities.push("alarm_contact");
                    break;                    
                case "temper_alarm":    
                    capabilities.push("alarm_tamper");
                    break;
                case "battery_percentage":
                case "battery_state":
                    capabilities.push("measure_battery");
                    capabilities.push("alarm_battery");
                    break;
                case "cur_power":
                    capabilities.push("measure_power");
                    break;
                case "percent_control":
                    if(deviceType ==='cover'){
                        capabilities.push("windowcoverings_set");
                    }
                    break;
                case "percent_control_2":
                    if(deviceType ==='cover'){
                        capabilities.push("windowcoverings_set.percent_control_2");
                        capabilitiesOptions["windowcoverings_set.percent_control_2"] = {'title': {'en': 'Control 2'}};
                    }
                    break;
                case "position":
                    if(deviceType ==='cover'){
                        capabilities.push("windowcoverings_set");
                    }
                    break;                    
                case "watersensor_state":
                    capabilities.push("alarm_water");
                    break;
                default:
                    break;
            }
        }
    }
}

module.exports = TuyaBaseDriver;
