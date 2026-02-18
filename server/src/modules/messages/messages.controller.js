const messageService = require("./messages.service");

const sendMessage = async (req, res, next) => {
  try {
    const msg = await messageService.sendMessage(
      req.params.chatId,
      req.user.id,
      req.body.content,
    );
    res.status(201).json(msg);
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  console.log("userrrrrrr", req.user.id, "chatttttttt", req.params.chatId);

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

const editMessage = async (req, res, next) => {
  try {
    if (!req.body?.content) {
      return res.status(400).json({ message: "Content required" });
    }
    await messageService.editMessage(
      req.params.messageId,
      req.user.id,
      req.body.content,
    );

    res.json({ message: "Message Updated" });
  } catch (err) {
    next(err);
  }
};

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

const deleteMessageForMe = async (req, res, next) => {
  try {
    await messageService.deleteMessageForMe(req.params.messageId, req.user.id);
    res.json({ message: "Message Deleted for you" });
  } catch (err) {
    next(err);
  }
};

const readMessage = async (req, res, next) => {
  try {
    await messageService.readMessage(req.params.messageId, req.user.id);
    res.json({ message: "Message Marked as Read" });
  } catch (err) {
    next(err);
  }
};

const readAllMessages = async (req, res, next) => {
  try {
    await messageService.readAllMessages(req.params.chatId, req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

const sendFileMessage = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new Error("Atleast one file is required");
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

const sendSticker = async (req, res) => {
  const { chatId } = req.params;
  const { stickerUrl } = req.body; // this is emoji

  const msg = await messageService.sendStickerMessage(
    chatId,
    req.user.id,
    stickerUrl,
  );

  res.status(201).json(msg);
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
