// Конфігурація
const CONFIG = {
  // Отримуємо API ключ з безпечного сховища або використовуємо пустий рядок за замовчуванням
  WOT_API_KEY: '',
  WOT_API_URL: "https://api.worldoftanks.eu/wot"
};

// Глобальні змінні для зберігання стану
let currentPlayer = null;
let playerBattles = [];
let originalBattles = []; // Зберігаємо оригінальні дані для фільтрування

// DOM елементи
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');
const loadBattlesBtn = document.getElementById('load-battles-btn');
const openTomatoBtn = document.getElementById('open-tomato-btn');
const openWotBtn = document.getElementById('open-wot-btn');

// Ініціалізація програми
function initApp() {
  // Встановлюємо значення поля API ключа - безпечно завантаженого з сховища
  CONFIG.WOT_API_KEY = getSecureApiKey();
  
  // Налаштовуємо обробники подій
  document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
  document.getElementById('search-player-btn').addEventListener('click', searchPlayer);
  document.getElementById('player-nickname').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      searchPlayer();
    }
  });
  loadBattlesBtn.addEventListener('click', loadPlayerBattles);
  openTomatoBtn.addEventListener('click', openTomatoGGProfile);
  openWotBtn.addEventListener('click', openWotProfile);
  
  // Додаємо обробники для фільтрів
  document.getElementById('tank-type-filter').addEventListener('change', filterBattles);
  document.getElementById('tier-filter').addEventListener('change', filterBattles);
  
  // Додаємо обробники для повзунків
  const battlesRange = document.getElementById('battles-range');
  const battlesValue = document.getElementById('battles-value');
  battlesRange.addEventListener('input', function() {
    battlesValue.textContent = this.value;
  });
  
  const daysRange = document.getElementById('days-range');
  const daysValue = document.getElementById('days-value');
  daysRange.addEventListener('input', function() {
    daysValue.textContent = this.value;
  });
  
  // Ініціалізуємо обробники для сповіщень
  initNotifications();
}

// Безпечне зберігання API ключа
function getSecureApiKey() {
  try {
    // Використовуємо зашифроване сховище, якщо доступно
    if (window.crypto && window.crypto.subtle && localStorage.getItem('encryptedApiKey')) {
      // У реальній реалізації ми б розшифрували тут
      // Для простоти просто отримуємо з localStorage
      return localStorage.getItem('wotApiKey') || '';
    }
    return localStorage.getItem('wotApiKey') || '';
  } catch (error) {
    console.error('Помилка отримання API ключа:', error);
    return '';
  }
}

// Безпечне збереження API ключа
function saveSecureApiKey(apiKey) {
  try {
    // У реальній реалізації ми б зашифрували API ключ
    // Для простоти просто зберігаємо в localStorage
    localStorage.setItem('wotApiKey', apiKey);
    return true;
  } catch (error) {
    console.error('Помилка збереження API ключа:', error);
    return false;
  }
}

// Ініціалізація обробників сповіщень
function initNotifications() {
  // Додаємо обробники подій для кнопок закриття
  const closeButtons = document.querySelectorAll('.alert-close');
  closeButtons.forEach(btn => {
    btn.onclick = function() {
      const alert = this.parentElement;
      hideMessage(alert);
    };
  });
}

// Збереження налаштувань
function saveSettings() {
  const apiKey = document.getElementById('wot-api-key').value.trim();
  
  if (!apiKey) {
    showMessage('Будь ласка, введіть коректний API ключ', 'error');
    return;
  }
  
  if (saveSecureApiKey(apiKey)) {
    CONFIG.WOT_API_KEY = apiKey;
    showMessage('Налаштування збережено успішно', 'success');
  } else {
    showMessage('Не вдалося зберегти налаштування', 'error');
  }
}

