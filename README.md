# Tuya cloud
![image](https://user-images.githubusercontent.com/17513366/194271163-0155abe3-9cfd-4fc8-8cdf-290aac7af2e9.png)

https://homey.app/nl-nl/app/com.tuya.cloud/Tuya-cloud/

Homey App for the Tuya cloud.

The official API is supported now. It requires an extra development account and keys. The API is also returning keys for local control, so maybe it's in the future also possible to local control devices. But commands are not yet available.
This app was based on the Home Assistant implementation. Tuya has an undocumented API for Home Assistant that differs from the official API. This old depricated API supports login with credentials only. 

## If you are already used this app, the existing devices will still use the old API!!!!!!
**You have to add the devices again to use the functionality of new API.** 
If You don't need the legacy devices anymore, you can delete the legacy devices. When you don't have legacy devices anymore, set the API dropdown to official only.

### Supported devices

* Light
* Switch
* Socket
* PIR sensor
* Smoke sensor
* Contact sensor
* Presense sensor
* Air conditioner

### Not supported devices or functions

Only when device is supported by API, it's possible to add the device to this app. because I don't own all device types, it's hard to implement a device type which I don't own. Contributions to code are welkom to add unsupported devices. Other possibility is to use raw commands

### Raw commands
You can receive all messages send for devices with trigger cards. Also there are now action cards to send commands to you device. On this way you can interact with not directly supported devices are commands. Combine it with the virtual devices app and you can control most of your devices. It’s a function for advanced users, there is no validation when sending a command to your device.

To get the device id’s, commands and possible values you can create a flow with the text event received trigger card. This card is returning device id, command and value for each action. Log the returned values to log app to know the commands of your devices, deviceid’s and possible values.

See also Howto of @Peter_Kawa: https://community.homey.app/t/app-pro-tuya-cloud/21313/765

### Existing legacy devices can be used as long as they are paired, but can't be added anymore
* Legacy Light ( On/Off, some devices brightness and color)
* Legacy Switch( On/Off)
* Legacy Cover

The official API( non legacy devices) is using push messages, so changes to devices should be direct visible, so no more 10 minutes waiting for updates.

### Scenes
This app support the use of scenes. In the mobile Tuya/Smart life app you can make 'Tap to run' actions( In the past they where called scenes). Those actions can be called in a flow from this app.
**The scenes for the official API are not automatically updated, for now new scenes will only appear after a restart of this app.**

See also howto of @Peter_Kawa: https://community.homey.app/t/app-pro-tuya-cloud/21313/296

## Setup Homey

To use the new API you should follow the same basic instruction as for Home assistant/ Homebridge.

1. [Tuya IoT Platform Configuration ](https://github.com/tuya/tuya-homebridge/wiki/Tuya-IoT-Platform-Configuration-Guide-Using-Smart-Home-PaaS?_source=d8fba44feeef4757f7f22a14c2295f3f)
 The services have some new names and are not updated in official Tuya documentation:
  -IOT Core ( Controlling devices from Homey)
  -Authorization => Authorization Token Management (Authentication)
  -IOT Data Analytics => Data Dashboard Service ( See devices in development portal)
  -Smart Home Scene linkage ( Needed for trigger scenes from Homey)
  -Device Status Notification ( Needed for getting data from Tuya to Homey)
2. Go to the setup page in Homey mobile app or Homey develloper portal
3. Set the APi to use to Official
4. The authorization key acces key and secret from step 1have to be filled in on the settings page.
The country code is used to determine which datacenter has to be used and must match with your android app and region of your project. Only the number is allowed, no leading zero's or + sign. Look in the link for correct numbering, it can be different for some countries then the known phone prefix.
[Mappings Between OEM App Accounts and Data Centers-Documentation-Tuya Developer ](https://developer.tuya.com/en/docs/iot/oem-app-data-center-distributed?id=Kafi0ku9l07qb)
4. Username, Password are the same as with first login of the mobile app
    **It won't work with linked Cloud accounts like Google, Facebook or other!!!!** 
    ***It's your mobile phone app login credentials, and not develloper portal credentials!!!!***
![image](https://user-images.githubusercontent.com/17513366/194270166-e963e9b3-76b6-4cf3-b624-79f4b2a20d0c.png)

AFTER creating and linking the IoT cloud project, one day you’ll receive an email message from Tuya.
They write: *Your Tuya service subscription is about to expire and you’ll have to renew it.*

It is safe to ignore. This API is free of charge.

## Todo
* Add other possible device types
* Support renaming of devices (so Tuya device names and Homey device names stay in sync)
* Translation of texts
   * Fixed text are now moved to language files
   * Dutch and English now supported 
* Add other manufacturer Tuya apps
* Replace settings page by setting device

The last point is needed to support Homey Cloud, until this is fixed, Homey Cloud isn't supported and only Homey PRO is supported.

# Error Code and Troubleshooting

| Error code | Message | Troubleshooting |
|:----|:----|:----|
| 1004 | sign invalid | The Access ID and Access Secret you entered are not correct. For more information, see entering credentials step in [Install Tuya Integration](.././docs/install.md). |
| 1106 | permission deny | <ul><li> Your app account is not linked to your cloud project. This operation is a must-do. For more information, see [Link devices by app account](https://developer.tuya.com/en/docs/iot/Platform_Configuration_smarthome?id=Kamcgamwoevrx#title-3-Link%20devices%20by%20app%20account).</li><li> Incorrect account or password. You must enter the account and password of the mobile app that you use to scan the QR code for linking devices to your cloud project on the [Tuya IoT Development Platform](https://iot.tuya.com/).</li><li>Incorrect country. You must select the region of your account of the Tuya Smart app or Smart Life app.</li></ul> |
|1100|param is empty| Empty parameter of username or app. Fill the parameters refer to the entering credentials step in [Install Tuya Integration](.././docs/install.md).|
| 2406 | skill id invalid | <ul><li>Make sure you use the Tuya Smart or SmartLife app account to log in. Also, choose the right data center endpoint related to your country region. For more details, please check [Mappings Between OEM App Accounts and Data Centers](https://developer.tuya.com/en/docs/iot/oem-app-data-center-distributed?id=Kafi0ku9l07qb).</li><li>Your cloud project on the [Tuya IoT Development Platform](https://iot.tuya.com) should be created after May 25, 2021. Otherwise, you need to create a new project. For more information, see [Operation on the Tuya IoT Development Platform](https://developer.tuya.com/en/docs/iot/migrate-from-an-older-version?id=Kamee9wtbd00b#title-3-Operation%20on%20the%20Tuya%20IoT%20Platform). </li></ul>|
| 28841105 | No permissions. This project is not authorized to call this API | Insufficient API permissions. You need to subscribe to the required [API services](https://developer.tuya.com/en/docs/iot/applying-for-api-group-permissions?id=Ka6vf012u6q76#title-2-Subscribe%20to%20API%20services) and [authorize](https://developer.tuya.com/en/docs/iot/applying-for-api-group-permissions?id=Ka6vf012u6q76#title-3-Authorize%20project%20to%20call%20APIs) your cloud project to use these API services. The following API services are required.<ul><li>Authorization</li><li>IoT Core</li><li>Smart Home Scene Linkage</li><li>IoT Data Analytics</li><li>Device Status Notification</li></ul> |

# Tuya Integration FAQs

<font color=black  size="4"><b>Q1: I got an error shown in the following screenshot when I tried to scan a QR code to link my devices to my cloud project. How to fix it?</b></font>

<img src="upload://wZGPjRFrJ2n08wxQofGBHWFpYLb.jpeg" width="35%">

- This is because the data center you selected for your cloud project cannot serve the region of your app account. You must switch to the correct data center and scan the QR code again.

  1. Here is how to find the region: open the mobile app you use and tap **Me** > **Setting** > **Account and Security** > **Region**.

     ![image](https://user-images.githubusercontent.com/17513366/194275373-2f2da868-68bf-4903-b2e6-02f56860b603.png)

  2. See [Mappings Between OEM App Accounts and Data Centers](https://developer.tuya.com/en/docs/iot/oem-app-data-center-distributed?id=Kafi0ku9l07qb) and find the data center that can serve your region.

  3. (Optional) If you do not find the data center you want to use, click the **Overview** tab and then **Edit** to add data centers.

     ![image](https://user-images.githubusercontent.com/17513366/194275294-94746031-8e45-445f-bff3-54f029588a59.png)

  4. Click the **Devices** tab > **Link Tuya App Account**. Select the correct data center from the drop-down menu in the top right corner and click **Add App Account**.

     ![image](https://user-images.githubusercontent.com/17513366/194275457-51e923f2-ae96-48eb-a9d0-1c743db4cbb4.png)

  5. Scan the QR code again to link devices.

<font color=black  size="4"><b>Q2: Will I be billed after the free trial of the API service expires?</b></font>

- After your API service expires, go to **Cloud** > **My Services** on the [Tuya IoT Development Platform](https://iot.tuya.com) to request extending your API service by up to 6 months.

   1. Click **Extend Trial Period**.
   
      ![image](https://user-images.githubusercontent.com/17513366/194275785-be1c98cc-b5d8-4aaf-a542-41cf2b906ff7.png)

   2. Complete this form.

      ![image](https://user-images.githubusercontent.com/17513366/194275839-eaa1080c-a5bf-48eb-8db8-dcbbd04076d6.png)

   3. You will get the result within one working day.

      ![image](https://user-images.githubusercontent.com/17513366/194275910-0bb5247d-22e2-44bd-b8ab-69ec861d3f2d.png)

- The Trial Edition allows you to use all free API services but puts limits on the quota of API calls. For more information about the quota, see [Pricing](https://developer.tuya.com/en/docs/iot/membership-service?id=K9m8k45jwvg9j).

<font color=black  size="4"><b>Q3: Can I request Tuya's cloud services from an IP address outside the data center region?</b></font>

Please note that data transfer across regions has a risk of violation of the data security regulations. If you request Tuya's cloud services from an IP address outside the data center region, you are at risk of illegally transferring data. For example, using an IP address in the U.S.A. to access cloud services in China's data centers will be regarded as data transfer across regions, and vice versa. Tuya will completely prohibit cross-region API calls and message subscriptions. Please deploy your cloud services properly to ensure data security.
