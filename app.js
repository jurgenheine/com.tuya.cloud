'use strict';

if (process.env.DEBUG === '1')
{
    require('inspector').open(9222, '0.0.0.0', true);
}

const Homey = require('homey');
const TuyaApi = require("./lib/cloudtuya");
const TuyaSHOpenAPI = require("./lib/tuyashopenapi");
const TuyaOpenMQ = require("./lib/tuyamqttapi");
const Colormapping = require("./util/colormapping");
const LogUtil = require("./util/logutil");
const TuyaBaseDriver = require("./drivers/tuyabasedriver");

class TuyaCloudApp extends Homey.App {

    async onInit() {
        this.logger = new LogUtil(this.log, true);
        this.oldclient = TuyaApi;
        this.colormapping = new Colormapping();
        this.initialized = false;
        this._oldconnected = false;
        this._connected = false;

        await this.connectToTuyaApi();

        this.logToHomey(`Tuya cloud App has been initialized`);
        this.initialized = true;
    }

    async connectToTuyaApi() {
        let apiToUse = this.homey.settings.get('apiToUse');

        if (apiToUse == null || apiToUse !== 'official') {
            this.UseLegacyApi = true;
            await this.connect();
            this.homey.flow.getActionCard('setScene')
                .registerRunListener(async (args) => this._onFlowActionSetScene(args))
                .getArgument('scene')
                .registerAutocompleteListener(async (query, args) => this._onSceneAutoComplete(query, args));
        }

        if (apiToUse != null && apiToUse !== 'legacy') {
            this.UseOfficialApi = true;
            await this.initTuyaSDK();

            this.homey.flow.getActionCard('setTuyaScene')
                .registerRunListener(async (args) => this._onFlowActionSetTuyaScene(args))
                .getArgument('scene')
                .registerAutocompleteListener(async (query, args) => this._onTuyaSceneAutoComplete(query, args));
        }
    }

    async initTuyaSDK() {
        let appid = this.homey.settings.get('appid');
        let appsecret = this.homey.settings.get('appsecret');
        let username = this.homey.settings.get('username');
        let password = this.homey.settings.get('password');
        let countrycode = this.homey.settings.get('countrycode');
        let biz = this.homey.settings.get('biztype') === 'smart_life' ? 'smartlife' : 'tuyaSmart';

        this.tuyaOpenApi = new TuyaSHOpenAPI(appid, appsecret, username, password, countrycode, biz, this.logger);

        try {
            this.devices = await this.tuyaOpenApi.getDevices();
        } catch (e) {
            this.logToHomey('Failed to get device information.');
            return;
        }
        try {
            this.scenes = await this.tuyaOpenApi.getScenes();
        } catch (e) {
            this.logToHomey(e);
            return;
        }

        if (this.tuyaOpenMQ) {
            this.tuyaOpenMQ.stop();
        }

        let mq = new TuyaOpenMQ(this.tuyaOpenApi, "1.0", this.logger);
        this.tuyaOpenMQ = mq;
        this.tuyaOpenMQ.start();
        this.tuyaOpenMQ.addMessageListener(this.onMQTTMessage.bind(this));
        this._connected = true;
    }

    async connect() {
        this.oldclient.init(
            this.homey.settings.get('username'),
            this.homey.settings.get('password'),
            this.homey.settings.get('countrycode'),
            this.homey.settings.get('biztype'));
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
                this.logToHomey(message.devId + ' removed');
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
        } else {
            this.logToHomey("No devices found");
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
                return this.homey.drivers.getDriver('tuyalight');
            case 'socket':
                return this.homey.drivers.getDriver('tuyasocket');
            case 'switch':
                return this.homey.drivers.getDriver('tuyaswitch');
            case 'cover':
                break;
            case 'airConditioner':
                return this.homey.drivers.getDriver('air-conditioner');
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
        let homeyDevice
        try{
            homeyDevice = driver.getDevice({ id: devId })
        }catch (e) {
            // this is not an error, it just means that the device is not registered
            console.log(`device ${devId} not added to Homey` );
            return;
        }
        this.logToHomey("Device found");
        homeyDevice.updateCapabilities(status);
    }

    _olddeviceUpdated(tuyaDevice) {
        if (this.homey.drivers !== null || this.homey.drivers !== undefined) {
            switch (tuyaDevice.dev_type) {
                case "cover":
                    this.updateOldCapabilities(this.getOldTypeDriver('cover'), tuyaDevice);
                    break;
                case "light":
                    this.updateOldCapabilities(this.getOldTypeDriver('light'), tuyaDevice);
                    break;
                case "switch":
                    this.updateOldCapabilities(this.getOldTypeDriver('switch'), tuyaDevice);
                    break;
                default:
                    break;
            }
            this.logToHomey(`${tuyaDevice.name} updated`);
        }
    }

    getOldTypeDriver(type) {
        try {
            if (this.initialized)
                return this.homey.drivers.getDriver(type);
            return null;
        }
        catch{
            return null;
        }
    }

    updateOldCapabilities(driver, tuyaDevice) {
        if (driver!== null && driver !== undefined) {
            this.logToHomey("Get legacy device for: " + tuyaDevice.id);
            try{
                let homeyDevice = driver.getDevice({ id: tuyaDevice.id });
                if (homeyDevice instanceof Error) return;
                this.logToHomey("Legacy device found");
                homeyDevice.updateData(tuyaDevice.data);
                homeyDevice.updateCapabilities();
            }
            catch(err){

            }
        }
    }

    _olddeviceRemoved(acc) {
        if (acc != null)
            this.logToHomey(acc.name + ' removed');
    }

    async _onFlowActionSetScene(args) {
        try {
            return this.oldclient.device_control(args.scene.instanceId, 'turnOnOff', { value: '1' }, 'control');
        } catch (ex) {
            this.logToHomey(ex);
        }
    }

    async _onSceneAutoComplete(query, args) {
        let scenes = await this.oldclient.get_devices_by_type('scene');
        return Object.values(scenes).map(s => {
            return { instanceId: s.id, name: s.name };
        });
    }

    async _onFlowActionSetTuyaScene(args) {
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
