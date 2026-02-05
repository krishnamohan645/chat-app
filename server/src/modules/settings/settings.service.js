const { UserSettings } = require("../../models");

const getSettings = async (userId) => {
  let settings = await UserSettings.findOne({
    where: {
      userId: userId,
    },
  });

  if (!settings) {
    settings = await UserSettings.create({ userId });
  }

  return settings;
};

const updateSettings = async (userId, updatedSettings) => {
  let settings = await UserSettings.findOne({
    where: {
      userId: userId,
    },
  });

  if (!settings) {
    settings = await UserSettings.create({ userId, ...updatedSettings });
    return settings;
  }

  await settings.update(updatedSettings);
  return settings;
};

module.exports = {
  getSettings,
  updateSettings,
};
