'use strict';

const Homey = require('homey');
const TuyaApi = require("./lib/cloudtuya");
const TuyaSHOpenAPI = require("./lib/tuyashopenapi");
const TuyaOpenMQ = require("./lib/tuyamqttapi");
const Colormapping = require("./util/colormapping");
const LogUtil = require("./util/logutil");
const BaseDriver = require("./drivers/basedriver");

class TuyaCloudApp extends Homey.App {

    onInit() {
        initApiUssager();
        this.logger = LogUtil(this.log, true);
        this.oldclient = TuyaApi;
        this.colormapping = Colormapping;
        this.initialized = false;
        this._oldconnected = false;
        this._connected = false;

        let apiToUse = Homey.ManagerSettings.get('apiToUse');

        this._oldhomeyCoverDriver = Homey.ManagerDrivers.getDriver('oldcover');
        this._oldhomeyLightDriver = Homey.ManagerDrivers.getDriver('oldlight');
        this._oldhomeySwitchDriver = Homey.ManagerDrivers.getDriver('oldswitch');
        this._homeyCoverDriver = Homey.ManagerDrivers.getDriver('cover');
        this._homeyLightDriver = Homey.ManagerDrivers.getDriver('light');
        this._homeySwitchDriver = Homey.ManagerDrivers.getDriver('switch');
        this._homeySocketDriver = Homey.ManagerDrivers.getDriver('socket');

        if (apiToUse !== 'official') {
            this.UseOfficialApi = true;
            (async () => { await this.initTuyaSDK(); })();
        }

        if (apiToUse !== 'legacy') {
            this.UseLegacyApi = true;
            (async () => { await this.connect(); })();
            new Homey.FlowCardAction('setScene')
                .register()
                .registerRunListener(this._onFlowActionSetScene.bind(this))
                .getArgument('scene')
                .registerAutocompleteListener(this._onSceneAutoComplete.bind(this));
        }

        this.logToHomey(`Tuya cloud App has been initialized`);
        this.initialized = true;
    }

    async initTuyaSDK() {
        let api = new TuyaSHOpenAPI(
            Homey.ManagerSettings.get('username'),
            Homey.ManagerSettings.get('appid'),
            Homey.ManagerSettings.get('appsecret'),
            Homey.ManagerSettings.get('password'),
            Homey.ManagerSettings.get('countrycode'),
            Homey.ManagerSettings.get('biztype') === 'smart_life' ?'smartlife':'tuyaSmart',
            this.logger,
        );
        this.tuyaOpenApi = api;

        try {
            this.devices = await api.getDevices();
        } catch (e) {
            this.logger.log('Failed to get device information. Please check if the config.json is correct.');
            return;
        }
        
        let mq = new TuyaOpenMQ(api, "1.0", this.logger);
        this.tuyaOpenMQ = mq;
        this.tuyaOpenMQ.start();
        this.tuyaOpenMQ.addMessageListener(this.onMQTTMessage.bind(this));
        this._connected = true;
    }
    
    async connect() {
        this.oldclient.init(
            Homey.ManagerSettings.get('username'),
            Homey.ManagerSettings.get('password'),
            Homey.ManagerSettings.get('countrycode'),
            Homey.ManagerSettings.get('biztype'));
        this.oldclient
            .on("device_updated", this._olddeviceUpdated.bind(this))
            .on("device_removed", this._olddeviceRemoved.bind(this));
        this.logToHomey("Start connection to cloud.");
        await this.oldclient.connect();
        this.logToHomey("Connected to cloud.");
        this._oldconnected = true;
        this.colormapping.setColorMap();
    }

    isOldConnected() {
        return this._oldconnected;
    }

    isConnected() {
        return this._connected;
    }
   
    async onMQTTMessage(message) {
        if (message.bizCode) {
            if (message.bizCode === 'delete') {
                this.logger.log(message.devId + ' removed');
                // TODO: remove from devices list or rebuild device array
            } else if (message.bizCode === 'bindUser') {
                let deviceInfo = await this.tuyaOpenApi.getDeviceInfo(message.bizData.devId);
                let functions = await this.tuyaOpenApi.getDeviceFunctions(message.bizData.devId);
                let device = Object.assign(deviceInfo, functions);
                this.devices.push(device);
            }
        } else {
            this.refreshDeviceStates(message);
        }
    }

    get_device_by_devid(devId) {
        this.devices.forEach((device) => {
            if (device.id === devId) {
                return device;
            }
        });
        return null;
    }

    //refresh Accessorie status
    async refreshDeviceStates(message) {
        let device = this.get_device_by_devid(message.devId);
        let type = BaseDriver.get_type_by_category(device.category);
        switch (type) {
            case 'airPurifier':
                break;
            case 'light':
                this.updateCapabilities(this._homeyLightDriver, message);
                break;
            case 'socket':
                this.updateCapabilities(this._homeySocketDriver, message);
                break;
            case 'switch':
                this.updateCapabilities(this._homeySwitchDriver, message);
                break;
            case 'fan':
                break;
            case 'smokeSensor':
                break;
            case 'heater':
                break;
            case 'garageDoorOpener': 
                break;
            case 'cover':
                this.updateCapabilities(this._homeyCoverDriver, message);
                break;
            case 'contactSensor':
                //contact sensor
                break;
            case 'leakSensor':
                //leak sensor
                break;
            default:
                break;
        }
        this.logToHomey(`${device.name} updated`);
    }

    updateCapabilities(driver, message) {
        console.log("Get device for: " + message.devId);
        let homeyDevice = driver.getDevice({ id: message.devId });
        if (homeyDevice instanceof Error) return;
        console.log("Device found");
        homeyDevice.updateCapabilities(message.status);
    }

    _olddeviceUpdated(tuyaDevice) {
        switch (tuyaDevice.dev_type) {
            case "cover":
                this.updateOldCapabilities(this._oldhomeyCoverDriver, tuyaDevice);
                break;
            case "light":
                this.updateOldCapabilities(this._oldhomeyLightDriver, tuyaDevice);
                break;
            case "switch":
                this.updateOldCapabilities(this._oldhomeySwitchDriver, tuyaDevice);
                break;
            default:
                break;
        }
        this.logToHomey(`${tuyaDevice.name} updated`);
    }

    updateOldCapabilities(driver, tuyaDevice) {
        console.log("Get device for: " + tuyaDevice.id);
        let homeyDevice = driver.getDevice({ id: tuyaDevice.id });
        if (homeyDevice instanceof Error) return;
        console.log("Device found");
        homeyDevice.updateData(tuyaDevice.data);
        homeyDevice.updateCapabilities();
    }

    _olddeviceRemoved(acc) {
        if (acc != null)
            this.logToHomey(acc.name + ' removed');
    }

    _onFlowActionSetScene(args) {
        try {
            return this.oldclient.device_control(args.scene.instanceId, 'turnOnOff', { value: '1' }, 'control');
        } catch (ex) {
            this.logToHomey(ex);
        }
    }

    async _onSceneAutoComplete( query, args ) {
        let scenes = await this.oldclient.get_devices_by_type('scene')();
        return Object.values(scenes).map(s => {
            return { instanceId: s.id, name: s.name };
        });
    }

    logToHomey(data) {
        this.logger.log(data);
    }
}
module.exports = TuyaCloudApp;
