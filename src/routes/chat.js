import express from 'express';
import * as chatController from '../controllers/chatController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Требует авторизации
router.use(verifyToken);

// Отправить сообщение
router.post('/send', chatController.sendMessage);

// Получить сообщения с пользователем
router.get('/messages', chatController.getMessages);

// Получить список диалогов
router.get('/dialogs', chatController.getDialogs);

// Удалить диалог
router.delete('/dialogs/:otherUserId', chatController.deleteDialog);

// Получить количество непрочитанных
router.get('/unread', chatController.getUnreadCount);

export default router;
