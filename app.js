'use strict';

const Homey = require('homey');
const TuyaApi = require("./lib/cloudtuya");
const TuyaSHOpenAPI = require("./lib/tuyashopenapi");
const TuyaOpenMQ = require("./lib/tuyamqttapi");
const Colormapping = require("./util/colormapping");
const LogUtil = require("./util/logutil");
const TuyaBaseDriver = require("./drivers/tuyabasedriver");

class TuyaCloudApp extends Homey.App {

    async onInit() {
        this.logger = new LogUtil(this.log, this.error, true);
        this.oldclient = TuyaApi;
        this.colormapping = new Colormapping();
        this.initialized = false;
        this._oldconnected = false;
        this._connected = false;

        try {
            await this.connectToTuyaApi();
        } catch (err) {
            console.error(err.message);
        }

        this.log(`Tuya cloud App has been initialized`);
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
                var options = {excerpt:`You are still using the old deprecated API and drivers, please switch to new drivers only. See community forum for details. https://community.homey.app/t/app-pro-tuya-cloud/21313` }
                await this.homey.notifications.createNotification(options);
        }

        if (apiToUse != null && apiToUse !== 'legacy') {
            this.UseOfficialApi = true;
            await this.initTuyaSDK();

            await this.registerFlows();
        }
    }

    async registerFlows() {
        this.homey.flow.getActionCard('setTuyaScene')
            .registerRunListener(async (args) => this._onFlowActionSetTuyaScene(args))
            .getArgument('scene')
            .registerAutocompleteListener(async (query, args) => this._onTuyaSceneAutoComplete(query, args));
        this.homey.flow.getActionCard('sendTuyaTextCommand')
            .registerRunListener(async (args) => this._onFlowActionSendTuyaCommand(args));
        this.homey.flow.getActionCard('sendTuyaNumberCommand')
            .registerRunListener(async (args) => this._onFlowActionSendTuyaCommand(args));
        this.homey.flow.getActionCard('sendTuyaFalseCommand')
            .registerRunListener(async (args) => this._onFlowActionSendFalseTuyaCommand(args));
        this.homey.flow.getActionCard('sendTuyaTrueCommand')
            .registerRunListener(async (args) => this._onFlowActionSendTrueTuyaCommand(args));
        this.tuyaTextMessagetrigger = this.homey.flow.getTriggerCard("tuyaTextMesage");
        this.tuyaNumberMessagetrigger = this.homey.flow.getTriggerCard("tuyaNumberMesage");
        this.tuyaBoolMessagetrigger = this.homey.flow.getTriggerCard("tuyaBoolMesage");
        this.targetTempCondition = this.homey.flow.getConditionCard("targetTemperature")
            .registerRunListener(async (args, state) => {
                return (args.device.getCapabilityValue('target_temperature') > args.target_temperature);
        })
        this.measureTempCondition = this.homey.flow.getConditionCard("measureTemperature")
            .registerRunListener(async (args, state) => {
                return (args.device.getCapabilityValue('measure_temperature') > args.measure_temperature);
        })
        this.measureTempCondition = this.homey.flow.getConditionCard("thermostatHeaterMode")
            .registerRunListener(async (args, state) => {
                return (args.device.getCapabilityValue('thermostat_heater_mode') == args.mode);
        })
        this.homey.flow.getActionCard('setThermostatHeaterMode')
            .registerRunListener(async (args) => args.device.set_thermostat_mode(args.mode));
      
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
            this.error('Failed to get device information.');
            return;
        }
        try {
            this.scenes = await this.tuyaOpenApi.getScenes();
        } catch (e) {
            this.error(e);
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

    async refreshScenes() {
        this.log("Refresh scenes");
        this.scenes = await this.tuyaOpenApi.getScenes();
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
        this.log("Start connection to cloud.");
        await this.oldclient.connect();
        this.log("Connected to cloud.");
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
                this.log(message.devId + ' removed');
                // TODO: remove from devices list or rebuild device array
            } else if (message.bizCode === 'bindUser') {
                let deviceInfo = await this.tuyaOpenApi.getDeviceInfo(message.bizData.devId);
                let functions = await this.tuyaOpenApi.getDeviceFunctions(message.bizData.devId);
                if (deviceInfo != null &&functions !=null) {
                    let device = Object.assign(deviceInfo, functions);
                    this.devices.push(device);
                }
            }
        } else {
            this.refreshDeviceStates(message);
            this.triggerTuyaMessageFlow(message);
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
            this.log("No devices found");
        }
        return null;
    }

    //refresh Accessorie status
    async refreshDeviceStates(message) {
        let device = this.get_device_by_devid(message.devId);
        if (device == null) {
            return;
        }
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
                return this.homey.drivers.getDriver('tuyacover');
            case 'pir':
                return this.homey.drivers.getDriver('tuyapir');
            case 'airConditioner':
                return this.homey.drivers.getDriver('air-conditioner');
            case 'airPurifier':
                break;
            case 'dehumidifier':
                return this.homey.drivers.getDriver('dehumidifier');
            case 'fan':
                break;
            case 'smokeSensor':
                return this.homey.drivers.getDriver('tuyasmoke');
            case 'coSensor':
                return this.homey.drivers.getDriver('tuyaco');
            case 'heater':
                return this.homey.drivers.getDriver('heater');
            case 'thermostat':
                return this.homey.drivers.getDriver('thermostat');
            case 'garageDoorOpener':
                return this.homey.drivers.getDriver('tuyagaragedooropener');
            case 'contactSensor':
                return this.homey.drivers.getDriver('tuyacontact');
                //contact sensor
            case 'leakSensor':
                return this.homey.drivers.getDriver('tuyaleak');
            case 'presenceSensor':
                return this.homey.drivers.getDriver('tuyapresence');
                //contact sensor
            default:
                break;
        }
        return null;
    }

    updateCapabilities(driver, devId, status) {
        this.log("Get device for: " + devId);
        let homeyDevice;
        try {
            homeyDevice = driver.getDevice({ id: devId });
        } catch (e) {
            // this is not an error, it just means that the device is not registered
            this.log(`device ${devId} not added to Homey`);
            return;
        }
        this.log("Device found");
        homeyDevice.updateCapabilities(status);



    }

    async triggerTuyaMessageFlow(message) {
        message.status.forEach(func => {
            if (typeof func.value === 'undefined') {
                return;
            }
            if (typeof func.value === 'boolean') {
                const booltokens = {
                    tuyaDeviceId: message.devId,
                    functionname: func.code,
                    functionValue: func.value
                };

                this.tuyaBoolMessagetrigger
                    .trigger(booltokens)
                    .catch(this.error);
            }
            if (typeof func.value == 'number') {
                const numtokens = {
                    tuyaDeviceId: message.devId,
                    functionname: func.code,
                    functionValue: func.value
                };
                this.tuyaNumberMessagetrigger
                    .trigger(numtokens)
                    .catch(this.error);
            }

            const tokens = {
                tuyaDeviceId: message.devId,
                functionname: func.code,
                functionValue: String(func.value)
            };
            this.tuyaTextMessagetrigger
                .trigger(tokens)
                .catch(this.error);
        });
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
            this.log(`${tuyaDevice.name} updated`);
        }
    }

    getOldTypeDriver(type) {
        try {
            if (this.initialized)
                return this.homey.drivers.getDriver(type);
            return null;
        }
        catch {
            return null;
        }
    }

    updateOldCapabilities(driver, tuyaDevice) {
        if (driver !== null && driver !== undefined) {
            this.log("Get legacy device for: " + tuyaDevice.id);
            try {
                let homeyDevice = driver.getDevice({ id: tuyaDevice.id });
                if (homeyDevice instanceof Error) return;
                this.log("Legacy device found");
                homeyDevice.updateData(tuyaDevice.data);
                homeyDevice.updateCapabilities();
            }
            catch (err) {

            }
        }
    }

    _olddeviceRemoved(acc) {
        if (acc != null)
            this.log(acc.name + ' removed');
    }

    async _onFlowActionSetScene(args) {
        try {
            return this.oldclient.device_control(args.scene.instanceId, 'turnOnOff', { value: '1' }, 'control');
        } catch (ex) {
            this.error(ex);
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
            this.error(ex);
        }
    }

    async _onFlowActionSendFalseTuyaCommand(args) {
        try {
            var param = {
                "commands": [
                    {
                        "code": args.functionname,
                        "value": false
                    }
                ]
            };
            this.tuyaOpenApi.sendCommand(args.tuyaDeviceId, param).catch((error) => {
                this.error('[SET][%s] capabilities Error: %s', args.tuyaDeviceId, error);
                throw new Error(`Error sending command: ${error}`);
            });
        } catch (ex) {
            this.error(ex);
        }
    }

    async _onFlowActionSendTrueTuyaCommand(args) {
        try {
            var param = {
                "commands": [
                    {
                        "code": args.functionname,
                        "value": true
                    }
                ]
            };
            this.tuyaOpenApi.sendCommand(args.tuyaDeviceId, param).catch((error) => {
                this.error('[SET][%s] capabilities Error: %s', args.tuyaDeviceId, error);
                throw new Error(`Error sending command: ${error}`);
            });
        } catch (ex) {
            this.error(ex);
        }
    }

    async _onFlowActionSendTuyaCommand(args) {
        try {
            var param = {
                "commands": [
                    {
                        "code": args.functionname,
                        "value": args.functionValue
                    }
                ]
            };
            this.tuyaOpenApi.sendCommand(args.tuyaDeviceId, param).catch((error) => {
                this.error('[SET][%s] capabilities Error: %s', args.tuyaDeviceId, error);
                throw new Error(`Error sending command: ${error}`);
            });
        } catch (ex) {
            this.error(ex);
        }
    }

    async _onTuyaSceneAutoComplete(query, args) {
        return this.scenes.map(s => {
            return { instanceId: s.scene_id, name: s.name };
        });
    }
}
module.exports = TuyaCloudApp;
