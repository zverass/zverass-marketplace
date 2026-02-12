import Chat from '../models/Chat.js';

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, message } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (senderId === parseInt(receiverId)) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }

    const msg = await Chat.sendMessage(senderId, receiverId, message);

    res.status(201).json({
      message: 'Message sent',
      data: msg
    });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId, limit = 50, offset = 0 } = req.query;

    if (!otherUserId) {
      return res.status(400).json({ error: 'otherUserId required' });
    }

    // Отмечаем сообщения как прочитанные
    await Chat.markAsRead(parseInt(otherUserId), userId);

    // Получаем сообщения
    const messages = await Chat.getMessages(userId, parseInt(otherUserId), parseInt(limit), parseInt(offset));

    res.json({
      messages,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getDialogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const dialogs = await Chat.getDialogs(userId, parseInt(limit), offset);
    const unreadCount = await Chat.getUnreadCount(userId);

    res.json({
      dialogs,
      unreadCount,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('Get dialogs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteDialog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    const count = await Chat.deleteDialog(userId, parseInt(otherUserId));

    res.json({
      message: 'Dialog deleted',
      deletedMessages: count
    });
  } catch (err) {
    console.error('Delete dialog error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Chat.getUnreadCount(userId);

    res.json({ unreadCount: count });
  } catch (err) {
    console.error('Get unread count error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
