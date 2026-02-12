import Order from '../models/Order.js';
import Product from '../models/Product.js';
import PromoCode from '../models/PromoCode.js';
import ProductKey from '../models/ProductKey.js';
import Review from '../models/Review.js';
import User from '../models/User.js';

export const createOrder = async (req, res) => {
  try {
    const { productId, quantity = 1, promoCode, buyerPhone } = req.body;
    const buyerId = req.user.id;

    // Получаем товар
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.status !== 'approved') {
      return res.status(400).json({ error: 'Product not available' });
    }

    let totalPrice = product.price * quantity;
    let promoCodeId = null;
    let discountAmount = 0;

    // Проверяем промокод
    if (promoCode) {
      const promo = await PromoCode.findByCode(promoCode);
      if (promo && promo.min_order_amount <= totalPrice) {
        promoCodeId = promo.id;
        
        if (promo.discount_percent) {
          discountAmount = (totalPrice * promo.discount_percent) / 100;
        } else {
          discountAmount = promo.discount_amount;
        }

        totalPrice -= discountAmount;
        await PromoCode.incrementUses(promo.id);
      }
    }

    // Создаем заказ
    const order = await Order.create(
      buyerId,
      product.seller_id,
      productId,
      quantity,
      product.price,
      totalPrice,
      promoCodeId,
      discountAmount,
      buyerPhone
    );

    res.status(201).json({
      message: 'Order created',
      order,
      support_phone: process.env.SUPPORT_PHONE,
      support_telegram: process.env.SUPPORT_TELEGRAM
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const userId = req.user.id;

    const order = await Order.findByOrderNumber(orderNumber);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Проверяем доступ
    if (order.buyer_id !== userId && order.seller_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Получаем отзыв, если есть
    const review = await Review.findByOrderId(order.id);

    res.json({
      order,
      review
    });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const orders = await Order.findByBuyerId(buyerId, parseInt(limit), offset);

    res.json({
      orders,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('Get my orders error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const userId = req.user.id;

    const order = await Order.findByOrderNumber(orderNumber);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.buyer_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (order.payment_confirmed) {
      return res.status(400).json({ error: 'Payment already confirmed' });
    }

    // Если товар требует автовыдачи, берем ключ
    let deliveredKey = null;
    const product = await Product.findById(order.product_id);
    
    if (product.auto_delivery) {
      const keys = await ProductKey.getUnused(order.product_id, 1);
      if (keys.length > 0) {
        deliveredKey = keys[0].key_value;
        await ProductKey.markAsUsed(keys[0].id, userId);
      } else {
        return res.status(400).json({ error: 'No keys available for this product' });
      }
    }

    // Подтверждаем платеж
    const updated = await Order.confirmPayment(order.id, deliveredKey);

    // Увеличиваем счетчик продаж
    await Product.incrementSalesCount(order.product_id);

    // Добавляем деньги продавцу (85%)
    const sellerEarnings = parseFloat((order.total_price * 0.85).toFixed(2));
    await User.updateBalance(order.seller_id, sellerEarnings);

    res.json({
      message: 'Payment confirmed',
      order: updated,
      deliveredKey: deliveredKey
    });
  } catch (err) {
    console.error('Confirm payment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const leaveReview = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { rating, comment } = req.body;
    const buyerId = req.user.id;

    const order = await Order.findByOrderNumber(orderNumber);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.buyer_id !== buyerId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (!order.payment_confirmed) {
      return res.status(400).json({ error: 'Can only review completed orders' });
    }

    // Проверяем, есть ли уже отзыв
    const existingReview = await Review.findByOrderId(order.id);
    if (existingReview) {
      return res.status(400).json({ error: 'Review already exists for this order' });
    }

    // Создаем отзыв
    const review = await Review.create(
      order.id,
      buyerId,
      order.seller_id,
      order.product_id,
      rating,
      comment
    );

    // Обновляем рейтинги
    await Product.updateRating(order.product_id);
    await User.updateRating(order.seller_id);

    res.status(201).json({
      message: 'Review created',
      review
    });
  } catch (err) {
    console.error('Leave review error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getPendingOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const orders = await Order.getPendingPaymentOrders(parseInt(limit) + offset);
    const paginatedOrders = orders.slice(offset, offset + parseInt(limit));

    res.json({
      orders: paginatedOrders,
      page: parseInt(page),
      limit: parseInt(limit),
      total: orders.length
    });
  } catch (err) {
    console.error('Get pending orders error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
