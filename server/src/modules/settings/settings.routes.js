const express = require("express");
const router = express.Router();
const auth = require("../../middlewares/auth.middleware");
const settingsController = require("./settings.controller");

router.get("/", auth, settingsController.getSettings);
router.patch("/", auth, settingsController.updateSettings)

module.exports = router;
