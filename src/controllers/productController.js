import Product from '../models/Product.js';
import ProductKey from '../models/ProductKey.js';
import Review from '../models/Review.js';

export const createProduct = async (req, res) => {
  try {
    const { categoryId, name, description, price, autoDelivery } = req.body;
    const sellerId = req.user.id;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!categoryId || !name || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const product = await Product.create(
      sellerId,
      categoryId,
      name,
      description,
      price,
      imageUrl,
      autoDelivery === 'true' || autoDelivery === true
    );

    res.status(201).json({
      message: 'Product created',
      product
    });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Получаем отзывы
    const reviews = await Review.findByProductId(id, 10, 0);

    res.json({
      product,
      reviews
    });
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, categoryId, search } = req.query;
    const offset = (page - 1) * limit;

    const products = await Product.getAllApproved(
      parseInt(limit),
      offset,
      categoryId ? parseInt(categoryId) : null,
      search || null
    );

    res.json({
      products,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getMyProducts = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const products = await Product.findBySellerId(sellerId, parseInt(limit), offset);

    res.json({
      products,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('Get my products error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, categoryId } = req.body;
    const sellerId = req.user.id;

    // Проверяем, что это товар продавца
    const product = await Product.findById(id);
    if (!product || product.seller_id !== sellerId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = price;
    if (categoryId) updateData.category_id = categoryId;
    if (req.file) updateData.image_url = `/uploads/${req.file.filename}`;

    const updated = await Product.update(id, updateData);
    res.json({
      message: 'Product updated',
      product: updated
    });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    const product = await Product.findById(id);
    if (!product || product.seller_id !== sellerId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Product.delete(id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const addProductKeys = async (req, res) => {
  try {
    const { id } = req.params;
    const { keys } = req.body; // Array of key strings
    const sellerId = req.user.id;

    // Проверяем, что это товар продавца
    const product = await Product.findById(id);
    if (!product || product.seller_id !== sellerId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const createdKeys = [];
    for (const keyValue of keys) {
      const key = await ProductKey.create(id, keyValue);
      createdKeys.push(key);
    }

    res.status(201).json({
      message: `${createdKeys.length} keys added`,
      keys: createdKeys
    });
  } catch (err) {
    console.error('Add keys error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getProductKeys = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    const product = await Product.findById(id);
    if (!product || product.seller_id !== sellerId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const unusedCount = await ProductKey.getUnusedCount(id);
    const history = await ProductKey.getUsageHistory(id, 20, 0);

    res.json({
      unusedCount,
      history
    });
  } catch (err) {
    console.error('Get product keys error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const reviews = await Review.findByProductId(id, parseInt(limit), offset);

    res.json({
      reviews,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getBestSelling = async (req, res) => {
  try {
    const products = await Product.getBestSelling(10);
    res.json({ products });
  } catch (err) {
    console.error('Get best selling error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
