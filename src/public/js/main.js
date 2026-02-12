// Обновить меню пользователя
async function updateUserMenu() {
  const userMenu = document.getElementById('userMenu');
  if (!userMenu) return;

  const token = getToken();
  
  if (token) {
    try {
      const data = await authAPI.me();
      if (data && data.user) {
        const user = data.user;
        userMenu.innerHTML = `
          <a href="/profile" class="btn btn-secondary btn-small">
            <i class="fas fa-user"></i> ${user.username}
          </a>
          <button class="btn btn-primary btn-small" onclick="logout()">
            <i class="fas fa-sign-out-alt"></i> Выход
          </button>
        `;
      }
    } catch (err) {
      console.error('Error updating user menu:', err);
      removeToken();
    }
  }
}

// Logout
async function logout() {
  await authAPI.logout();
  removeToken();
  window.location.href = '/';
}

// Форматирование цены
function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB'
  }).format(price);
}

// Форматирование даты
function formatDate(date) {
  return new Date(date).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Показать/скрыть загрузчик
function showLoader() {
  document.body.innerHTML += `
    <div id="loader" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999;">
      <div class="spinner"></div>
    </div>
  `;
}

function hideLoader() {
  const loader = document.getElementById('loader');
  if (loader) loader.remove();
}

// Показать уведомление
function showNotification(message, type = 'success', duration = 3000) {
  const id = 'notification-' + Date.now();
  const html = `
    <div id="${id}" class="alert alert-${type}" style="position: fixed; top: 20px; right: 20px; z-index: 1000; max-width: 400px; animation: slideIn 0.3s ease;">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', html);
  
  setTimeout(() => {
    const element = document.getElementById(id);
    if (element) {
      element.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => element.remove(), 300);
    }
  }, duration);
}

// CSS для анимаций
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  updateUserMenu();
});

// Проверить требует ли страница авторизации
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/login';
    return false;
  }
  return true;
}

// Проверить требует ли страница роли продавца
async function requireSellerAuth() {
  if (!requireAuth()) return false;

  try {
    const data = await authAPI.me();
    if (data && data.user && (data.user.role === 'seller' || data.user.role === 'admin')) {
      return true;
    }
  } catch (err) {
    console.error('Error checking seller auth:', err);
  }

  window.location.href = '/';
  return false;
}

// Проверить требует ли страница роли админ
async function requireAdminAuth() {
  if (!requireAuth()) return false;

  try {
    const data = await authAPI.me();
    if (data && data.user && data.user.role === 'admin') {
      return true;
    }
  } catch (err) {
    console.error('Error checking admin auth:', err);
  }

  window.location.href = '/';
  return false;
}

// Копировать в буфер обмена
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showNotification('Скопировано в буфер обмена!', 'success');
  }).catch(err => {
    console.error('Error copying to clipboard:', err);
    showNotification('Ошибка при копировании', 'danger');
  });
}

// Timer для кнопки оплаты (20 секунд)
function startPaymentTimer(buttonElement, callback) {
  let seconds = 20;
  const originalText = buttonElement.innerHTML;
  
  const timer = setInterval(() => {
    if (seconds <= 0) {
      clearInterval(timer);
      buttonElement.innerHTML = originalText;
      buttonElement.disabled = false;
      if (callback) callback();
    } else {
      buttonElement.innerHTML = `<i class="fas fa-clock"></i> Я оплатил (${seconds}s)`;
      buttonElement.disabled = true;
      seconds--;
    }
  }, 1000);
}

// Валидация форм
function validateForm(formElement) {
  const inputs = formElement.querySelectorAll('[required]');
  let isValid = true;

  inputs.forEach(input => {
    if (!input.value.trim()) {
      isValid = false;
      input.style.borderColor = 'var(--danger)';
    } else {
      input.style.borderColor = '';
    }
  });

  return isValid;
}

// URL параметры
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const obj = {};
  for (const [key, value] of params) {
    obj[key] = value;
  }
  return obj;
}

// Устанавливать URL параметры без перезагрузки
function setUrlParams(params) {
  const url = new URL(window.location);
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
  }
  window.history.replaceState({}, '', url);
}

// Pagination helper
function createPaginationButtons(currentPage, totalPages, onPageChange) {
  let html = '';

  // Предыдущая страница
  if (currentPage > 1) {
    html += `<button class="btn btn-secondary btn-small" onclick="handlePageChange(${currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;
  }

  // Номера страниц
  const maxButtons = 5;
  const startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  const endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (startPage > 1) {
    html += `<button class="btn btn-secondary btn-small" onclick="handlePageChange(1)">1</button>`;
    if (startPage > 2) html += `<span>...</span>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      html += `<button class="btn btn-primary btn-small">${i}</button>`;
    } else {
      html += `<button class="btn btn-secondary btn-small" onclick="handlePageChange(${i})">${i}</button>`;
    }
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span>...</span>`;
    html += `<button class="btn btn-secondary btn-small" onclick="handlePageChange(${totalPages})">${totalPages}</button>`;
  }

  // Следующая страница
  if (currentPage < totalPages) {
    html += `<button class="btn btn-secondary btn-small" onclick="handlePageChange(${currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
  }

  return html;
}

// Обработка изменения страницы
function handlePageChange(page) {
  setUrlParams({ page });
  window.location.reload();
}

// Инициализация chat widget
function initChatWidget() {
  if (!isAuthenticated()) return;

  const html = `
    <div class="chat-widget">
      <button class="chat-button" id="chatButton" onclick="toggleChatWindow()">
        <i class="fas fa-comments"></i>
      </button>
      <div class="chat-window" id="chatWindow">
        <div class="chat-header">
          <span>Поддержка ZVERASS</span>
          <button onclick="toggleChatWindow()" style="background: none; border: none; color: white; cursor: pointer;">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="chat-messages" id="chatMessages"></div>
        <div class="chat-input">
          <input type="text" id="chatInput" placeholder="Сообщение...">
          <button onclick="sendChatMessage()">Отправить</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);
}

function toggleChatWindow() {
  const chatWindow = document.getElementById('chatWindow');
  chatWindow?.classList.toggle('active');
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  
  if (!message) return;

  try {
    // Здесь можно отправить сообщение на сервер
    // await chatAPI.sendMessage(supportUserId, message);
    
    showNotification('Сообщение отправлено', 'success');
    input.value = '';
  } catch (err) {
    console.error('Error sending message:', err);
    showNotification('Ошибка при отправке сообщения', 'danger');
  }
}
