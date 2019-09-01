'use strict';

const   Homey                   = require('homey'),
    TuyaApi = require("./lib/cloudtuya");


const climateType = "climate";
const coverType = "cover";
const fanType = "fan";
const lightType = "light";
const lockType = "lock";
const remoteType = "remote";
const sceneType = "scene";
const switchType = "switch";

class TuyaCloudApp extends Homey.App {
    
    onInit() {
        this.initialized =false;
        this._connected = false;
        //this._homeyClimateDriver = Homey.ManagerDrivers.getDriver(climateType);
        //this._homeyCoverDriver = Homey.ManagerDrivers.getDriver(coverType);
        //this._homeyFanDriver = Homey.ManagerDrivers.getDriver(fanType);
        this._homeyLightDriver = Homey.ManagerDrivers.getDriver(lightType);
        //this._homeyLockDriver = Homey.ManagerDrivers.getDriver(lockType);
        //this._homeyRemoteDriver = Homey.ManagerDrivers.getDriver(remoteType);
        //this._homeySceneDriver = Homey.ManagerDrivers.getDriver(sceneType);
        //this._homeySwitchDriver = Homey.ManagerDrivers.getDriver(switchType);

        (async () => {
            await this._connectCallback();
        })();
        //new Homey.FlowCardAction('setScene')
        //    .register()
        //    .registerRunListener( this._onFlowActionSetScene.bind(this) )
        //    .getArgument('scene')
        //    .registerAutocompleteListener( this._onSceneAutoComplete.bind(this) );

        this._log(`Tuya cloud App has been initialized`);
        this.initialized =true;
    }

    async connect()
    {
        this._destroyTuyaClient();
        this._createNewTuyaClient();
        this._log("Connect to cloud.");
        await this.client.connect();
        this._log("Connected to cloud.");
        this._connected = true;
    }

    async _connectCallback(){
        try {
            await this.connect();
        } catch (err) {
            this._log(err.message);
        } 
    }

    _createNewTuyaClient() {
        this.client = new TuyaApi(
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

    _destroyTuyaClient() {
        this._connected = false;
        if (this.client != null) {
            this._log("Disconnect to cloud.");
            this.client =null;
            this._log("Connection to cloud disconnected.");
        }
    }

    isConnected() {
        return this._connected;
    }

    get_device_by_id(id) {
        this._log("sessionData: " + JSON.stringify(client.session));
        return this.client.get_device_by_id(id);
    }

    getLights() {
        return this.client.get_devices_by_type(lightType);
    }

    getClimates() {
        return this.client.get_devices_by_type(climateType);
    }

    getCovers() {
        return this.client.get_devices_by_type(coverType);
    }

    getFans() {
        return this.client.get_devices_by_type(fanType);
    }

    getLocks() {
        return this.client.get_devices_by_type(lockType);
    }

    getRemotes() {
        return this.client.get_devices_by_type(remoteType);
    }

    getScenes() {
        return this.client.get_devices_by_type(sceneType);
    }

    getSwitches() {
        return this.client.get_devices_by_type(switchType);
    }

    operateDevice(devId, action, param = null, namespace = 'control') {
        return this.client.device_control(devId,action,param,namespace);
    }

    _deviceUpdated(acc) {
        switch (acc.dev_type) {
            //case climateType:
            //    break;
            //case coverType:
            //    break;
            //case fanType:
            //    break;
            case lightType:
                this._homeyLightDriver.updateCapabilities(acc);
                break;
            //case lockType:
            //    break;
            //case remoteType:
            //    break;
            //case sceneType:
            //    break;
            //case switchType:
            //    break;
            default:
                break;
        }
        this._log(`${acc.name} updated`);
    }

    _deviceRemoved(acc) {
        if(acc!=null)
            this._log(acc.name + ' removed');
    }

    //todo scenes below
    //_onFlowActionSetScene( args ) {
    //    return this.operateGroup(args.group._tradfriInstanceId, { transitionTime:1, onOff:true, sceneId:args.scene.instanceId });
    //}

    //_onSceneAutoComplete( query, args ) {
    //    const scenes = this.get_device_by_id(args.group.Id);
    //    return Object.values(scenes).map(s => {
    //        return { instanceId: s.instanceId, name: s.name };
    //    });
    //}

    // Array check.
    _isArray(a) {
        return !!a && a.constructor === Array;
    }
    
    // The heart of this app. adding a log entry
    _log(data) {
        this.log(data);
    }
}
module.exports = TuyaCloudApp;
