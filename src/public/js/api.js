// Получить токен из localStorage
function getToken() {
  return localStorage.getItem('token');
}

// Установить токен
function setToken(token) {
  localStorage.setItem('token', token);
}

// Удалить токен
function removeToken() {
  localStorage.removeItem('token');
}

// Проверить авторизацию
function isAuthenticated() {
  return !!getToken();
}

// API запрос с автоматическим добавлением токена
async function apiCall(endpoint, options = {}) {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  // Если 401 - токен истек, выходим
  if (response.status === 401) {
    removeToken();
    window.location.href = '/login';
    return null;
  }

  return response;
}

// Auth API
const authAPI = {
  register: async (username, email, password, role = 'buyer') => {
    const response = await apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, confirmPassword: password, role })
    });
    return response?.json();
  },

  login: async (email, password) => {
    const response = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    return response?.json();
  },

  logout: async () => {
    const response = await apiCall('/api/auth/logout', {
      method: 'POST'
    });
    removeToken();
    return response?.json();
  },

  me: async () => {
    const response = await apiCall('/api/auth/me');
    return response?.json();
  },

  updateProfile: async (data) => {
    const response = await apiCall('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response?.json();
  }
};

// Products API
const productsAPI = {
  getAll: async (page = 1, limit = 20, categoryId = null, search = null) => {
    let url = `/api/products?page=${page}&limit=${limit}`;
    if (categoryId) url += `&categoryId=${categoryId}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    const response = await apiCall(url);
    return response?.json();
  },

  getById: async (id) => {
    const response = await apiCall(`/api/products/${id}`);
    return response?.json();
  },

  getMyProducts: async (page = 1, limit = 20) => {
    const response = await apiCall(`/api/products/seller/my-products?page=${page}&limit=${limit}`);
    return response?.json();
  },

  create: async (formData) => {
    const response = await apiCall('/api/products', {
      method: 'POST',
      headers: {}, // Удаляем Content-Type, browser установит multipart
      body: formData
    });
    return response?.json();
  },

  update: async (id, formData) => {
    const response = await apiCall(`/api/products/${id}`, {
      method: 'PUT',
      headers: {},
      body: formData
    });
    return response?.json();
  },

  delete: async (id) => {
    const response = await apiCall(`/api/products/${id}`, {
      method: 'DELETE'
    });
    return response?.json();
  },

  getBestSelling: async () => {
    const response = await apiCall('/api/products/best-selling');
    return response?.json();
  },

  getReviews: async (productId, page = 1, limit = 10) => {
    const response = await apiCall(`/api/products/${productId}/reviews?page=${page}&limit=${limit}`);
    return response?.json();
  },

  addKeys: async (productId, keys) => {
    const response = await apiCall(`/api/products/${productId}/keys`, {
      method: 'POST',
      body: JSON.stringify({ keys })
    });
    return response?.json();
  },

  getKeys: async (productId) => {
    const response = await apiCall(`/api/products/${productId}/keys`);
    return response?.json();
  }
};

// Orders API
const ordersAPI = {
  create: async (productId, quantity = 1, promoCode = null, buyerPhone = null) => {
    const response = await apiCall('/api/orders', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, promoCode, buyerPhone })
    });
    return response?.json();
  },

  getById: async (orderNumber) => {
    const response = await apiCall(`/api/orders/${orderNumber}`);
    return response?.json();
  },

  getMyOrders: async (page = 1, limit = 20) => {
    const response = await apiCall(`/api/orders?page=${page}&limit=${limit}`);
    return response?.json();
  },

  confirmPayment: async (orderNumber) => {
    const response = await apiCall(`/api/orders/${orderNumber}/confirm-payment`, {
      method: 'POST'
    });
    return response?.json();
  },

  leaveReview: async (orderNumber, rating, comment = null) => {
    const response = await apiCall(`/api/orders/${orderNumber}/review`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment })
    });
    return response?.json();
  }
};

// Seller API
const sellerAPI = {
  getDashboard: async () => {
    const response = await apiCall('/api/seller/dashboard');
    return response?.json();
  },

  getSalesHistory: async (page = 1, limit = 20) => {
    const response = await apiCall(`/api/seller/sales?page=${page}&limit=${limit}`);
    return response?.json();
  },

  getBalance: async () => {
    const response = await apiCall('/api/seller/balance');
    return response?.json();
  },

  requestWithdrawal: async (amount, walletAddress) => {
    const response = await apiCall('/api/seller/withdrawal', {
      method: 'POST',
      body: JSON.stringify({ amount, walletAddress })
    });
    return response?.json();
  },

  getWithdrawals: async (page = 1, limit = 20) => {
    const response = await apiCall(`/api/seller/withdrawal?page=${page}&limit=${limit}`);
    return response?.json();
  }
};

// Chat API
const chatAPI = {
  sendMessage: async (receiverId, message) => {
    const response = await apiCall('/api/chat/send', {
      method: 'POST',
      body: JSON.stringify({ receiverId, message })
    });
    return response?.json();
  },

  getMessages: async (otherUserId, limit = 50, offset = 0) => {
    const response = await apiCall(`/api/chat/messages?otherUserId=${otherUserId}&limit=${limit}&offset=${offset}`);
    return response?.json();
  },

  getDialogs: async (page = 1, limit = 20) => {
    const response = await apiCall(`/api/chat/dialogs?page=${page}&limit=${limit}`);
    return response?.json();
  },

  deleteDialog: async (otherUserId) => {
    const response = await apiCall(`/api/chat/dialogs/${otherUserId}`, {
      method: 'DELETE'
    });
    return response?.json();
  },

  getUnreadCount: async () => {
    const response = await apiCall('/api/chat/unread');
    return response?.json();
  }
};

// Admin API
const adminAPI = {
  getDashboard: async () => {
    const response = await apiCall('/api/admin/dashboard');
    return response?.json();
  },

  getPendingProducts: async (page = 1, limit = 20) => {
    const response = await apiCall(`/api/admin/products/pending?page=${page}&limit=${limit}`);
    return response?.json();
  },

  approveProduct: async (productId) => {
    const response = await apiCall(`/api/admin/products/${productId}/approve`, {
      method: 'POST'
    });
    return response?.json();
  },

  rejectProduct: async (productId, reason = null) => {
    const response = await apiCall(`/api/admin/products/${productId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    return response?.json();
  },

  getPendingWithdrawals: async (page = 1, limit = 20) => {
    const response = await apiCall(`/api/admin/withdrawals/pending?page=${page}&limit=${limit}`);
    return response?.json();
  },

  approveWithdrawal: async (withdrawalId) => {
    const response = await apiCall(`/api/admin/withdrawals/${withdrawalId}/approve`, {
      method: 'POST'
    });
    return response?.json();
  },

  rejectWithdrawal: async (withdrawalId, reason = null) => {
    const response = await apiCall(`/api/admin/withdrawals/${withdrawalId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    return response?.json();
  },

  createPromoCode: async (code, discountPercent, discountAmount, maxUses, minOrderAmount, validUntil) => {
    const response = await apiCall('/api/admin/promo-codes', {
      method: 'POST',
      body: JSON.stringify({ code, discountPercent, discountAmount, maxUses, minOrderAmount, validUntil })
    });
    return response?.json();
  },

  getPromoCodes: async (page = 1, limit = 20) => {
    const response = await apiCall(`/api/admin/promo-codes?page=${page}&limit=${limit}`);
    return response?.json();
  },

  updatePromoCode: async (codeId, isActive) => {
    const response = await apiCall(`/api/admin/promo-codes/${codeId}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive })
    });
    return response?.json();
  },

  deletePromoCode: async (codeId) => {
    const response = await apiCall(`/api/admin/promo-codes/${codeId}`, {
      method: 'DELETE'
    });
    return response?.json();
  }
};

// Cart management in localStorage
const cart = {
  getItems: () => {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  },

  addItem: (productId, quantity = 1) => {
    const items = cart.getItems();
    const existingItem = items.find(item => item.productId === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      items.push({ productId, quantity });
    }
    
    localStorage.setItem('cart', JSON.stringify(items));
  },

  removeItem: (productId) => {
    let items = cart.getItems();
    items = items.filter(item => item.productId !== productId);
    localStorage.setItem('cart', JSON.stringify(items));
  },

  updateQuantity: (productId, quantity) => {
    const items = cart.getItems();
    const item = items.find(item => item.productId === productId);
    
    if (item) {
      if (quantity <= 0) {
        cart.removeItem(productId);
      } else {
        item.quantity = quantity;
        localStorage.setItem('cart', JSON.stringify(items));
      }
    }
  },

  clear: () => {
    localStorage.removeItem('cart');
  },

  getTotal: async () => {
    const items = cart.getItems();
    let total = 0;

    for (const item of items) {
      try {
        const data = await productsAPI.getById(item.productId);
        total += data.product.price * item.quantity;
      } catch (err) {
        console.error('Error getting product:', err);
      }
    }

    return total;
  }
};
