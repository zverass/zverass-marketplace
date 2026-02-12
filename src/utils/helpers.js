export const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `ZVR-${timestamp}-${random}`;
};

export const calculateSellerEarnings = (totalPrice) => {
  // Продавец получает 85% от цены
  return parseFloat((totalPrice * 0.85).toFixed(2));
};

export const calculatePlatformFee = (totalPrice) => {
  // Платформа берет 15%
  return parseFloat((totalPrice * 0.15).toFixed(2));
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUsername = (username) => {
  // 3-20 символов, буквы, цифры, подчеркивание
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

export const validatePhoneNumber = (phone) => {
  // Базовая валидация
  const phoneRegex = /^\+?[0-9\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.length >= 10;
};

export const formatPrice = (price) => {
  return parseFloat(price).toFixed(2);
};
