'use strict';

var request = require('request');
const events = require("events");
const REFRESHTIME = 905000;
const AUTHREFRESHTIME = 65000;


class TuayApi extends events.EventEmitter {
    constructor() {
        super();
        this.lastMessage = 'Not Initialized';
        this.connectionError = true;
        this.refreshIntervalId = null;
        this.deviceCache = [];
        this.initSession();
        this.uri = 'https://px1.tuyaeu.com/homeassistant';
    }

    init(username, password, countryCode, bizType) {
        this.initSession();
        if (!username || !password || !countryCode || !bizType) {
            this.connectionError = true;
            this.lastMessage = 'Missing login name, password, country code and/or application';
            throw this.lastMessage;
        } else {
            this.connectionError = false;
            this.initSession();
            this.logindata = {
                userName: username,
                password: password,
                countryCode: countryCode,
                bizType: bizType,
                from: 'tuya'
            };
        }
    }

    initSession() {
        this.session = {
            accessToken: '',
            refreshToken: '',
            expireTime: 0,
            region: 'eu',
            lastCall: null
        };
    }

    async connect() {
        this.connectionError = false;
        if (this.refreshIntervalId != null)
            clearInterval(this.refreshIntervalId);
        await this.discover_devices();
        this.refreshIntervalId = setInterval(async () => await this.resync(), REFRESHTIME);
    }

    async resync() {
        if (this.logindata !== null) {
            this.connectionError = false;
            await this.discover_devices();
        }
    }

    async _get_access_token() {
        let options = {
            url: this.uri + '/auth.do',
            method: 'POST',
            form: this.logindata,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        let resulttext = await this._post(options);
        if (resulttext == null || resulttext == "")
            this.setSessionError({ errorMsg: "No data returned" });
        let result = JSON.parse(resulttext);
        if (result.responseStatus === "error") {
            this.setSessionError(result);
        }
        this.setSessionData(result);
    }

    setSessionError(result) {
        this.session.lastCall = new Date();
        this.lastMessage = result.errorMsg;
        if (!result.errorMsg.startsWith('you cannot auth exceed once')) {
            this.connectionError = true;
        }
        throw this.lastMessage;
    }

    setSessionData(result) {
        this.session.lastCall = new Date();
        this.session.accessToken = result.access_token;
        this.session.refreshToken = result.refresh_token;
        this.session.expireTime = Date.now() + result.expires_in;
        let areaCode = this.session.accessToken.substring(0, 2);
        if (areaCode === 'AY') {
            this.session.region = 'cn';
        }
        else if (areaCode === 'EU') {
            this.session.region = 'eu';
        }
        else {
            this.session.region = 'us';
        }
        this.uri = 'https://px1.tuyaeu.com/homeassistant'.replace('eu', this.session.region);
    }

    async _check_access_token() {
        if (this.connectionError)
            throw this.lastMessage;
        if (this.session.lastCall == null || (new Date() - this.session.lastCall.getTime()) > AUTHREFRESHTIME) {
            if (this.session.accessToken === '' || this.session.refreshToken === '') {
                await this._get_access_token();
            }
            else if (this.session.expireTime <= Date.now()) {
                await this._get_access_token();
                //await this._refresh_access_token();
            }
        }
    }

    async _refresh_access_token() {
        let result = await this._get(this.uri + '/access.do?grant_type=refresh_token&refresh_token=' + this.session.refreshToken);
        this.session.accessToken = result.access_token;
        this.session.refreshToken = result.refresh_token;
        this.session.expireTime = Date.now() + result.expires_in;
    }

    async discover_devices() {
        console.log("Discover devices");
        try {
            let { payload: { devices } } = await this._request('Discovery', 'discovery');
            if (devices != null) {
                devices.forEach((device) => {
                    this.emit("device_updated", device);
                });
                this.deviceCache = devices;
            }
            else {
                devices = this.deviceCache;
            }
            return devices;
        } catch (error) {
            console.error(error);
            return this.deviceCache;
        }
    }

    _searchDevice(devices, deviceid) {
        return devices.find(device => device.id === deviceid);

        // devices.forEach((device) => {
        //     if (device.id === deviceid)
        //         return device;
        // });
        // return null;
    }

    async get_devices_by_type(dev_type) {
        let devices = await this.discover_devices();
        return devices.filter( device => device.dev_type === dev_type);

        // devices.forEach((device) => {
        //     if (device.dev_type === dev_type) {
        //         device_list.push(device);
        //     }
        // });
        // return device_list;
    }

    async get_all_devices() {
        return await this.discover_devices();
    }

    async get_device_by_id(dev_id) {
        let devices = await this.discover_devices();
        return devices.find(device => device.id === dev_id);

        // devices.forEach((device) => {
        //     if (device.id === dev_id)
        //         return device;
        // });
        // return null;
    }

    async device_control(devId, action, param = null, namespace = 'control') {
        if (param == null) {
            param = {};
        }

        return await this._request(action, namespace, devId, param);
    }

    async _request(name, namespace, devId = null, payload = {}) {
        await this._check_access_token();
        let header = {
            name: name,
            namespace: namespace,
            payloadVersion: 1
        };

        payload.accessToken = this.session.accessToken;

        if (namespace !== 'discovery') {
            payload.devId = devId;
        }
        let data = {
            header: header,
            payload: payload
        };

        let options = {
            url: this.uri + '/skill',
            method: 'POST',
            json: data
        };
        console.log("request input: " + JSON.stringify(options));
        let result = await this._post(options);
        console.log("request output: " + JSON.stringify(result));
        return result;
    }

    async _post(options) {
        // Set to empty object if undefined
        let config = (options) || {};
        config.method = 'POST';
        return new Promise((resolve, reject) => {
            request(config, (err, response, body) => {
                if (!err && response.statusCode === 200) {
                    console.log(body);
                    resolve(body);
                } else if (err) reject(err);
            });
        });
    }

    async _get(url) {
        return new Promise((resolve, reject) => {
            request.get(url, (err, response, body) => {
                if (!err && response.statusCode === 200) {
                    console.log(body);
                    resolve(body);
                } else if (err) reject(err);
            });
        });
    }
}
module.exports = new TuayApi();