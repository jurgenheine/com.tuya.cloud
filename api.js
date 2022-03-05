module.exports = {
    async connect({ homey, query }) {
            try {
                homey.app.log("Connect from settings received.");
                await homey.app.connectToTuyaApi();
                if(homey.app.logger.lastConnectionError!=null){
                    return homey.app.logger.lastConnectionError;
                }
                return null;
            } catch (err) {
                homey.app.log(err);
                return err;
            }
        },

    async refreshScenes({ homey, query }) {
        try {
            homey.app.log("Refresh scenes received.");
            await homey.app.refreshScenes();
            return null;
        } catch (err) {
            homey.app.log(err);
            return err;
        }
    }
};
