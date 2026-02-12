import express from 'express';
import * as orderController from '../controllers/orderController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Создание заказа
router.post('/', verifyToken, orderController.createOrder);

// Получение заказа
router.get('/:orderNumber', verifyToken, orderController.getOrder);

// Мои заказы (покупателя)
router.get('/', verifyToken, orderController.getMyOrders);

// Подтверждение платежа
router.post('/:orderNumber/confirm-payment', verifyToken, orderController.confirmPayment);

// Оставить отзыв
router.post('/:orderNumber/review', verifyToken, orderController.leaveReview);

// Статус заказов (для модерации)
router.get('/status/pending', verifyToken, orderController.getPendingOrders);

export default router;
