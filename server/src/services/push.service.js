const { Devices } = require("../models");
const admin = require("../config/firebase");

const sendPushToUser = async (userId, payload) => {
  const devices = await Devices.findAll({
    where: { userId },
  });

  if (!devices.length) return;

  const tokens = devices.map((d) => d.pushToken);

  const message = {
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data || {},
    tokens,
  };

  await admin.messaging().sendEachForMulticast(message);
};

module.exports = { sendPushToUser };
