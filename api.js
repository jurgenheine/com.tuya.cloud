module.exports = [
    {
        async connect (homey, args, callback) {
            try {
                await homey.app.connectToTuyaApi();
                return callback(null);
            } catch (err) {
                return callback(err);
            }
        }
    }
];
