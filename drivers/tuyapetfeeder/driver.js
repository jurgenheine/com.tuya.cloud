'use strict';

const TuyaBaseDriver = require('../tuyabasedriver');

class TuyaPetFeederDriver extends TuyaBaseDriver {

    onInit() {
        // ── Flow triggers ───────────────────────────────────────────────────
        this._flowTriggerFeedStateChanged = this.homey.flow
            .getDeviceTriggerCard('petfeeder_feed_state_changed');

        this._flowTriggerFeedingDone = this.homey.flow
            .getDeviceTriggerCard('petfeeder_feeding_done');

        // ── Flow actions ────────────────────────────────────────────────────

        // Quick feed – fire immediately
        this.homey.flow.getActionCard('petfeeder_quick_feed')
            .registerRunListener(async (args) => {
                args.device.quickFeed();
                return true;
            });

        // Manual feed – N portions (1-50)
        this.homey.flow.getActionCard('petfeeder_manual_feed')
            .registerRunListener(async (args) => {
                args.device.manualFeed(args.portions);
                return true;
            });

        // Set number of voice prompts (0-5)
        this.homey.flow.getActionCard('petfeeder_set_voice_times')
            .registerRunListener(async (args) => {
                args.device.setVoiceTimes(args.voice_times);
                return true;
            });

        // Set meal plan via raw JSON string
        this.homey.flow.getActionCard('petfeeder_set_meal_plan')
            .registerRunListener(async (args) => {
                args.device.setMealPlan(args.meal_plan_json);
                return true;
            });

        this.log('Tuya Pet Feeder driver has been initialized');
    }

    // ── Trigger helpers (called from device.js) ──────────────────────────────

    triggerFeedStateChanged(device, tokens, state) {
        this._flowTriggerFeedStateChanged
            .trigger(device, tokens, state)
            .catch(this.error);
    }

    triggerFeedingDone(device, tokens, state) {
        this._flowTriggerFeedingDone
            .trigger(device, tokens, state)
            .catch(this.error);
    }

    // ── Pairing ──────────────────────────────────────────────────────────────

    async onPairListDevices() {
        if (!this.homey.app.isConnected()) {
            throw new Error('Please configure the app first.');
        }

        let devices = [];
        let feeders = this.get_devices_by_type('petFeeder');

        for (let tuyaDevice of Object.values(feeders)) {
            devices.push({
                data: { id: tuyaDevice.id },
                capabilities: [
                    'quick_feed',
                    'petfeeder_feed_state',
                    'measure_feed_report',
                    'measure_battery',
                    'alarm_battery'
                ],
                name: tuyaDevice.name
            });
        }

        return devices.sort(TuyaBaseDriver._compareHomeyDevice);
    }
}

module.exports = TuyaPetFeederDriver;

