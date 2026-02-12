import express from 'express';
import * as productController from '../controllers/productController.js';
import { verifyToken, optionalAuth } from '../middleware/auth.js';
import { isSeller } from '../middleware/roles.js';
import { uploadImage } from '../middleware/upload.js';

const router = express.Router();

// Публичные роуты
router.get('/', productController.getProducts);
router.get('/best-selling', productController.getBestSelling);
router.get('/:id', optionalAuth, productController.getProduct);

// Роуты для продавцов
router.post('/', verifyToken, isSeller, uploadImage, productController.createProduct);
router.get('/seller/my-products', verifyToken, isSeller, productController.getMyProducts);
router.put('/:id', verifyToken, isSeller, uploadImage, productController.updateProduct);
router.delete('/:id', verifyToken, isSeller, productController.deleteProduct);

// Ключи для автовыдачи
router.post('/:id/keys', verifyToken, isSeller, productController.addProductKeys);
router.get('/:id/keys', verifyToken, isSeller, productController.getProductKeys);

// Отзывы
router.get('/:id/reviews', productController.getProductReviews);

export default router;
