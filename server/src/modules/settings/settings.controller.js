const settingsService = require("./settings.service");

const getSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getSettings(req.user.id);
    res.status(200).json(settings);
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.updateSettings(
      req.user.id,
      req.body,
    );
    res.status(200).json(settings);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
