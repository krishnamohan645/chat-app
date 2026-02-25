const callsService = require("./calls.service");

// ═══════════════════════════════════════════════════════════════════════════
// GET CALL HISTORY
// ═══════════════════════════════════════════════════════════════════════════
const getCallHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Optional filters
    const filters = {
      type: req.query.type, // 'audio' or 'video'
      status: req.query.status, // 'missed', 'ended', etc.
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const result = await callsService.getCallHistory(
      userId,
      page,
      limit,
      filters,
    );

    res.json(result);
  } catch (error) {
    console.error("Get call history error:", error);
    res.status(500).json({ message: "Failed to get call history" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GET MISSED CALLS
// ═══════════════════════════════════════════════════════════════════════════
const getMissedCalls = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await callsService.getMissedCalls(userId, page, limit);

    res.json(result);
  } catch (error) {
    console.error("Get missed calls error:", error);
    res.status(500).json({ message: "Failed to get missed calls" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GET MISSED CALLS COUNT
// ═══════════════════════════════════════════════════════════════════════════
const getMissedCallsCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await callsService.getMissedCallsCount(userId);

    res.json({ count });
  } catch (error) {
    console.error("Get missed calls count error:", error);
    res.status(500).json({ message: "Failed to get missed calls count" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GET SINGLE CALL DETAILS
// ═══════════════════════════════════════════════════════════════════════════
const getCallDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    const callId = req.params.callId;

    const call = await callsService.getCallDetails(callId, userId);

    res.json(call);
  } catch (error) {
    console.error("Get call details error:", error);
    if (error.message === "Call not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to get call details" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// DELETE CALL
// ═══════════════════════════════════════════════════════════════════════════
const deleteCall = async (req, res) => {
  try {
    const userId = req.user.userId;
    const callId = req.params.callId;

    const result = await callsService.deleteCall(callId, userId);

    res.json(result);
  } catch (error) {
    console.error("Delete call error:", error);
    if (error.message === "Call not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to delete call" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CLEAR CALL HISTORY
// ═══════════════════════════════════════════════════════════════════════════
const clearCallHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const type = req.query.type || "all"; // 'all' or 'missed'

    const result = await callsService.clearCallHistory(userId, type);

    res.json(result);
  } catch (error) {
    console.error("Clear call history error:", error);
    res.status(500).json({ message: "Failed to clear call history" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GET CALL STATISTICS
// ═══════════════════════════════════════════════════════════════════════════
const getCallStatistics = async (req, res) => {
  try {
    const userId = req.user.userId;

    const stats = await callsService.getCallStatistics(userId);

    res.json(stats);
  } catch (error) {
    console.error("Get call statistics error:", error);
    res.status(500).json({ message: "Failed to get call statistics" });
  }
};

module.exports = {
  getCallHistory,
  getMissedCalls,
  getMissedCallsCount,
  getCallDetails,
  deleteCall,
  clearCallHistory,
  getCallStatistics,
};
