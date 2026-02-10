const { Devices } = require("../models");
const admin = require("../config/firebase");

const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

// const sendPushToUser = async (userId, payload) => {
//   const devices = await Devices.findAll({
//     where: { userId },
//   });

//   if (!devices.length) return;

//   const tokens = devices.map((d) => d.pushToken);

//   const message = {
//     notification: {
//       title: payload.title,
//       body: payload.body,
//     },
//     data: payload.data || {},
//     tokens,
//   };

//   await admin.messaging().sendEachForMulticast(message);
// };

const sendPushToUser = async (userId, payload) => {
  const devices = await Devices.findAll({
    where: { userId },
  });

  if (!devices.length) return;

  // ✅ 1. deduplicate tokens
  const tokens = [...new Set(devices.map((d) => d.pushToken).filter(Boolean))];

  if (!tokens.length) return;

  // ✅ 2. chunk into max 500
  const tokenChunks = chunkArray(tokens, 500);

  for (const chunk of tokenChunks) {
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      tokens: chunk,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    // ✅ 3. cleanup invalid tokens
    response.responses.forEach(async (res, idx) => {
      if (!res.success) {
        const errorCode = res.error?.code;

        if (
          errorCode === "messaging/registration-token-not-registered" ||
          errorCode === "messaging/invalid-registration-token"
        ) {
          await Devices.destroy({
            where: { pushToken: chunk[idx] },
          });
        }
      }
    });
  }
};

module.exports = { sendPushToUser };
