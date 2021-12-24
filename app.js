'use strict';

const Homey = require('homey');
const TuyaApi = require("./lib/cloudtuya");
const TuyaOpenAPI = require("./lib/tuyaopenapi");
const TuyaSHOpenAPI = require("./lib/tuyashopenapi");
const TuyaOpenMQ = require("./lib/tuyamqttapi");

const linear = require('everpolate').linear;
const Colormapping = require("./util/colormapping");
const LogUtil = require("./util/logutil");

const coverType = "cover";
const lightType = "light";
const switchType = "switch";
const socketType = "socket";

class TuyaCloudApp extends Homey.App {

    onInit() {
        initApiUssager();
        this.logger = LogUtil(this.log, true);
        this.oldclient = TuyaApi;
        this.colormapping = Colormapping;
        this.initialized = false;
        this._connected = false;

        let apiToUse = Homey.ManagerSettings.get('apiToUse');

        this._oldhomeyCoverDriver = Homey.ManagerDrivers.getDriver('old' + coverType);
        this._oldhomeyLightDriver = Homey.ManagerDrivers.getDriver('old' + lightType);
        this._oldhomeySwitchDriver = Homey.ManagerDrivers.getDriver('old' + switchType);
        this._homeyCoverDriver = Homey.ManagerDrivers.getDriver(coverType);
        this._homeyLightDriver = Homey.ManagerDrivers.getDriver(lightType);
        this._homeySwitchDriver = Homey.ManagerDrivers.getDriver(switchType);
        this._homeySocketDriver = Homey.ManagerDrivers.getDriver(socketType);

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
        this._connected = true;
        this.colormapping.setColorMap();
    }

    isConnected() {
        return this._connected;
    }
    
    async getOldLights() {
        return await this.oldclient.get_devices_by_type(lightType);
    }

    async getOldCovers() {
        return this.oldclient.get_devices_by_type(coverType);
    }

    async getOldScenes() {
        return await this.oldclient.get_devices_by_type(sceneType);
    }

    async getOldSwitches() {
        return await this.oldclient.get_devices_by_type(switchType);
    }

    operateDevice(devId, action, param = null, namespace = 'control') {
        try {
            return this.oldclient.device_control(devId, action, param, namespace);
        } catch (ex) {
            this.logToHomey(ex);
        }
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

    //refresh Accessorie status
    async refreshDeviceStates(message) {
        switch (message.category) {
            case 'kj':
                //AirPurifier
                break;
            case 'dj':
            case 'dd':
            case 'fwd':
            case 'tgq':
            case 'xdd':
            case 'dc':
            case 'tgkg':
                //lights
                this.updateCapabilities(this._homeyLightDriver, message);
                break;
            case 'cz':
            case 'pc':
                //socket
                this.updateCapabilities(this._homeySocketDriver, message);
                break;
            case 'kg':
            case 'tdq':
                //switch
                this.updateCapabilities(this._homeySwitchDriver, message);
                break;
            case 'fs':
            case 'fskg':
                //fan
                break;
            case 'ywbj':
                //smoke sensor
                break;
            case 'qn':
                //heater
                break;
            case 'ckmkzq': //garage_door_opener
                break;
            case 'cl':
                this.updateCapabilities(this._homeyCoverDriver, message);
                break;
            case 'mcs':
                //contact sensor
                break;
            case 'rqbj':
            case 'jwbj':
                //leak sensor
                break;
            default:
                break;
        }
        this.logToHomey(`${message.devId} updated`);
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

    updateCapabilities(driver,message) {
        console.log("Get device for: " + message.devId);
        let homeyDevice = driver.getDevice({ id: tuyaDevice.devId });
        if (homeyDevice instanceof Error) return;
        console.log("Device found");
        homeyDevice.updateData(message);
        homeyDevice.updateCapabilities();
    }

    _olddeviceRemoved(acc) {
        if (acc != null)
            this.logToHomey(acc.name + ' removed');
    }

    _onFlowActionSetScene(args) {
        return this.operateDevice(args.scene.instanceId, 'turnOnOff', { value: '1' });
    }

    async _onSceneAutoComplete( query, args ) {
        let scenes = await this.getOldScenes();
        return Object.values(scenes).map(s => {
            return { instanceId: s.id, name: s.name };
        });
    }

    logToHomey(data) {
        this.logger.log(data);
    }
}
module.exports = TuyaCloudApp;
