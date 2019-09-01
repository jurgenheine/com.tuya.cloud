'use strict';

var request = require('request');

const REFRESHTIME = 60 * 60 * 12;
const events = require("events");

class TuayApi extends events.EventEmitter {
    constructor(username, password, countryCode, bizType) {
        super();
        if (!username || !password || !countryCode) {
            throw new Error('Missing login email/pass/country code/ application');
        } else {
            this.logindata = {
                userName: username,
                password: password,
                countryCode: countryCode,
                bizType: bizType,
                from: 'tuya'
            };
            this.session = {
                accessToken: '',
                refreshToken: '',
                expireTime: 0,
                devices: [],
                region: 'eu'
            };
            this.uri = 'https://px1.tuyaeu.com/homeassistant';
            this.connected = false;
        }
    }

    async connect() {
        if (!this.connected) {
            await this.discover_devices();
            setInterval(async () => this.discover_devices(), 30000);
            this.connected = true;
        }
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

        const result = await this._post(options);
        const tokens = JSON.parse(result);
        this.session.accessToken = tokens.access_token;
        this.session.refreshToken = tokens.refresh_token;
        this.session.expireTime = Date.now() + tokens.expires_in;
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
        if (this.session.accessToken === '' || this.session.refreshToken === '') {
            await this._get_access_token();
        }
        else if (this.session.expireTime <= REFRESHTIME + Date.now()) {
            await this._refresh_access_token();
        }
    }
    
    async _refresh_access_token() {
        const result = await this._get(this.uri + '/access.do?grant_type=refresh_token&refresh_token=' + this.session.refreshToken);
        const tokens = JSON.parse(result);
        this.session.accessToken = tokens.access_token;
        this.session.refreshToken = tokens.refresh_token;
        this.session.expireTime = Date.now() + body.expires_in;
    }

    async discover_devices() {
        console.log("Discover devices");
        const { payload: { devices } } = await this._request('Discovery', 'discovery');
        //json properties
        //data
        //id
        //ha_type
        //name
        //dev_type
        //icon
        if (devices != null) {
            this._check_devices(devices);

            this.session.devices = [];

            devices.forEach((device) => {
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

    _check_devices(devices) {
        if (this.session.devices.length > 0) {
            this.session.devices.forEach((device) => {
                const changedDevice = this._searchDevice(devices, device.id);
                if (changedDevice == null) {
                    this.emit("device_removed", device);
                } else {
                    this.emit("device_updated", device);
                } 
            });
        } else {
            devices.forEach((device) => {
                this.emit("device_updated", device);
            });
        }
    }

    get_devices_by_type(dev_type) {
        const device_list = [];
        this.session.devices.forEach((device) => {
            if (device.dev_type  === dev_type) {
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
        console.log("request input: "+ JSON.stringify(options));
        var result = await this._post(options);
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