import Product from '../models/Product.js';
import PromoCode from '../models/PromoCode.js';
import Withdrawal from '../models/Withdrawal.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

export const getDashboard = async (req, res) => {
  try {
    const pendingProducts = await Product.getPending(1000, 0);
    const pendingWithdrawals = await Withdrawal.getPending(1000, 0);

    res.json({
      pendingProductsCount: pendingProducts.length,
      pendingWithdrawalsCount: pendingWithdrawals.length
    });
  } catch (err) {
    console.error('Get dashboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getPendingProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const products = await Product.getPending(parseInt(limit), offset);

    res.json({
      products,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('Get pending products error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const approveProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.updateStatus(productId, 'approved');
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      message: 'Product approved',
      product
    });
  } catch (err) {
    console.error('Approve product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const rejectProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body;

    const product = await Product.updateStatus(productId, 'rejected');
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      message: 'Product rejected',
      product
    });
  } catch (err) {
    console.error('Reject product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getPendingWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const withdrawals = await Withdrawal.getPending(parseInt(limit), offset);

    res.json({
      withdrawals,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('Get pending withdrawals error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const approveWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const adminId = req.user.id;

    const withdrawal = await Withdrawal.updateStatus(withdrawalId, 'approved', adminId);
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    res.json({
      message: 'Withdrawal approved',
      withdrawal
    });
  } catch (err) {
    console.error('Approve withdrawal error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const rejectWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    const withdrawal = await Withdrawal.updateStatus(withdrawalId, 'rejected', adminId);
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    // Возвращаем деньги продавцу
    await User.updateBalance(withdrawal.seller_id, withdrawal.amount);

    res.json({
      message: 'Withdrawal rejected',
      withdrawal
    });
  } catch (err) {
    console.error('Reject withdrawal error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createPromoCode = async (req, res) => {
  try {
    const { code, discountPercent, discountAmount, maxUses, minOrderAmount, validUntil } = req.body;
    const adminId = req.user.id;

    const promo = await PromoCode.create(
      code,
      discountPercent || 0,
      discountAmount || 0,
      maxUses || -1,
      minOrderAmount || 0,
      null,
      validUntil || null,
      adminId
    );

    res.status(201).json({
      message: 'Promo code created',
      promo
    });
  } catch (err) {
    console.error('Create promo code error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getPromoCodes = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const codes = await PromoCode.getAll(parseInt(limit), offset);

    res.json({
      codes,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('Get promo codes error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updatePromoCode = async (req, res) => {
  try {
    const { codeId } = req.params;
    const { isActive } = req.body;

    const promo = await PromoCode.updateStatus(codeId, isActive);
    if (!promo) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    res.json({
      message: 'Promo code updated',
      promo
    });
  } catch (err) {
    console.error('Update promo code error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deletePromoCode = async (req, res) => {
  try {
    const { codeId } = req.params;

    const result = await PromoCode.delete(codeId);
    if (!result) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    res.json({ message: 'Promo code deleted' });
  } catch (err) {
    console.error('Delete promo code error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
