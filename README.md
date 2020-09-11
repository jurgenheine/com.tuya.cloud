# Tuya cloud

Homey App for the Tuya cloud.

This app is based on the Home Assistant implementation. Tuya has an undocumented API for HA that differs from the official API.
Because this API is undocumented and differs, it's unclear what is supported and not. The devices that are supported in HA implementation
are for now possible to support. 

## Setup Homey
1. Go to the setup page in mobile app or develloper portal
2. Set Username, Password and CountryCode
   These are the same as with first login of the mobile app
3. Set Business. This is Smart life or Tuya and corespondents with mobile app you use

The colormap can be leaved empty. this is experimental and is used to correct the colors between Homey and the lights
If you want to use it, it has the flowing format: 
```
HomeyHueValue1:TuyaHueValue1,HomeyHueValue2:TuyaHueValue2
```
The values are between 0-360. You have to include 0:0 and 360:360
Example:
```
0:0,60:10,360:360
```
This corrected for me the yellow color

## Devices
### Supported devices
- Light
- Switch( On/Off)
- Scene
- Ledstrip
- Cover

### Possible supported devices
- Fan
- Climate
- Lock
- Switch with energy monitoring

### Usupported devices
- New device types, see https://github.com/PaulAnnekov/tuyaha/issues/6
	- Garage door opener status
	- Siren 
	- Doorcontact

## Known bugs
- State not always correct reported to homey
- Updates all capablities instead only the changed

## Todo 
- Add other possible device types
- Memory optimalisations
- Better images and icons
- Support renaming of devices (so Tuya device names and Homey device names stay in sync)
- Translation of texts
- Add other manufacturer Tuya apps
- Poll interval( now 5 seconds)

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
