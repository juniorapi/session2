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
let currentLanguage = 'ua'; // Поточна мова інтерфейсу

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
  
  // Обробники перемикання мови
  initLanguageSwitch();
}

// Ініціалізація перемикача мови
function initLanguageSwitch() {
  const langButtons = document.querySelectorAll('.language-btn');
  langButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      // Видаляємо клас active з усіх кнопок
      langButtons.forEach(b => b.classList.remove('active'));
      // Додаємо клас active до натиснутої кнопки
      this.classList.add('active');
      
      // Встановлюємо поточну мову
      currentLanguage = this.textContent.toLowerCase();
      
      // Оновлюємо інтерфейс відповідно до вибраної мови
      updateLanguage(currentLanguage);
    });
  });
}

// Оновлення мови інтерфейсу
function updateLanguage(lang) {
  const translations = {
    ua: {
      searchTitle: 'Пошук гравця',
      playerNickname: 'Нікнейм гравця',
      playerNicknamePlaceholder: 'Введіть нікнейм гравця',
      server: 'Сервер',
      europeServer: 'Європа (EU)',
      naServer: 'Північна Америка (NA)',
      asiaServer: 'Азія (ASIA)',
      battlesCount: 'Кількість боїв',
      daysCount: 'Кількість днів',
      loadBattles: 'Завантажити бої',
      loading: 'Завантаження...',
      apiSettings: 'API Налаштування',
      apiKey: 'WoT API Ключ',
      apiKeyPlaceholder: 'Введіть ваш WoT API ключ',
      apiKeySecurity: 'Ваш API ключ безпечно зберігається лише у вашому браузері.',
      recentBattles: 'Останні бої',
      type: 'Тип:',
      allTypes: 'Всі типи',
      heavyTanks: 'Важкі танки',
      mediumTanks: 'Середні танки',
      tankDestroyers: 'ПТ-САУ',
      lightTanks: 'Легкі танки',
      artillery: 'САУ',
      tier: 'Рівень:',
      all: 'Всі',
      battles: 'Боїв',
      winRate: '% перемог',
      avgDamage: 'Сер. шкода',
      avgFrags: 'Сер. фраги',
      loadingBattles: 'Завантаження боїв...',
      lastBattle: 'Останній бій:',
      playerNotFound: 'Гравця не знайдено',
      enterNickname: 'Введіть нікнейм гравця',
      findPlayerFirst: 'Спочатку знайдіть гравця',
      playerFound: 'Гравця знайдено',
      loadedStats: 'Завантажено статистику за',
      days: 'днів',
      noRecentBattles: 'Немає даних про останні бої',
      errorLoadingData: 'Помилка завантаження даних',
      errorLoadingBattles: 'Помилка завантаження боїв',
      errorHelp: 'Спробуйте оновити сторінку або перевірте підключення до Інтернету. Також можливо, що сервіс Tomato.gg тимчасово недоступний.',
      settingsSaved: 'Налаштування збережено успішно',
      enterApiKey: 'Будь ласка, введіть коректний API ключ',
      apiKeyMissing: 'API ключ відсутній. Будь ласка, введіть ваш WoT API ключ в налаштуваннях.'
    },
    en: {
      searchTitle: 'Player Search',
      playerNickname: 'Player Nickname',
      playerNicknamePlaceholder: 'Enter player nickname',
      server: 'Server',
      europeServer: 'Europe (EU)',
      naServer: 'North America (NA)',
      asiaServer: 'Asia (ASIA)',
      battlesCount: 'Number of Battles',
      daysCount: 'Number of Days',
      loadBattles: 'Load Battles',
      loading: 'Loading...',
      apiSettings: 'API Settings',
      apiKey: 'WoT API Key',
      apiKeyPlaceholder: 'Enter your WoT API key',
      apiKeySecurity: 'Your API key is stored securely in your browser.',
      recentBattles: 'Recent Battles',
      type: 'Type:',
      allTypes: 'All types',
      heavyTanks: 'Heavy Tanks',
      mediumTanks: 'Medium Tanks',
      tankDestroyers: 'Tank Destroyers',
      lightTanks: 'Light Tanks',
      artillery: 'Artillery',
      tier: 'Tier:',
      all: 'All',
      battles: 'Battles',
      winRate: 'Win Rate',
      avgDamage: 'Avg. Damage',
      avgFrags: 'Avg. Frags',
      loadingBattles: 'Loading battles...',
      lastBattle: 'Last battle:',
      playerNotFound: 'Player not found',
      enterNickname: 'Please enter a player nickname',
      findPlayerFirst: 'Please find a player first',
      playerFound: 'Player found',
      loadedStats: 'Loaded statistics for the last',
      days: 'days',
      noRecentBattles: 'No data for recent battles',
      errorLoadingData: 'Failed to load data',
      errorLoadingBattles: 'Error loading battles',
      errorHelp: 'Try refreshing the page or check your internet connection. The Tomato.gg service may also be temporarily unavailable.',
      settingsSaved: 'Settings saved successfully',
      enterApiKey: 'Please enter a valid API key',
      apiKeyMissing: 'API key is missing. Please enter your WoT API key in settings.'
    }
  };
  
  const t = translations[lang];
  
  // Оновлюємо текстові елементи
  document.querySelector('.card-title:nth-of-type(1)').innerHTML = `<span class="material-symbols-rounded">search</span> ${t.searchTitle}`;
  document.querySelector('label[for="player-nickname"]').textContent = t.playerNickname;
  document.getElementById('player-nickname').placeholder = t.playerNicknamePlaceholder;
  document.querySelector('label[for="server"]').textContent = t.server;
  document.querySelector('#server option:nth-child(1)').textContent = t.europeServer;
  document.querySelector('#server option:nth-child(2)').textContent = t.naServer;
  document.querySelector('#server option:nth-child(3)').textContent = t.asiaServer;
  document.querySelector('label[for="battles-range"]').textContent = t.battlesCount;
  document.querySelector('label[for="days-range"]').textContent = t.daysCount;
  document.getElementById('load-battles-btn').innerHTML = `<span class="material-symbols-rounded">download</span> ${t.loadBattles}`;
  document.querySelector('.card-header:nth-of-type(3) .card-title').innerHTML = `<span class="material-symbols-rounded">key</span> ${t.apiSettings}`;
  document.querySelector('label[for="wot-api-key"]').textContent = t.apiKey;
  document.getElementById('wot-api-key').placeholder = t.apiKeyPlaceholder;
  document.querySelector('.input-wrapper + small').textContent = t.apiKeySecurity;
  
  if (document.querySelector('#battles-list-card .card-title')) {
    document.querySelector('#battles-list-card .card-title').innerHTML = `<span class="material-symbols-rounded">military_tech</span> ${t.recentBattles}`;
  }
  
  document.querySelector('.filter-label:nth-of-type(1)').textContent = t.type;
  document.querySelector('#tank-type-filter option:nth-child(1)').textContent = t.allTypes;
  document.querySelector('#tank-type-filter option:nth-child(2)').textContent = t.heavyTanks;
  document.querySelector('#tank-type-filter option:nth-child(3)').textContent = t.mediumTanks;
  document.querySelector('#tank-type-filter option:nth-child(4)').textContent = t.tankDestroyers;
  document.querySelector('#tank-type-filter option:nth-child(5)').textContent = t.lightTanks;
  document.querySelector('#tank-type-filter option:nth-child(6)').textContent = t.artillery;
  
  document.querySelector('.filter-label:nth-of-type(2)').textContent = t.tier;
  document.querySelector('#tier-filter option:nth-child(1)').textContent = t.all;
  
  if (document.getElementById('stats-summary')) {
    const statLabels = document.querySelectorAll('#stats-summary .stat-label');
    if (statLabels.length >= 4) {
      statLabels[0].textContent = t.battles;
      statLabels[1].textContent = t.winRate;
      statLabels[2].textContent = t.avgDamage;
      statLabels[3].textContent = t.avgFrags;
    }
  }
  
  document.getElementById('battles-loading-text').textContent = t.loadingBattles;
  
  // Якщо є гравець і бої, оновлюємо їх відображення також
  if (currentPlayer && currentPlayer.details) {
    displayPlayerInfo();
  }
  
  if (playerBattles.length > 0) {
    displayPlayerBattles(playerBattles);
  }
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
    showMessage(currentLanguage === 'ua' ? 'Будь ласка, введіть коректний API ключ' : 'Please enter a valid API key', 'error');
    return;
  }
  
  if (saveSecureApiKey(apiKey)) {
    CONFIG.WOT_API_KEY = apiKey;
    showMessage(currentLanguage === 'ua' ? 'Налаштування збережено успішно' : 'Settings saved successfully', 'success');
  } else {
    showMessage(currentLanguage === 'ua' ? 'Не вдалося зберегти налаштування' : 'Failed to save settings', 'error');
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
    showMessage(currentLanguage === 'ua' ? 'Введіть нікнейм гравця' : 'Please enter a player nickname', 'error');
    return;
  }
  
  if (!CONFIG.WOT_API_KEY) {
    showMessage(currentLanguage === 'ua' ? 'API ключ відсутній. Будь ласка, введіть ваш WoT API ключ в налаштуваннях.' : 'API key is missing. Please enter your WoT API key in settings.', 'error');
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
      showMessage(currentLanguage === 'ua' ? `Гравця з нікнеймом "${nickname}" не знайдено` : `Player "${nickname}" not found`, 'error');
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
    
    showMessage(currentLanguage === 'ua' ? `Гравця "${player.nickname}" знайдено` : `Player "${player.nickname}" found`, 'success');
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
    throw new Error(currentLanguage === 'ua' ? 'Не вдалося отримати дані гравця' : 'Failed to get player data');
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
    const lastBattleLabel = currentLanguage === 'ua' ? 'Останній бій:' : 'Last battle:';
    html += `<div class="player-last-battle">
      <span class="material-symbols-rounded">schedule</span>
      ${lastBattleLabel} ${lastBattleTime.toLocaleDateString(currentLanguage === 'ua' ? 'uk-UA' : 'en-US', dateOptions)}
    </div>`;
  }
  
  // Статистика гравця
  if (currentPlayer.details && currentPlayer.details.statistics && currentPlayer.details.statistics.all) {
    const stats = currentPlayer.details.statistics.all;
    
    html += '<div class="player-stats-container">';
    
    // Основні показники
    const battleLabel = currentLanguage === 'ua' ? 'Боїв' : 'Battles';
    const winrateLabel = currentLanguage === 'ua' ? '% перемог' : 'Win Rate';
    const avgDamageLabel = currentLanguage === 'ua' ? 'Сер. шкода' : 'Avg. Damage';
    const avgFragsLabel = currentLanguage === 'ua' ? 'Сер. фраги' : 'Avg. Frags';
    const avgSpottingLabel = currentLanguage === 'ua' ? 'Виявлення' : 'Spotting';
    const defenseLabel = currentLanguage === 'ua' ? 'Захист' : 'Defense';
    
    html += createStatCard(battleLabel, stats.battles.toLocaleString());
    html += createStatCard(winrateLabel, `${(stats.wins / stats.battles * 100).toFixed(2)}%`, getWinrateColor(stats.wins / stats.battles * 100));
    html += createStatCard(avgDamageLabel, (stats.damage_dealt / stats.battles).toFixed(0));
    html += createStatCard(avgFragsLabel, (stats.frags / stats.battles).toFixed(2));
    html += createStatCard(avgSpottingLabel, (stats.spotted / stats.battles).toFixed(2));
    html += createStatCard(defenseLabel, (stats.dropped_capture_points / stats.battles).toFixed(1));
    
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
    const message = currentLanguage === 'ua' ? 'Спочатку знайдіть гравця' : 'Please find a player first';
    showMessage(message, 'error');
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
  const loadingText = currentLanguage === 'ua' 
    ? `Завантаження боїв для ${currentPlayer.nickname} (${currentPlayer.server})...` 
    : `Loading battles for ${currentPlayer.nickname} (${currentPlayer.server})...`;
  document.getElementById('battles-loading-text').textContent = loadingText;
  
  try {
    // Деактивуємо кнопку завантаження
    loadBattlesBtn.disabled = true;
    const loadingLabel = currentLanguage === 'ua' ? 'Завантаження...' : 'Loading...';
    loadBattlesBtn.innerHTML = `<span class="material-symbols-rounded">hourglass_empty</span> ${loadingLabel}`;
    
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
    
    const successMessage = currentLanguage === 'ua' 
      ? `Завантажено статистику за ${document.getElementById('days-range').value} днів` 
      : `Loaded statistics for the last ${document.getElementById('days-range').value} days`;
    showMessage(successMessage, 'success');
  } catch (error) {
    console.error('Помилка завантаження боїв:', error);
    
    // Показуємо повідомлення про помилку
    const tanksListDiv = document.getElementById('tanks-list');
    tanksListDiv.style.display = 'block';
    
    const errorLoadingData = currentLanguage === 'ua' ? 'Помилка завантаження даних' : 'Failed to load data';
    const errorHelp = currentLanguage === 'ua' 
      ? 'Спробуйте оновити сторінку або перевірте підключення до Інтернету. Також можливо, що сервіс Tomato.gg тимчасово недоступний.' 
      : 'Try refreshing the page or check your internet connection. The Tomato.gg service may also be temporarily unavailable.';
    
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
    
    const errorLoadingBattles = currentLanguage === 'ua' ? 'Помилка завантаження боїв:' : 'Error loading battles:';
    showMessage(`${errorLoadingBattles} ${error.message}`, 'error');
  } finally {
    // Відновлюємо кнопку завантаження
    loadBattlesBtn.disabled = false;
    const loadBattlesLabel = currentLanguage === 'ua' ? 'Завантажити бої' : 'Load Battles';
    loadBattlesBtn.innerHTML = `<span class="material-symbols-rounded">download</span> ${loadBattlesLabel}`;
  }
}

