module.exports = {
    async connect({ homey, query }) {
            try {
                homey.app.log("Connect from settings received.");
                await homey.app.connectToTuyaApi();
            } catch (err) {
                homey.app.log(err);
                return err;
            }
            if(homey.app.logger.lastConnectionError!=null){
                throw new Error(homey.app.logger.lastConnectionError);
            }
            return null;
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
