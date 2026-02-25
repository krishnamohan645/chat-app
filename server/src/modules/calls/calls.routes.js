const express = require("express");
const router = express.Router();
const auth = require("../../middlewares/auth.middleware");
const callsController = require("./calls.controller");

// CALL ROUTES
router.get("/history", auth, callsController.getCallHistory);
router.get("/missed", auth, callsController.getMissedCalls);
router.get("/missed/count", auth, callsController.getMissedCallsCount);
router.get("/stats", auth, callsController.getCallStatistics);
router.get("/:callId", auth, callsController.getCallDetails);
router.delete("/:callId", auth, callsController.deleteCall);
router.delete("/clear", auth, callsController.clearCallHistory);

module.exports = router;
