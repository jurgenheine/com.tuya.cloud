'use strict';

var request = require('request');
const events = require("events");
const REFRESHTIME = 5000;


class TuayApi extends events.EventEmitter {
    constructor(username, password, countryCode, bizType) {
        super();
        this.lastMessage = '';
        this.connectionError = false;
        this.refreshIntervalId = null;
        if (!username || !password || !countryCode || !bizType) {
            this.connectionError = true;
            this.lastMessage = 'Missing login email/pass/country code/ application';
            throw this.lastMessage;
        } else {
            this.logindata = {
                userName: username,
                password: password,
                countryCode: countryCode,
                bizType: bizType,
                from: 'tuya'
            };
            this.initSession();
            this.uri = 'https://px1.tuyaeu.com/homeassistant';
            
        }
    }

    initSession() {
        this.session = {
            accessToken: '',
            refreshToken: '',
            expireTime: 0,
            devices: [],
            region: 'eu'
        };
    }

    async connect() {
        this.connectionError = false;
        if (this.refreshIntervalId != null)
            clearInterval(this.refreshIntervalId);
        await this.discover_devices();
        this.refreshIntervalId = setInterval(async () => this.discover_devices(), REFRESHTIME);
    }

    async _get_access_token() {
        const options = {
            url: this.uri + '/auth.do',
            method: 'POST',
            form: this.logindata,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        const resulttext = await this._post(options);
        if (resulttext == null || resulttext == "")
            this.setSessionError({ errorMsg:"No data returned"});
        const result = JSON.parse(resulttext);
        if (result.responseStatus === "error") {
            this.setSessionError(result);
        }
        this.setSessionData(result);
    }

    setSessionError(result) {
        initSession();
        this.connectionError = true;
        this.lastMessage = result.errorMsg;
        throw this.lastMessage;
    }

    setSessionData(result) {
        this.session.accessToken = result.access_token;
        this.session.refreshToken = result.refresh_token;
        this.session.expireTime = Date.now() + result.expires_in;
        const areaCode = this.session.accessToken.substring(0, 2);
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
        if (this.session.accessToken === '' || this.session.refreshToken === '') {
            await this._get_access_token();
        }
        else if (this.session.expireTime <= Date.now()) {
            await this._get_access_token();
            //await this._refresh_access_token();
        }
    }

    async _refresh_access_token() {
        const result = await this._get(this.uri + '/access.do?grant_type=refresh_token&refresh_token=' + this.session.refreshToken);
        this.session.accessToken = result.access_token;
        this.session.refreshToken = result.refresh_token;
        this.session.expireTime = Date.now() + result.expires_in;
    }

    async discover_devices() {
        console.log("Discover devices");
        const { payload: { devices } } = await this._request('Discovery', 'discovery');
        if (devices != null) {
            this.session.devices = [];

            devices.forEach((device) => {
                this.emit("device_updated", device);
                this.session.devices.push(device);
            });
        }
    }

    _searchDevice(devices, deviceid) {
        devices.forEach((device) => {
            if (device.id === deviceid)
                return device;
        });
        return null;
    }

    get_devices_by_type(dev_type) {
        const device_list = [];
        this.session.devices.forEach((device) => {
            if (device.dev_type === dev_type) {
                device_list.push(device);
            }
        });
        return device_list;
    }

    get_all_devices() {
        if (this.session.devices.length === 0)
            (async () => {
                await this.discover_devices();
            })();
        return this.session.devices;
    }

    get_device_by_id(dev_id) {
        if (this.session.devices.length === 0)
            (async () => {
                await this.discover_devices();
            })();

        this.session.devices.forEach((device) => {
            if (device.id === dev_id)
                return device;
        });
        return null;
    }

    async device_control(devId, action, param = null, namespace = 'control') {
        if (param == null) {
            param = {};
        }

        return await this._request(action, namespace, devId, param);
    }

    async _request(name, namespace, devId = null, payload = {}) {
        await this._check_access_token();
          const header = {
                name: name,
                namespace: namespace,
                payloadVersion: 1
            };

            payload.accessToken = this.session.accessToken;

            if (namespace !== 'discovery') {
                payload.devId = devId;
            }
            const data = {
                header: header,
                payload: payload
            };

            const options = {
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
        const config = (options) || {};
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
module.exports = TuayApi;