# Tuya cloud [Beta]

Homey App for the Tuya cloud. This app is currently in beta status.

This app connects with a Tuya API to control your devices. This app needs an internet connection to function, 
if there is no internet then you can only control your devices with the mobile app. 
You have to pair your devices first with the mobile app. At the moment only the Tuya app and the Smart Life app are supported.

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

### Possible supported devices
- Cover
- Fan
- Climate
- Lock

### Usupported devices
- New device types, see https://github.com/PaulAnnekov/tuyaha/issues/6
	- Ledstrip
	- Garage door opener status
	- Switch with energy monitoring
	- Siren 
	- Doorcontact

## Known bugs
- State not correct reported to homey
- Updates all capablities instead only the changed