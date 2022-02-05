'use strict';

const Homey = require('homey');
const TuyaApi = require("./lib/cloudtuya");
const TuyaSHOpenAPI = require("./lib/tuyashopenapi");
const TuyaOpenMQ = require("./lib/tuyamqttapi");
const Colormapping = require("./util/colormapping");
const LogUtil = require("./util/logutil");
const TuyaBaseDriver = require("./drivers/tuyabasedriver");

class TuyaCloudApp extends Homey.App {

    onInit() {
        this.logger = new LogUtil(this.log, true);
        this.oldclient = TuyaApi;
        this.colormapping = new Colormapping();
        this.initialized = false;
        this._oldconnected = false;
        this._connected = false;

        this.initDrivers();

        (async () => { await this.connectToTuyaApi(); })();

        this.logToHomey(`Tuya cloud App has been initialized`);
        this.initialized = true;
    }

    initDrivers() {
        this._oldhomeyCoverDriver = Homey.ManagerDrivers.getDriver('cover');
        this._oldhomeyLightDriver = Homey.ManagerDrivers.getDriver('light');
        this._oldhomeySwitchDriver = Homey.ManagerDrivers.getDriver('switch');
        //this._homeyCoverDriver = Homey.ManagerDrivers.getDriver('tuyacover');
        this._homeyLightDriver = Homey.ManagerDrivers.getDriver('tuyalight');
        this._homeySwitchDriver = Homey.ManagerDrivers.getDriver('tuyaswitch');
        this._homeySocketDriver = Homey.ManagerDrivers.getDriver('tuyasocket');
    }

    async connectToTuyaApi() {
        let apiToUse = Homey.ManagerSettings.get('apiToUse');
        if (apiToUse != null && apiToUse !== 'legacy') {
            this.UseOfficialApi = true;
            await this.initTuyaSDK();
            new Homey.FlowCardAction('setTuyaScene')
                .register()
                .registerRunListener(this._onFlowActionSetTuyaScene.bind(this))
                .getArgument('scene')
                .registerAutocompleteListener(this._onTuyaSceneAutoComplete.bind(this));
        }

        if (apiToUse == null || apiToUse !== 'official') {
            this.UseLegacyApi = true;
            await this.connect();
            new Homey.FlowCardAction('setScene')
                .register()
                .registerRunListener(this._onFlowActionSetScene.bind(this))
                .getArgument('scene')
                .registerAutocompleteListener(this._onSceneAutoComplete.bind(this));
        }
    }

    async initTuyaSDK() {
        let appid = Homey.ManagerSettings.get('appid');
        let appsecret = Homey.ManagerSettings.get('appsecret');
        let username = Homey.ManagerSettings.get('username');
        let password = Homey.ManagerSettings.get('password');
        let countrycode = Homey.ManagerSettings.get('countrycode');
        let biz = Homey.ManagerSettings.get('biztype') === 'smart_life' ? 'smartlife' : 'tuyaSmart';

        this.tuyaOpenApi =  new TuyaSHOpenAPI( appid, appsecret, username, password, countrycode, biz, this.logger);

        try {
            this.devices = await this.tuyaOpenApi.getDevices();
        } catch (e) {
            this.logger.log('Failed to get device information.');
            return;
        }
        this.setAllDeviceConfigs();
        try {
            this.scenes = await this.tuyaOpenApi.getScenes();
        } catch (e) {
            this.logger.log(e);
            return;
        }

        let mq = new TuyaOpenMQ(this.tuyaOpenApi, "1.0", this.logger);
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

    //refresh Accessorie status
    setAllDeviceConfigs() {
        for (let device of this.devices) {
            let type = TuyaBaseDriver.get_type_by_category(device.category);
            let driver = this.getTypeDriver(type);
            if (driver != null) {
                this.setDeviceConfig(driver, device);
            }
            this.logToHomey(`${device.name} updated`);
        }
    }

    setDeviceConfig(driver, device) {
        console.log("Get device for: " + device.id);
        let homeyDevice = driver.getDevice({ id: device.id });
        if (homeyDevice instanceof Error) return;
        console.log("Device found");
        homeyDevice.setDeviceConfig(device);
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
        if (this.devices != null) {
            for (let device of this.devices) {
                if (device.id === devId) {
                    return device;
                }
            }
        }
        return null;
    }

    //refresh Accessorie status
    async refreshDeviceStates(message) {
        let device = this.get_device_by_devid(message.devId);
        let type = TuyaBaseDriver.get_type_by_category(device.category);
        let driver = this.getTypeDriver(type);
        if (driver != null) {
            this.updateCapabilities(driver, message.devId, message.status);
        }
    }

    getTypeDriver(type) {
        switch (type) {
            case 'light':
                return this._homeyLightDriver;
            case 'socket':
                return this._homeySocketDriver;
            case 'switch':
                return this._homeySwitchDriver;
            case 'cover':
                return this._homeyCoverDriver;
            case 'airPurifier':
                break;
            case 'fan':
                break;
            case 'smokeSensor':
                break;
            case 'heater':
                break;
            case 'garageDoorOpener':
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
        return null;
    }

    updateCapabilities(driver, devId, status) {
        this.logToHomey("Get device for: " + devId);
        let homeyDevice = driver.getDevice({ id: devId });
        if (homeyDevice instanceof Error) return;
        this.logToHomey("Device found");
        homeyDevice.updateCapabilities(status);
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
        this.logToHomey("Get legacy device for: " + tuyaDevice.id);
        let homeyDevice = driver.getDevice({ id: tuyaDevice.id });
        if (homeyDevice instanceof Error) return;
        this.logToHomey("Legacy device found");
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
        let scenes = await this.oldclient.get_devices_by_type('scene');
        return Object.values(scenes).map(s => {
            return { instanceId: s.id, name: s.name };
        });
    }

    _onFlowActionSetTuyaScene(args) {
        try {
            return this.tuyaOpenApi.executeScene(args.scene.instanceId);
        } catch (ex) {
            this.logToHomey(ex);
        }
    }

    async _onTuyaSceneAutoComplete(query, args) {
        return this.scenes.map(s => {
            return { instanceId: s.scene_id, name: s.name };
        });
    }

    logToHomey(data) {
        this.logger.log(data);
    }
}
module.exports = TuyaCloudApp;
