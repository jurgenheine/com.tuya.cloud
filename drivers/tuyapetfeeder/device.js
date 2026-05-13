'use strict';

const TuyaBaseDevice = require('../tuyabasedevice');

const CAPABILITIES_SET_DEBOUNCE = 1000;
const BATTERY_LOW_THRESHOLD = 20;

class TuyaPetFeederDevice extends TuyaBaseDevice {

    onInit() {
        this.initDevice(this.getData().id);
        this.setDeviceConfig(this.get_deviceConfig());
        this.registerMultipleCapabilityListener(['petfeeder_voice_times'], async (values, options) => {
            return this._onMultipleCapabilityListener(values, options);
        }, CAPABILITIES_SET_DEBOUNCE);
        this.registerCapabilityListener('quick_feed', async () => {
            this.quickFeed();
        });
        if (this.getCapabilityValue('measure_feed_report') === null) {
            this.setCapabilityValue('measure_feed_report', 0).catch(this.error);
        }
        this._scheduleMidnightReset();
        this.log(`Tuya Pet Feeder ${this.getName()} has been initialized`);
    }

    setDeviceConfig(deviceConfig) {
        if (deviceConfig != null) {
            this.log('set petfeeder device config: ' + JSON.stringify(deviceConfig));
            let statusArr = deviceConfig.status ? deviceConfig.status : [];
            this.updateCapabilities(statusArr);
        } else {
            this.homey.log('No device config found for pet feeder');
        }
    }

    _onMultipleCapabilityListener(valueObj, optsObj) {
        this.log('Pet Feeder capabilities changed by Homey: ' + JSON.stringify(valueObj));
        try {
            if (valueObj.petfeeder_voice_times != null) {
                this.sendCommand('voice_times', valueObj.petfeeder_voice_times);
            }
        } catch (ex) {
            this.homey.app.logToHomey(ex);
        }
    }

    // Called by Tuya push messages (MQTT)
    updateCapabilities(statusArr) {
        this.log('Update pet feeder capabilities from Tuya: ' + JSON.stringify(statusArr));
        if (!statusArr) return;

        for (const status of statusArr) {
            switch (status.code) {
                case 'feed_state':
                    this.normalAsync('petfeeder_feed_state', status.value);
                    // Trigger flow cards
                    this.driver.triggerFeedStateChanged(this, { feed_state: status.value }, {});
                    if (status.value === 'done') {
                        this.driver.triggerFeedingDone(this, {}, {});
                    }
                    break;

                case 'feed_report': {
                    const current = this.getCapabilityValue('measure_feed_report') || 0;
                    this.normalAsync('measure_feed_report', current + status.value);
                    break;
                }

                case 'battery_percentage':
                    this.normalAsync('measure_battery', status.value);
                    this.setCapabilityValue('alarm_battery', status.value < BATTERY_LOW_THRESHOLD).catch(this.error);
                    break;

                case 'voice_times':
                    if (this.hasCapability('petfeeder_voice_times')) {
                        this.normalAsync('petfeeder_voice_times', status.value);
                    }
                    break;

                // meal_plan is Raw/complex – we only log it, not displayed in UI
                case 'meal_plan':
                    this.log('meal_plan update received: ' + JSON.stringify(status.value));
                    break;

                default:
                    this.log('Unknown pet feeder DP: ' + status.code + ' = ' + status.value);
                    break;
            }
        }
    }

    _scheduleMidnightReset() {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const msUntilMidnight = midnight - now;
        this.homey.setTimeout(() => {
            this.log('Midnight reset: clearing daily feed report');
            this.setCapabilityValue('measure_feed_report', 0).catch(this.error);
            this._scheduleMidnightReset();
        }, msUntilMidnight);
    }

    normalAsync(name, value) {
        this.log(`Set pet feeder capability ${name} with ${value}`);
        this.setCapabilityValue(name, value).catch(error => this.error(error));
    }

    sendCommand(code, value) {
        const param = {
            commands: [{ code, value }]
        };
        this.homey.app.tuyaOpenApi.sendCommand(this.id, param).catch((error) => {
            this.error('[SET][%s] capabilities Error: %s', this.id, error);
            throw new Error(`Error sending command: ${error}`);
        });
    }

    // ── Public command helpers (called by driver flow listeners) ──────────────

    quickFeed() {
        this.log('Pet feeder: quick feed triggered');
        this.sendCommand('quick_feed', true);
    }

    manualFeed(portions) {
        const safe = Math.min(50, Math.max(1, Math.round(portions)));
        this.log(`Pet feeder: manual feed ${safe} portion(s)`);
        this.sendCommand('manual_feed', safe);
    }

    setVoiceTimes(times) {
        const safe = Math.min(5, Math.max(0, Math.round(times)));
        this.log(`Pet feeder: set voice_times to ${safe}`);
        this.sendCommand('voice_times', safe);
        if (this.hasCapability('petfeeder_voice_times')) {
            this.normalAsync('petfeeder_voice_times', safe);
        }
    }

    /**
     * Send a raw meal_plan payload.
     * @param {string} planJson  JSON string representing the meal plan object.
     */
    setMealPlan(planJson) {
        let plan;
        try {
            plan = JSON.parse(planJson);
        } catch (e) {
            throw new Error('Invalid meal plan JSON: ' + e.message);
        }
        this.log('Pet feeder: set meal_plan ' + JSON.stringify(plan));
        this.sendCommand('meal_plan', plan);
    }
}

module.exports = TuyaPetFeederDevice;