// Очищення даних попереднього гравця
function clearPreviousPlayerData() {
  // Очищаємо дані про бої
  playerBattles = [];
  originalBattles = [];
  
  // Ховаємо картку боїв, якщо вона відображається
  document.getElementById('battles-list-card').style.display = 'none';
  
  // Очищаємо список танків
  const tanksListDiv = document.getElementById('tanks-list');
  if (tanksListDiv) {
    tanksListDiv.innerHTML = '';
  }
  
  // Скидаємо статистику
  document.getElementById('total-battles').textContent = '0';
  document.getElementById('avg-winrate').textContent = '0%';
  document.getElementById('avg-damage').textContent = '0';
  document.getElementById('avg-frags').textContent = '0';
}

// Пошук гравця
async function searchPlayer() {
  const nickname = document.getElementById('player-nickname').value.trim();
  const server = document.getElementById('server').value;
  
  if (!nickname) {
    showMessage('Введіть нікнейм гравця', 'error');
    return;
  }
  
  if (!CONFIG.WOT_API_KEY) {
    showMessage('API ключ відсутній. Будь ласка, введіть ваш WoT API ключ в налаштуваннях.', 'error');
    return;
  }
  
  try {
    // Показуємо стан завантаження
    document.getElementById('player-nickname').disabled = true;
    document.getElementById('server').disabled = true;
    document.getElementById('search-player-btn').disabled = true;
    document.getElementById('search-player-btn').innerHTML = '<span class="material-symbols-rounded">hourglass_empty</span>';
    
    // Очищаємо дані попереднього гравця
    clearPreviousPlayerData();
    
    // Отримуємо дані гравця
    const player = await getPlayerByNickname(nickname, server);
    
    if (!player) {
      showMessage(`Гравця з нікнеймом "${nickname}" не знайдено`, 'error');
      resetSearchForm();
      return;
    }
    
    // Зберігаємо дані гравця
    currentPlayer = {
      id: player.account_id,
      nickname: player.nickname,
      server: server
    };
    
    // Отримуємо детальну інформацію про гравця
    const playerDetails = await getPlayerDetails(player.account_id, server);
    
    if (playerDetails) {
      currentPlayer.details = playerDetails;
    }
    
    // Відображаємо інформацію про гравця
    displayPlayerInfo();
    
    // Активуємо кнопки дій
    loadBattlesBtn.disabled = false;
    openTomatoBtn.disabled = false;
    openWotBtn.disabled = false;
    
    // Показуємо картку з інформацією про гравця
    document.getElementById('player-info-card').style.display = 'block';
    
    showMessage(`Гравця "${player.nickname}" знайдено`, 'success');
  } catch (error) {
    console.error('Помилка пошуку гравця:', error);
    showMessage('Помилка: ' + error.message, 'error');
  } finally {
    resetSearchForm();
  }
}

// Відновлення форми пошуку
function resetSearchForm() {
  document.getElementById('player-nickname').disabled = false;
  document.getElementById('server').disabled = false;
  document.getElementById('search-player-btn').disabled = false;
  document.getElementById('search-player-btn').innerHTML = '<span class="material-symbols-rounded">search</span>';
}

