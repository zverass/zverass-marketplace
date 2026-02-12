import express from 'express';
import * as sellerController from '../controllers/sellerController.js';
import { verifyToken } from '../middleware/auth.js';
import { isSeller } from '../middleware/roles.js';

const router = express.Router();

// Требует, чтобы пользователь был продавцом
router.use(verifyToken, isSeller);

// Dashboard
router.get('/dashboard', sellerController.getDashboard);

// История продаж
router.get('/sales', sellerController.getSalesHistory);

// Баланс
router.get('/balance', sellerController.getBalance);

// Запрос на вывод
router.post('/withdrawal', sellerController.requestWithdrawal);

// История выводов
router.get('/withdrawal', sellerController.getWithdrawals);

export default router;
