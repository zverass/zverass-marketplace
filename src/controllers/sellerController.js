import Order from '../models/Order.js';
import Withdrawal from '../models/Withdrawal.js';
import User from '../models/User.js';

export const getDashboard = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const stats = await Order.getStats(sellerId);
    const balance = await User.getBalance(sellerId);
    const pendingWithdrawal = await Withdrawal.getTotalPending(sellerId);

    res.json({
      stats: {
        total_orders: stats.total_orders || 0,
        completed_orders: stats.completed_orders || 0,
        total_revenue: stats.total_revenue || 0
      },
      balance,
      pending_withdrawal: pendingWithdrawal
    });
  } catch (err) {
    console.error('Get dashboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getSalesHistory = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const orders = await Order.findBySellerId(sellerId, parseInt(limit), offset);

    res.json({
      orders,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('Get sales history error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const requestWithdrawal = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { amount, walletAddress } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const balance = await User.getBalance(sellerId);
    if (balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Резервируем деньги (вычитаем из баланса)
    await User.updateBalance(sellerId, -amount);

    // Создаем заявку на вывод
    const withdrawal = await Withdrawal.create(sellerId, amount, walletAddress);

    res.status(201).json({
      message: 'Withdrawal request created',
      withdrawal,
      new_balance: await User.getBalance(sellerId)
    });
  } catch (err) {
    console.error('Request withdrawal error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getWithdrawals = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const withdrawals = await Withdrawal.findBySellerId(sellerId, parseInt(limit), offset);

    res.json({
      withdrawals,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('Get withdrawals error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getBalance = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const balance = await User.getBalance(sellerId);
    const pendingWithdrawal = await Withdrawal.getTotalPending(sellerId);

    res.json({
      balance,
      pending_withdrawal: pendingWithdrawal,
      available_balance: balance - pendingWithdrawal
    });
  } catch (err) {
    console.error('Get balance error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
