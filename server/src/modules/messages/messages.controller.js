const messageService = require("./messages.service");

/**
 * Send a text message
 * Controller passes PLAIN TEXT to service
 * Service handles encryption
 */
const sendMessage = async (req, res, next) => {
  try {
    // ✅ Pass plain text - service will encrypt it
    const msg = await messageService.sendMessage(
      req.params.chatId,
      req.user.id,
      req.body.content, // Plain text
    );

    res.status(201).json(msg);
  } catch (error) {
    next(error);
  }
};

/**
 * Get messages for a chat
 * Service returns decrypted messages
 */
const getMessages = async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const msgs = await messageService.getMessages(
      req.params.chatId,
      req.user.id,
      parseInt(limit),
      parseInt(offset),
    );

    res.json(msgs);
  } catch (error) {
    next(error);
  }
};

/**
 * Edit a message
 */
const editMessage = async (req, res, next) => {
  try {
    if (!req.body?.content) {
      return res.status(400).json({ message: "Content required" });
    }

    await messageService.editMessage(
      req.params.messageId,
      req.user.id,
      req.body.content, // Plain text
    );

    res.json({ message: "Message Updated" });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete message for everyone
 */
const deleteMessageForEveryone = async (req, res, next) => {
  try {
    await messageService.deleteMessageForEveryone(
      req.params.messageId,
      req.user.id,
    );
    res.json({ message: "Message Deleted for everyone" });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete message for me only
 */
const deleteMessageForMe = async (req, res, next) => {
  try {
    await messageService.deleteMessageForMe(req.params.messageId, req.user.id);
    res.json({ message: "Message Deleted for you" });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark message as read
 */
const readMessage = async (req, res, next) => {
  try {
    await messageService.readMessage(req.params.messageId, req.user.id);
    res.json({ message: "Message Marked as Read" });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark all messages in chat as read
 */
const readAllMessages = async (req, res, next) => {
  try {
    await messageService.readAllMessages(req.params.chatId, req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/**
 * Send file message
 */
const sendFileMessage = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new Error("At least one file is required");
    }

    let messages = [];
    for (const file of req.files) {
      const msg = await messageService.sendFileMessage(
        req.params.chatId,
        req.user.id,
        file,
      );
      messages.push(msg);
    }

    res.status(201).json(messages);
  } catch (err) {
    next(err);
  }
};

/**
 * Search messages in a chat
 * Service handles decryption and searching
 */
const searchMessages = async (req, res, next) => {
  try {
    const msgs = await messageService.searchMessages(
      req.params.chatId,
      req.user.id,
      req.query.search,
    );
    res.json(msgs);
  } catch (err) {
    next(err);
  }
};

/**
 * Send sticker message
 */
const sendSticker = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { stickerUrl } = req.body; // Emoji

    const msg = await messageService.sendStickerMessage(
      chatId,
      req.user.id,
      stickerUrl,
    );

    res.status(201).json(msg);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessageForEveryone,
  deleteMessageForMe,
  readMessage,
  sendFileMessage,
  searchMessages,
  readAllMessages,
  sendSticker,
};
