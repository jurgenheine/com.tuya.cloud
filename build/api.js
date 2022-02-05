'use strict';
const Homey = require('homey');
module.exports = [
    {
        method: 'GET',
        path: '/connect/',
        fn: async (args, callback) => {
            try {
                await Homey.app.connectToTuyaApi();
                return callback(null);
            } catch (err) {
                return callback(err);
            }
        }
    }
];
