# Tuya cloud
https://homey.app/nl-nl/app/com.tuya.cloud/Tuya-cloud/

Homey App for the Tuya cloud.

This app was based on the Home Assistant implementation. Tuya has an undocumented API for Home Assistant that differs from the official API. This API supports login with credentials only with that API. The official API is also supported now. It requires an extra development account and keys. The API is also returning keys for local control, so maybe it's in the future also possible to local control devices. But commands are not yet available.

### Supported devices
* Legacy Light ( On/Off, some devices brightness and color)
* Legacy Switch( On/Off)
* Legacy Cover
* Light
* Switch
* Socket

The official API( non legacy devices) is using push messages, so changes to devices should be direct visible, so no more 10 minutes waiting for updates.

**Color settings are not supported for all legacy devices, if it's not working for your light, it's not supported by legacy API. The new light devices have better support, but it's still possible that your device is not supported yet.**

Only when device is supported by API, it's possible to add the device to this app. because I don't own all device types, it's hard to implement a device type which I don't own. Contributions to code are welkom to add unsupported devices.

### Scenes
This app support the use of scenes. In the mobile Tuya/Smart life app you can make 'Tap to run' actions( In the past they where called scenes). Those actions can be called in a flow from this app.

## Setup Homey for legacy devices and API

1. Go to the setup page in mobile app or develloper portal
2. Set Username, Password and CountryCode These are the same as with first login of the mobile app
    **It won't work with linked Cloud accounts like Google, Facebook or other**
3. Set Business. This is Smart life or Tuya and corespondents with mobile app you use

The colormap can be leaved empty. this is experimental and is used to correct the colors between Homey and the lights. It also only works for legacy lights and not for the new device types. If you want to use it, it has the flowing format:

```
HomeyHueValue1:TuyaHueValue1,HomeyHueValue2:TuyaHueValue2
```

The values are between 0-360. You have to include 0:0 and 360:360 Example:

```
0:0,60:10,360:360
```

This corrected for me the yellow color

## Setup Homey for new device types

To use the new API you should follow the same basic instruction as for Home assistant/ Homebridge.

1. [Tuya IoT Platform Configuration ](https://github.com/tuya/tuya-homebridge/wiki/Tuya-IoT-Platform-Configuration-Guide-Using-Smart-Home-PaaS?_source=d8fba44feeef4757f7f22a14c2295f3f)
2. Set the APi to use to both or Official
3. The authorization key acces key and secret from step 1have to be filled in on the settings page.
The country code is used to determine which datacenter has to be used and must match with your android app and region of your project. [Mappings Between OEM App Accounts and Data Centers-Documentation-Tuya Developer ](https://developer.tuya.com/en/docs/iot/oem-app-data-center-distributed?id=Kafi0ku9l07qb)
4. Username, Password are the same as with first login of the mobile app
    **It won't work with linked Cloud accounts like Google, Facebook or other** 
    ***It's your mobile phone login credentials, and not develloper portal credentials***
![image](upload://u2jDD5ZuZTUJik83d1vYWr6RwcI)
## Todo
* Add other possible device types
* Better images and icons
* Support renaming of devices (so Tuya device names and Homey device names stay in sync)
* Translation of texts
* Add other manufacturer Tuya apps
* Move to Homey API V3
* Replace settings page by setting device

The last 2 points are needed to support Homey Cloud, until those are fixed Homey Cloud isn't supported and only Homey PRO is supported.

## Manually installing app on homey
To manually install this app, you have to use the CLI method.

1. Download the [latest version](https://github.com/jurgenheine/com.tuya.cloud) from Github
Press de Clone or Download button and press Download as ZIP

2. Unpack dowloade ZIP to a folder

3.  Install Node.js
	Download Node.js from the [Node.js website](https://nodejs.org/en/). and install it on your computer.

4. Install athom-cli
Open a command line, and install the athom-cli program by running the following command:
```
$ npm install -g athom-cli
```

5. Log-in
In the command-line, log in with your Athom account:
```
$ athom login
```

6. Got to the folder where you unpacked the code
Install the app to Homey with the fllowing command:
```
$ athom app install
```

## Background

Latest HA implementation: https://github.com/PaulAnnekov/tuyaha

Together with the method used by this app, there are 3 ways to connect Tuya devices. 
- The currently used HA API
	+ \+ Works without CLientID and ClientSecret, same credentials as with mobile app
	+ \+ Mobile app and this app can work simultanious
	- \- Needs Mobile app. You can choose between Tuya or Smart life Other apps( like LSC) not supported at the moment. You can use one of the mentioned apps to pair your devices
	- \- Needs internet to operate, no local control
- Intercepting mobile app data, see https://github.com/codetheweb/tuyapi/blob/master/docs/SETUP.md
  This methos is use by the other Tuya app: https://apps.athom.com/app/nl.rebtor.tuya
	+ \+ Local control possible
	+ \+ Support of all device types possible
	+ \+ Use of official API
	- \- Difficult setup procedure, needs intercepting mobile app data
	- \- Needs Mobile app
	- \- Mobile app and this method can't work simultanious
- Own ClientID and ClientSecret. This is used by https://github.com/frawau/aiotuya
	+ \+ Local control possible
	+ \+ Support of all device types possible
	+ \+ Use of official API
	- \- Needs requesting ClientId and ClientSecret
	- \- Paring exclusive to app with this ClientId and ClientSecret
		- Can't work with mobile app
- Official API, needs ClientID and ClientSecret.
	+ \+ Local control possible
	+ \+ Support of all device types possible
	+ \+ Use of official API
	- \- Needs ClientId and ClientSecret( extra devacount and steps needed)

## License
The MIT License (MIT)

Copyright 2019 Jurgen Heine

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