// Отримання гравця за нікнеймом
async function getPlayerByNickname(nickname, server = 'EU') {
  try {
    // Вибираємо правильний домен API відповідно до сервера
    let apiDomain = "https://api.worldoftanks.eu/wot";
    
    switch(server) {
      case "NA":
        apiDomain = "https://api.worldoftanks.com/wot";
        break;
      case "ASIA":
        apiDomain = "https://api.worldoftanks.asia/wot";
        break;
    }
    
    const url = `${apiDomain}/account/list/?application_id=${CONFIG.WOT_API_KEY}&search=${encodeURIComponent(nickname)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'ok' && data.data && data.data.length > 0) {
      const exactMatch = data.data.find(player => 
        player.nickname.toLowerCase() === nickname.toLowerCase()
      );
      
      return exactMatch || data.data[0];
    }
    
    return null;
  } catch (error) {
    console.error('Помилка отримання даних гравця:', error);
    throw new Error('Не вдалося отримати дані гравця');
  }
}

// Отримання детальної інформації про гравця
async function getPlayerDetails(accountId, server = 'EU') {
  try {
    // Вибираємо правильний домен API відповідно до сервера
    let apiDomain = "https://api.worldoftanks.eu/wot";
    
    switch(server) {
      case "NA":
        apiDomain = "https://api.worldoftanks.com/wot";
        break;
      case "ASIA":
        apiDomain = "https://api.worldoftanks.asia/wot";
        break;
    }
    
    const url = `${apiDomain}/account/info/?application_id=${CONFIG.WOT_API_KEY}&account_id=${accountId}&fields=statistics.all,global_rating,clan_id,last_battle_time`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'ok' && data.data && data.data[accountId]) {
      // Якщо є clan_id, запитуємо дані про клан
      const playerData = data.data[accountId];
      
      if (playerData.clan_id) {
        try {
          const clanData = await getClanInfo(playerData.clan_id, server);
          if (clanData) {
            playerData.clan = clanData;
          }
        } catch (e) {
          console.error('Помилка отримання інформації про клан:', e);
        }
      }
      
      return playerData;
    }
    
    return null;
  } catch (error) {
    console.error('Помилка отримання детальної інформації про гравця:', error);
    return null;
  }
}

// Отримання інформації про клан
async function getClanInfo(clanId, server = 'EU') {
  try {
    // Вибираємо правильний домен API відповідно до сервера
    let apiDomain = "https://api.worldoftanks.eu/wot";
    
    switch(server) {
      case "NA":
        apiDomain = "https://api.worldoftanks.com/wot";
        break;
      case "ASIA":
        apiDomain = "https://api.worldoftanks.asia/wot";
        break;
    }
    
    // Розширюємо поля запиту, щоб отримати всі розміри емблем
    const url = `${apiDomain}/clans/info/?application_id=${CONFIG.WOT_API_KEY}&clan_id=${clanId}&fields=tag,name,emblems.x24,emblems.x32,emblems.x64,emblems.x195,emblems.x256`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'ok' && data.data && data.data[clanId]) {
      return data.data[clanId];
    }
    
    return null;
  } catch (error) {
    console.error('Помилка отримання інформації про клан:', error);
    return null;
  }
}

// Відображення інформації про гравця
function displayPlayerInfo() {
  if (!currentPlayer) return;
  
  const playerInfoDiv = document.getElementById('player-info');
  let html = '<div class="player-info-container">';
  
  // Аватар (з клану або перша літера нікнейму)
  html += '<div class="player-avatar">';
  if (currentPlayer.details && currentPlayer.details.clan) {
    // Якщо гравець у клані, використовуємо емблему клану
    if (currentPlayer.details.clan.emblems && currentPlayer.details.clan.emblems.x195) {
      html += `<img src="${currentPlayer.details.clan.emblems.x195.portal}" alt="Клановий аватар">`;
    } else {
      html += `<div class="avatar-placeholder">${currentPlayer.nickname.charAt(0).toUpperCase()}</div>`;
    }
  } else {
    // Якщо гравець не в клані, відображаємо першу літеру нікнейму
    html += `<div class="avatar-placeholder">${currentPlayer.nickname.charAt(0).toUpperCase()}</div>`;
  }
  html += '</div>';
  
  html += '<div class="player-details">';
  
  // Ім'я гравця та клан
  html += '<div class="player-name-container">';
  html += `<div class="player-name">${currentPlayer.nickname}</div>`;
  
  // Клан (якщо є)
  if (currentPlayer.details && currentPlayer.details.clan) {
    html += `<div class="player-clan">[${currentPlayer.details.clan.tag}]</div>`;
  }
  html += '</div>';
  
  // Останній бій
  if (currentPlayer.details && currentPlayer.details.last_battle_time) {
    const lastBattleTime = new Date(currentPlayer.details.last_battle_time * 1000);
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    html += `<div class="player-last-battle">
      <span class="material-symbols-rounded">schedule</span>
      Останній бій: ${lastBattleTime.toLocaleDateString('uk-UA', dateOptions)}
    </div>`;
  }
  
  // Статистика гравця
  if (currentPlayer.details && currentPlayer.details.statistics && currentPlayer.details.statistics.all) {
    const stats = currentPlayer.details.statistics.all;
    
    html += '<div class="player-stats-container">';
    
    // Основні показники
    html += createStatCard('Боїв', stats.battles.toLocaleString());
    html += createStatCard('% перемог', `${(stats.wins / stats.battles * 100).toFixed(2)}%`, getWinrateColor(stats.wins / stats.battles * 100));
    html += createStatCard('Сер. шкода', (stats.damage_dealt / stats.battles).toFixed(0));
    html += createStatCard('Сер. фраги', (stats.frags / stats.battles).toFixed(2));
    html += createStatCard('Виявлення', (stats.spotted / stats.battles).toFixed(2));
    html += createStatCard('Захист', (stats.dropped_capture_points / stats.battles).toFixed(1));
    
    html += '</div>'; // player-stats-container
  }
  
  html += '</div>'; // player-details
  html += '</div>'; // player-info-container
  
  playerInfoDiv.innerHTML = html;
}

// Створення картки статистики
function createStatCard(label, value, color = null) {
  const colorStyle = color ? `color: ${color};` : '';
  
  return `
  <div class="player-stat">
    <div class="stat-value" style="${colorStyle}">${value}</div>
    <div class="stat-label">${label}</div>
  </div>
  `;
}

// Завантаження останніх боїв гравця з Tomato.gg
async function loadPlayerBattles() {
  if (!currentPlayer) {
    showMessage('Спочатку знайдіть гравця', 'error');
    return;
  }
  
  // Отримуємо параметри запиту
  const battles = document.getElementById('battles-range').value;
  const days = document.getElementById('days-range').value;
  
  // Показуємо індикатор завантаження
  document.getElementById('battles-list-card').style.display = 'block';
  document.getElementById('loader-container').style.display = 'flex';
  document.getElementById('tanks-list').style.display = 'none';
  document.getElementById('stats-summary').style.display = 'none';
  
  // Оновлюємо текст завантаження
  const loadingText = `Завантаження боїв для ${currentPlayer.nickname} (${currentPlayer.server})...`;
  document.getElementById('battles-loading-text').textContent = loadingText;
  
  try {
    // Деактивуємо кнопку завантаження
    loadBattlesBtn.disabled = true;
    loadBattlesBtn.innerHTML = `<span class="material-symbols-rounded">hourglass_empty</span> Завантаження...`;
    
    // Завантажуємо бої з Tomato.gg
    const battlesList = await getPlayerRecentBattlesFromTomato(
      currentPlayer.id, 
      currentPlayer.server, 
      document.getElementById('days-range').value,
      document.getElementById('battles-range').value
    );
    
    // Зберігаємо бої
    playerBattles = battlesList;
    originalBattles = [...battlesList]; // Копіюємо для фільтрації
    
    // Відображаємо бої
    displayPlayerBattles(battlesList);
    
    const successMessage = `Завантажено статистику за ${document.getElementById('days-range').value} днів`;
    showMessage(successMessage, 'success');
  } catch (error) {
    console.error('Помилка завантаження боїв:', error);
    
    // Показуємо повідомлення про помилку
    const tanksListDiv = document.getElementById('tanks-list');
    tanksListDiv.style.display = 'block';
    
    const errorLoadingData = 'Помилка завантаження даних';
    const errorHelp = 'Спробуйте оновити сторінку або перевірте підключення до Інтернету. Також можливо, що сервіс Tomato.gg тимчасово недоступний.';
    
    tanksListDiv.innerHTML = `
      <div class="error-container">
        <div class="error-icon"><span class="material-symbols-rounded">error</span></div>
        <div class="error-message">${errorLoadingData}</div>
        <div class="error-description">${error.message}</div>
        <div class="error-help">${errorHelp}</div>
      </div>
    `;
    
    document.getElementById('stats-summary').style.display = 'none';
    document.getElementById('loader-container').style.display = 'none';
    
    showMessage(`Помилка завантаження боїв: ${error.message}`, 'error');
  } finally {
    // Відновлюємо кнопку завантаження
    loadBattlesBtn.disabled = false;
    loadBattlesBtn.innerHTML = `<span class="material-symbols-rounded">download</span> Завантажити бої`;
  }
}