const { Op } = require("sequelize");
const { Call, Users } = require("../../models");

// ═══════════════════════════════════════════════════════════════════════════
// GET CALL HISTORY
// ═══════════════════════════════════════════════════════════════════════════
const getCallHistory = async (userId, page = 1, limit = 20, filters = {}) => {
  const offset = (page - 1) * limit;

  // Build where clause
  const whereClause = {
    [Op.or]: [{ callerId: userId }, { receiverId: userId }],
  };

  // Filter by type (audio/video)
  if (filters.type) {
    whereClause.type = filters.type;
  }

  // Filter by status
  if (filters.status) {
    whereClause.status = filters.status;
  }

  // Filter by date range
  if (filters.startDate || filters.endDate) {
    whereClause.createdAt = {};
    if (filters.startDate) {
      whereClause.createdAt[Op.gte] = new Date(filters.startDate);
    }
    if (filters.endDate) {
      whereClause.createdAt[Op.lte] = new Date(filters.endDate);
    }
  }

  const { rows, count } = await Call.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Users,
        as: "caller",
        attributes: ["id", "username", "profile_img"],
      },
      {
        model: Users,
        as: "receiver",
        attributes: ["id", "username", "profile_img"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  // Calculate duration for each call
  const callsWithDuration = rows.map((call) => {
    let duration = null;
    if (call.startedAt && call.endedAt) {
      const durationMs = new Date(call.endedAt) - new Date(call.startedAt);
      duration = Math.floor(durationMs / 1000); // Duration in seconds
    }

    return {
      ...call.toJSON(),
      duration,
      isIncoming: call.receiverId === userId,
      isOutgoing: call.callerId === userId,
    };
  });

  return {
    calls: callsWithDuration,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// GET MISSED CALLS
// ═══════════════════════════════════════════════════════════════════════════
const getMissedCalls = async (userId, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;

  const { rows, count } = await Call.findAndCountAll({
    where: {
      receiverId: userId,
      status: "missed",
    },
    include: [
      {
        model: Users,
        as: "caller",
        attributes: ["id", "username", "profile_img"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  return {
    calls: rows,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// GET MISSED CALLS COUNT
// ═══════════════════════════════════════════════════════════════════════════
const getMissedCallsCount = async (userId) => {
  return await Call.count({
    where: {
      receiverId: userId,
      status: "missed",
    },
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// GET SINGLE CALL DETAILS
// ═══════════════════════════════════════════════════════════════════════════
const getCallDetails = async (callId, userId) => {
  const call = await Call.findOne({
    where: {
      id: callId,
      [Op.or]: [{ callerId: userId }, { receiverId: userId }],
    },
    include: [
      {
        model: Users,
        as: "caller",
        attributes: ["id", "username", "profile_img"],
      },
      {
        model: Users,
        as: "receiver",
        attributes: ["id", "username", "profile_img"],
      },
    ],
  });

  if (!call) {
    throw new Error("Call not found");
  }

  // Calculate duration
  let duration = null;
  if (call.startedAt && call.endedAt) {
    const durationMs = new Date(call.endedAt) - new Date(call.startedAt);
    duration = Math.floor(durationMs / 1000);
  }

  return {
    ...call.toJSON(),
    duration,
    isIncoming: call.receiverId === userId,
    isOutgoing: call.callerId === userId,
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// DELETE CALL FROM HISTORY
// ═══════════════════════════════════════════════════════════════════════════
const deleteCall = async (callId, userId) => {
  const call = await Call.findOne({
    where: {
      id: callId,
      [Op.or]: [{ callerId: userId }, { receiverId: userId }],
    },
  });

  if (!call) {
    throw new Error("Call not found");
  }

  await call.destroy();
  return { message: "Call deleted from history" };
};

// ═══════════════════════════════════════════════════════════════════════════
// CLEAR ALL CALL HISTORY
// ═══════════════════════════════════════════════════════════════════════════
const clearCallHistory = async (userId, type = "all") => {
  const whereClause = {
    [Op.or]: [{ callerId: userId }, { receiverId: userId }],
  };

  // Only clear missed calls
  if (type === "missed") {
    whereClause.receiverId = userId;
    whereClause.status = "missed";
  }

  const deletedCount = await Call.destroy({
    where: whereClause,
  });

  return {
    message: `${deletedCount} call(s) deleted from history`,
    deletedCount,
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// GET CALL STATISTICS
// ═══════════════════════════════════════════════════════════════════════════
const getCallStatistics = async (userId) => {
  // Total calls
  const totalCalls = await Call.count({
    where: {
      [Op.or]: [{ callerId: userId }, { receiverId: userId }],
    },
  });

  // Incoming calls
  const incomingCalls = await Call.count({
    where: { receiverId: userId },
  });

  // Outgoing calls
  const outgoingCalls = await Call.count({
    where: { callerId: userId },
  });

  // Missed calls
  const missedCalls = await Call.count({
    where: {
      receiverId: userId,
      status: "missed",
    },
  });

  // Rejected calls
  const rejectedCalls = await Call.count({
    where: {
      receiverId: userId,
      status: "rejected",
    },
  });

  // Completed calls (ended successfully)
  const completedCalls = await Call.count({
    where: {
      [Op.or]: [{ callerId: userId }, { receiverId: userId }],
      status: "ended",
    },
  });

  // Audio vs Video
  const audioCalls = await Call.count({
    where: {
      [Op.or]: [{ callerId: userId }, { receiverId: userId }],
      type: "audio",
    },
  });

  const videoCalls = await Call.count({
    where: {
      [Op.or]: [{ callerId: userId }, { receiverId: userId }],
      type: "video",
    },
  });

  // Total call duration (only completed calls)
  const callsWithDuration = await Call.findAll({
    where: {
      [Op.or]: [{ callerId: userId }, { receiverId: userId }],
      status: "ended",
      startedAt: { [Op.ne]: null },
      endedAt: { [Op.ne]: null },
    },
    attributes: ["startedAt", "endedAt"],
  });

  let totalDuration = 0;
  callsWithDuration.forEach((call) => {
    const duration = new Date(call.endedAt) - new Date(call.startedAt);
    totalDuration += Math.floor(duration / 1000);
  });

  return {
    totalCalls,
    incomingCalls,
    outgoingCalls,
    missedCalls,
    rejectedCalls,
    completedCalls,
    audioCalls,
    videoCalls,
    totalDuration, // in seconds
    averageDuration:
      completedCalls > 0 ? Math.floor(totalDuration / completedCalls) : 0,
  };
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
