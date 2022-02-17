module.exports = {
    async connect({ homey, query }) {
            try {
                homey.app.log("Connect from settings received.");
                await homey.app.connectToTuyaApi();
                return null;
            } catch (err) {
                homey.app.log("Connect from settings received.");
                return err;
            }
        }
};
