const chatService = require("./chat.service.js");

const createPrivateChat = async (req, res, next) => {
  try {
    const result = await chatService.createPrivateChat(
      req.user.id,
      req.body.userId,
    );
    if (result.isNew) {
      return res.status(201).json({
        chat: result.chat,
        message: "Private chat created successfully",
      });
    }
    return res.status(200).json({
      chat: result.chat,
      message: "Private chat already exists",
    });
  } catch (err) {
    next(err);
  }
};

const createGroupChat = async (req, res, next) => {
  try {
    const chat = await chatService.createGroupChat(
      req.user.id,
      req.body.name,
      req.body.members,
    );
    res.status(201).json({
      chat,
      message: "Group chat created successfully",
    });
  } catch (err) {
    next(err);
  }
};

const getMyChats = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const chats = await chatService.getMyChats(req.user.id, limit);

    res.status(200).json({ chats, message: "Chats fetched successfully" });
  } catch (err) {
    next(err);
  }
};

const getChatMembers = async (req, res, next) => {
  try {
    const members = await chatService.getChatMembers(
      req.params.chatId,
      req.user.id,
      // req.body.members
    );

    res.status(200).json({ members, message: "Members fetched successfully" });
  } catch (err) {
    next(err);
  }
};

const addGroupMembers = async (req, res, next) => {
  try {
    const members = await chatService.addGroupMembers(
      req.params.chatId,
      req.user.id,
      req.body.members,
    );
    res.status(200).json(members);
  } catch (err) {
    next(err);
  }
};

const removeGroupMember = async (req, res, next) => {
  try {
    const member = await chatService.removeGroupMember(
      req.params.chatId,
      req.user.id,
      req.params.userId,
    );
    res.status(200).json({ member, message: "Member removed successfully" });
  } catch (err) {
    next(err);
  }
};

const leaveGroup = async (req, res, next) => {
  try {
    await chatService.leaveGroup(req.params.chatId, req.user.id);
    res.status(200).json({
      message: "Left group successfully",
    });
  } catch (err) {
    next(err);
  }
};

const muteChat = async (req, res, next) => {
  try {
    await chatService.muteChat(req.params.chatId, req.user.id, true);
    res.status(200).json({
      message: "Chat muted successfully",
    });
  } catch (err) {
    next(err);
  }
};

const unMuteChat = async (req, res, next) => {
  try {
    await chatService.muteChat(req.params.chatId, req.user.id, false);
    res.status(200).json({
      message: "Chat unmuted successfully",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPrivateChat,
  createGroupChat,
  getMyChats,
  getChatMembers,
  addGroupMembers,
  removeGroupMember,
  leaveGroup,
  muteChat,
  unMuteChat,
};
