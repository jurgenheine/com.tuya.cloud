'use strict';

const Homey = require('homey'),
    TuyaApi = require("./lib/cloudtuya");
const linear = require('everpolate').linear;


const climateType = "climate";
const coverType = "cover";
const fanType = "fan";
const lightType = "light";
const lockType = "lock";
const sceneType = "scene";
const switchType = "switch";

class TuyaCloudApp extends Homey.App {

    onInit() {
        this.client = TuyaApi;
        this.initialized = false;
        this._connected = false;
        //this._homeyClimateDriver = Homey.ManagerDrivers.getDriver(climateType);
        this._homeyCoverDriver = Homey.ManagerDrivers.getDriver(coverType);
        //this._homeyFanDriver = Homey.ManagerDrivers.getDriver(fanType);
        this._homeyLightDriver = Homey.ManagerDrivers.getDriver(lightType);
        //this._homeyLockDriver = Homey.ManagerDrivers.getDriver(lockType);
        this._homeySwitchDriver = Homey.ManagerDrivers.getDriver(switchType);

        (async () => {
            await this._connectCallback();
        })();
        new Homey.FlowCardAction('setScene')
            .register()
            .registerRunListener( this._onFlowActionSetScene.bind(this) )
            .getArgument('scene')
            .registerAutocompleteListener( this._onSceneAutoComplete.bind(this) );

        this.logToHomey(`Tuya cloud App has been initialized`);
        this.initialized = true;
    }

    async connect() {
        this._initTuyaClient();
        this.logToHomey("Start connection to cloud.");
        await this.client.connect();
        this.logToHomey("Connected to cloud.");
        this._connected = true;
        this.setColorMap();
    }

    setColorMap() {
        try {
            let colormap = Homey.ManagerSettings.get('huecolormap');
            if (colormap != null && colormap != "") {
                let maps = colormap.split(',');
                this.colormapinput = [];
                this.colormapoutput = [];
                maps.forEach((map) => {
                    let maparray = map.split(':');
                    if (maparray.length === 2) {
                        this.colormapinput.push(parseFloat(maparray[0]));
                        this.colormapoutput.push(parseFloat(maparray[1]));
                    }
                });
            }
        }
        catch (ex) {
            this.logToHomey(ex);
        }
    }

    getColorMap(input) {
        if (this.colormapinput != null) {
            return linear(input, this.colormapinput, this.colormapoutput);
        }
        return input;
    }

    getReverseColorMap(input) {
        if (this.colormapinput != null) {
            return linear(input, this.colormapoutput, this.colormapinput);
        }
        return input;
    }

    interpolateArray(x, input, output) {
        let value = x;
        var index = input.findIndex(n => n > x); // first value bigger then desired value
        if (index > 1) {
            value = this.interpolate(
                x,
                parseFloat(input[index - 1]),
                parseFloat(input[index]),
                parseFloat(output[index - 1]),
                parseFloat(output[index]));
        }
        return value;
    }

    interpolate(x, x0, x1, y0, y1) {
        let yrange = y1 - y0;
        let xrange = x1 - x0;
        let xoffset = x = x0;

        let value = y0 + xoffset * yrange / xrange;
        return value;
    }

    async _connectCallback() {
        try {
            await this.connect();
        } catch (err) {
            this.logToHomey(err.message);
        }
    }

    _initTuyaClient() {
        this.client.init(
            Homey.ManagerSettings.get('username'),
            Homey.ManagerSettings.get('password'),
            Homey.ManagerSettings.get('countrycode'),
            Homey.ManagerSettings.get('biztype'));
        this._setTuyaEvents();
    }

    _setTuyaEvents() {
        this.client
            .on("device_updated", this._deviceUpdated.bind(this))
            .on("device_removed", this._deviceRemoved.bind(this));
    }

    isConnected() {
        return this._connected;
    }
    
    async getLights() {
        return await this.client.get_devices_by_type(lightType);
    }

    async getClimates() {
        return await this.client.get_devices_by_type(climateType);
    }

    async getCovers() {
        return this.client.get_devices_by_type(coverType);
    }

    async getFans() {
        return await this.client.get_devices_by_type(fanType);
    }

    async getLocks() {
        return await this.client.get_devices_by_type(lockType);
    }

    async getRemotes() {
        return await this.client.get_devices_by_type(remoteType);
    }

    async getScenes() {
        return await this.client.get_devices_by_type(sceneType);
    }

    async getSwitches() {
        return await this.client.get_devices_by_type(switchType);
    }

    operateDevice(devId, action, param = null, namespace = 'control') {
        try {
            return this.client.device_control(devId, action, param, namespace);
        } catch (ex) {
            this.logToHomey(ex);
        }
    }

    _deviceUpdated(tuyaDevice) {
        switch (tuyaDevice.dev_type) {
            //case climateType:
            //    break;
            case coverType:
                this.updateCapabilities(this._homeyCoverDriver, tuyaDevice);
                break;
            //case fanType:
            //    break;
            case lightType:
                this.updateCapabilities(this._homeyLightDriver, tuyaDevice);
                break;
            //case lockType:
            //    break;
            case switchType:
                this.updateCapabilities(this._homeySwitchDriver, tuyaDevice);
                break;
            default:
                break;
        }
        this.logToHomey(`${tuyaDevice.name} updated`);
    }

    updateCapabilities(driver,tuyaDevice) {
        console.log("Get device for: " + tuyaDevice.id);
        let homeyDevice = driver.getDevice({ id: tuyaDevice.id });
        if (homeyDevice instanceof Error) return;
        console.log("Device found");
        homeyDevice.updateData(tuyaDevice.data);
        homeyDevice.updateCapabilities();
    }

    _deviceRemoved(acc) {
        if (acc != null)
            this.logToHomey(acc.name + ' removed');
    }

    _onFlowActionSetScene(args) {
        return this.operateDevice(args.scene.instanceId, 'turnOnOff', { value: '1' });
    }

    async _onSceneAutoComplete( query, args ) {
        let scenes = await this.getScenes();
        return Object.values(scenes).map(s => {
            return { instanceId: s.id, name: s.name };
        });
    }

    // Array check.
    _isArray(a) {
        return !!a && a.constructor === Array;
    }

    logToHomey(data) {
        this.log(data);
    }
}
module.exports = TuyaCloudApp;
