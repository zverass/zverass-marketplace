import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { verifyToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roles.js';

const router = express.Router();

// Требует админские права
router.use(verifyToken, isAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Модерация товаров
router.get('/products/pending', adminController.getPendingProducts);
router.post('/products/:productId/approve', adminController.approveProduct);
router.post('/products/:productId/reject', adminController.rejectProduct);

// Управление выводами
router.get('/withdrawals/pending', adminController.getPendingWithdrawals);
router.post('/withdrawals/:withdrawalId/approve', adminController.approveWithdrawal);
router.post('/withdrawals/:withdrawalId/reject', adminController.rejectWithdrawal);

// Промокоды
router.post('/promo-codes', adminController.createPromoCode);
router.get('/promo-codes', adminController.getPromoCodes);
router.put('/promo-codes/:codeId', adminController.updatePromoCode);
router.delete('/promo-codes/:codeId', adminController.deletePromoCode);

export default router;