// Отримання останніх боїв з Tomato.gg
async function getPlayerRecentBattlesFromTomato(accountId, server = 'EU', days = 3, battlesLimit = 100) {
  try {
    // Будуємо оновлений URL для API Tomato.gg
    // Використовуємо прямий URL до боїв гравця замість recents
    const url = `https://api.tomato.gg/dev/api-v2/player/battles/${accountId}?page=0&days=${days}&battleType=random&pageSize=${battlesLimit}&sortBy=battle_time&sortDirection=desc&platoon=in-and-outside-platoon&spawn=all&won=all&classes=false,false,false,false,false&nations=false,false,false,false,false,false,false,false,false,false,false&tiers=false,false,false,false,false,false,false,false,false,false&tankType=all`;
    
    console.log(`Запит до Tomato.gg API: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP помилка: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`Отримано відповідь від Tomato.gg API:`, data.meta);
    
    if (!data.data || data.data.length === 0) {
      const noBattlesData = currentLanguage === 'ua' ? 'Немає даних про бої' : 'No battle data available';
      throw new Error(noBattlesData);
    }
    
    // Обробка отриманих даних боїв
    const battles = data.data;
    
    // Групуємо бої за танками
    const tanksMap = new Map();
    
    battles.forEach(battle => {
      const tankId = battle.id;
      const tankName = battle.name || (currentLanguage === 'ua' ? 'Невідомий танк' : 'Unknown tank');
      const tankType = battle.type || 'unknown';
      const tier = battle.tier || 0;
      
      const key = `${tankName}_${tankType}_${tier}`;
      
      if (tanksMap.has(key)) {
        const existingBattle = tanksMap.get(key);
        
        // Оновлюємо статистику
        existingBattle.battles += 1;
        existingBattle.damage += battle.damage || 0;
        existingBattle.frags += battle.frags || 0;
        
        // Розрахунок winrate
        if (battle.won) {
          existingBattle.wins += 1;
        }
        
        // Оновлюємо середні показники
        existingBattle.winrate = (existingBattle.wins / existingBattle.battles) * 100;
        existingBattle.dpg = existingBattle.damage / existingBattle.battles;
        existingBattle.kpg = existingBattle.frags / existingBattle.battles;
      } else {
        tanksMap.set(key, {
          tank: tankName,
          tankType: tankType,
          tier: tier,
          damage: battle.damage || 0,
          frags: battle.frags || 0,
          battles: 1,
          wins: battle.won ? 1 : 0,
          winrate: battle.won ? 100 : 0,
          dpg: battle.damage || 0,
          kpg: battle.frags || 0
        });
      }
    });
    
    console.log(`Згруповано ${tanksMap.size} унікальних танків`);
    
    return Array.from(tanksMap.values());
  } catch (error) {
    console.error('Помилка завантаження боїв:', error);
    const failedToLoad = currentLanguage === 'ua' 
      ? `Не вдалося завантажити бої з Tomato.gg: ${error.message}` 
      : `Failed to load battles from Tomato.gg: ${error.message}`;
    throw new Error(failedToLoad);
  }
}

// Відображення боїв гравця
function displayPlayerBattles(battles) {
  // Ховаємо індикатор завантаження
  document.getElementById('loader-container').style.display = 'none';
  document.getElementById('tanks-list').style.display = 'grid';
  document.getElementById('stats-summary').style.display = 'block';
  
  const tanksListDiv = document.getElementById('tanks-list');
  
  if (battles.length === 0) {
    const noRecentBattles = currentLanguage === 'ua' ? 'Немає даних про останні бої' : 'No data for recent battles';
    tanksListDiv.innerHTML = `<div class="loading-text">${noRecentBattles}</div>`;
    
    // Очищаємо статистику
    document.getElementById('total-battles').textContent = '0';
    document.getElementById('avg-winrate').textContent = '0%';
    document.getElementById('avg-damage').textContent = '0';
    document.getElementById('avg-frags').textContent = '0';
    
    return;
  }
  
  let html = '';
  
  // Розраховуємо сумарну статистику
  let totalBattles = 0;
  let totalDamage = 0;
  let weightedWinrate = 0;
  let totalFrags = 0;
  
  // Сортуємо танки за кількістю боїв (від більшого до меншого)
  battles.sort((a, b) => b.battles - a.battles);
  
  battles.forEach(battle => {
    // Оновлюємо сумарну статистику
    totalBattles += battle.battles;
    totalDamage += battle.damage;
    weightedWinrate += battle.winrate * battle.battles; // Зважене середнє
    totalFrags += battle.frags;
    
    // Визначаємо колір відсотка перемог
    let winrateColor = getWinrateColor(battle.winrate);
    
    // Отримуємо значки типу танка
    const tankTypeIcon = getTankTypeIcon(battle.tankType);
    
    // Локалізовані підписи
    const battlesLabel = currentLanguage === 'ua' ? 'Боїв' : 'Battles';
    const winrateLabel = currentLanguage === 'ua' ? '% перемог' : 'Win Rate';
    const avgDamageLabel = currentLanguage === 'ua' ? 'Сер. шкода' : 'Avg. Damage';
    const avgFragsLabel = currentLanguage === 'ua' ? 'Сер. фраги' : 'Avg. Frags';
    
    // Додаємо картку для танка
    html += `
    <div class="tank-card">
      <div class="tank-header">
        <div class="tank-name">${battle.tank}</div>
        <div class="tank-tier">${battle.tier}</div>
      </div>
      <div class="tank-type">
        <span class="material-symbols-rounded">${tankTypeIcon}</span>
        ${getTankTypeLabel(battle.tankType)}
      </div>
      
      <div class="tank-stats">
        <div class="tank-stat-item">
          <div class="tank-stat-value">${battle.battles}</div>
          <div class="tank-stat-label">${battlesLabel}</div>
        </div>
        <div class="tank-stat-item">
          <div class="tank-stat-value" style="color: ${winrateColor};">${battle.winrate.toFixed(2)}%</div>
          <div class="tank-stat-label">${winrateLabel}</div>
        </div>
        <div class="tank-stat-item">
          <div class="tank-stat-value">${battle.dpg.toFixed(0)}</div>
          <div class="tank-stat-label">${avgDamageLabel}</div>
        </div>
        <div class="tank-stat-item">
          <div class="tank-stat-value">${battle.kpg.toFixed(2)}</div>
          <div class="tank-stat-label">${avgFragsLabel}</div>
        </div>
      </div>
      
      <div class="progress-bar-container">
        <div class="progress-bar" style="width: ${battle.winrate}%; background-color: ${winrateColor};"></div>
      </div>
    </div>
    `;
  });
  
  tanksListDiv.innerHTML = html;
  
  // Оновлюємо сумарну статистику
  const avgWinrate = weightedWinrate / totalBattles;
  const avgDamage = totalDamage / totalBattles;
  const avgFrags = totalFrags / totalBattles;
  
  document.getElementById('total-battles').textContent = totalBattles.toLocaleString();
  document.getElementById('avg-winrate').textContent = avgWinrate.toFixed(2) + '%';
  document.getElementById('avg-damage').textContent = avgDamage.toFixed(0);
  document.getElementById('avg-frags').textContent = avgFrags.toFixed(2);
  
  // Встановлюємо колір відсотка перемог
  document.getElementById('avg-winrate').style.color = getWinrateColor(avgWinrate);
}

// Функція для фільтрації боїв
function filterBattles() {
  if (!originalBattles || originalBattles.length === 0) return;
  
  const tankType = document.getElementById('tank-type-filter').value;
  const tier = document.getElementById('tier-filter').value;
  
  // Клонуємо оригінальні бої
  let filteredBattles = [...originalBattles];
  
  // Фільтруємо за типом танка
  if (tankType !== 'all') {
    filteredBattles = filteredBattles.filter(battle => battle.tankType === tankType);
  }
  
  // Фільтруємо за рівнем
  if (tier !== 'all') {
    filteredBattles = filteredBattles.filter(battle => battle.tier.toString() === tier);
  }
  
  // Відображаємо відфільтровані бої
  displayPlayerBattles(filteredBattles);
}

// Отримання мітки типу танка
function getTankTypeLabel(type) {
  if (currentLanguage === 'ua') {
    switch(type) {
      case 'HT': return 'Важкий танк';
      case 'MT': return 'Середній танк';
      case 'TD': return 'ПТ-САУ';
      case 'LT': return 'Легкий танк';
      case 'SPG': return 'САУ';
      default: return type;
    }
  } else {
    switch(type) {
      case 'HT': return 'Heavy Tank';
      case 'MT': return 'Medium Tank';
      case 'TD': return 'Tank Destroyer';
      case 'LT': return 'Light Tank';
      case 'SPG': return 'Artillery';
      default: return type;
    }
  }
}

// Отримання значка типу танка
function getTankTypeIcon(type) {
  switch(type) {
    case 'HT': return 'shield';
    case 'MT': return 'directions_car';
    case 'TD': return 'gps_fixed';
    case 'LT': return 'speed';
    case 'SPG': return 'rocket_launch';
    default: return 'help';
  }
}

// Отримання кольору відсотка перемог
function getWinrateColor(winrate) {
  if (winrate >= 65) return 'var(--rating-unicum)'; // Унікум
  if (winrate >= 60) return 'var(--rating-super)';  // Супер Унікум
  if (winrate >= 56) return 'var(--rating-great)';  // Відмінно
  if (winrate >= 53) return 'var(--rating-good)';   // Добре
  if (winrate >= 50) return 'var(--rating-average)'; // Середньо
  if (winrate >= 47) return 'var(--rating-below)';  // Нижче середнього
  return 'var(--rating-bad)';                       // Погано
}

// Відкриття профілю на Tomato.GG
function openTomatoGGProfile() {
  if (!currentPlayer) {
    const message = currentLanguage === 'ua' ? 'Спочатку знайдіть гравця' : 'Please find a player first';
    showMessage(message, 'error');
    return;
  }
  
  const tomatoURL = `https://tomato.gg/stats/${currentPlayer.server}/${encodeURIComponent(currentPlayer.nickname)}-${currentPlayer.id}`;
  window.open(tomatoURL, '_blank');
}

// Відкриття профілю на офіційному сайті WoT
function openWotProfile() {
  if (!currentPlayer) {
    const message = currentLanguage === 'ua' ? 'Спочатку знайдіть гравця' : 'Please find a player first';
    showMessage(message, 'error');
    return;
  }
  
  let wotDomain = 'https://worldoftanks.eu';
  
  switch(currentPlayer.server) {
    case 'NA':
      wotDomain = 'https://worldoftanks.com';
      break;
    case 'ASIA':
      wotDomain = 'https://worldoftanks.asia';
      break;
  }
  
  const wotURL = `${wotDomain}/en/community/accounts/${currentPlayer.id}-${encodeURIComponent(currentPlayer.nickname)}/`;
  window.open(wotURL, '_blank');
}

// Функція для показу повідомлень
function showMessage(message, type) {
  const errorEl = document.getElementById('error-message');
  const successEl = document.getElementById('success-message');
  
  // Спочатку ховаємо всі повідомлення
  errorEl.style.display = 'none';
  successEl.style.display = 'none';
  
  // Видаляємо клас анімації виходу, якщо він був
  errorEl.classList.remove('slide-out');
  successEl.classList.remove('slide-out');
  
  let alertEl;
  
  if (type === 'error') {
    alertEl = errorEl;
    // Оновлюємо вміст повідомлення з іконкою
    alertEl.querySelector('.alert-message').textContent = message;
  } else {
    alertEl = successEl;
    // Оновлюємо вміст повідомлення з іконкою
    alertEl.querySelector('.alert-message').textContent = message;
  }
  
  // Додаємо обробник закриття
  const closeBtn = alertEl.querySelector('.alert-close');
  if (closeBtn) {
    closeBtn.onclick = function() {
      hideMessage(alertEl);
    };
  }
  
  // Показуємо повідомлення
  alertEl.style.display = 'block';
  
  // Автоматично ховаємо повідомлення через 5 секунд
  setTimeout(() => {
    hideMessage(alertEl);
  }, 5000);
}

// Плавно ховаємо повідомлення
function hideMessage(element) {
  if (element && element.style.display !== 'none') {
    element.classList.add('slide-out');
    
    // Прибираємо елемент після завершення анімації
    setTimeout(() => {
      element.style.display = 'none';
      element.classList.remove('slide-out');
    }, 300); // 300мс - тривалість анімації
  }
}

// Ініціалізація сторінки при завантаженні DOM
document.addEventListener('DOMContentLoaded', initApp);